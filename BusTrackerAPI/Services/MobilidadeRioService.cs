using System.Text.Json;
using System.Text.Json.Serialization;
using System.Globalization;
using BusTrackerAPI.Configuration;
using BusTrackerAPI.DTOs;
using BusTrackerAPI.Models;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace BusTrackerAPI.Services;

public class MobilidadeRioService : IMobilidadeRioService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly ILogger<MobilidadeRioService> _logger;
    private readonly MobilidadeRioOptions _options;
    private readonly IBusStationaryTracker _stationaryTracker;

    private const string CacheKeyAllBuses = "buses:all";
    private const string CacheKeyLines    = "buses:lines";

    private static DateTime RioNow => DateTime.UtcNow.AddHours(-3);

    // Garante que apenas UMA chamada externa ocorre por vez no caso de cache miss inicial.
    private static readonly SemaphoreSlim _fetchLock = new(1, 1);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        NumberHandling = JsonNumberHandling.AllowReadingFromString,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public MobilidadeRioService(
        HttpClient httpClient,
        IMemoryCache cache,
        ILogger<MobilidadeRioService> logger,
        IOptions<MobilidadeRioOptions> options,
        IBusStationaryTracker stationaryTracker)
    {
        _httpClient = httpClient;
        _cache = cache;
        _logger = logger;
        _options = options.Value;
        _stationaryTracker = stationaryTracker;
    }

    // ── Leitura do cache (caminho quente — usuários) ───────────────────────────

    public Task<IEnumerable<BusPosition>> GetBusPositionsAsync(CancellationToken ct = default)
    {
        if (_cache.TryGetValue(CacheKeyAllBuses, out IEnumerable<BusPosition>? cached) && cached is not null)
        {
            _logger.LogDebug("Cache hit: {Count} ônibus servidos da memória", cached.Count());
            return Task.FromResult(cached);
        }

        // Cache miss (primeira inicialização ou falha prolongada do worker).
        // Apenas neste caso o usuário espera — e apenas UM usuário espera (o resto aguarda no lock).
        return FetchWithLockAsync(ct);
    }

    /// <summary>
    /// Forçado pelo BackgroundBusRefreshService — sempre chama a API externa,
    /// atualiza o cache com TTL de fallback estendido e retorna os dados novos.
    /// </summary>
    public async Task<IEnumerable<BusPosition>> ForceRefreshAsync(CancellationToken ct = default)
    {
        await _fetchLock.WaitAsync(ct);
        try
        {
            return await FetchAndPopulateCacheAsync(ct);
        }
        finally
        {
            _fetchLock.Release();
        }
    }

    public Task<IEnumerable<BusPosition>> GetBusPositionsByLineAsync(string linha, CancellationToken ct = default)
        => GetBusPositionsAsync(ct).ContinueWith(t =>
            t.Result.Where(b => string.Equals(b.Linha, linha, StringComparison.OrdinalIgnoreCase)),
            ct, TaskContinuationOptions.OnlyOnRanToCompletion, TaskScheduler.Default);

    public async Task<IEnumerable<string>> GetActiveLinesAsync(CancellationToken ct = default)
    {
        if (_cache.TryGetValue(CacheKeyLines, out IEnumerable<string>? cachedLines) && cachedLines is not null)
            return cachedLines;

        var all = await GetBusPositionsAsync(ct);

        var lines = all
            .Select(b => b.Linha)
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(l => l)
            .ToList();

        var fallbackTtl = TimeSpan.FromSeconds(_options.CacheSegundos * _options.FallbackCacheMultiplicador);
        _cache.Set(CacheKeyLines, lines,
            new MemoryCacheEntryOptions().SetAbsoluteExpiration(fallbackTtl));

        return lines;
    }

    public async Task<int> IngestBusPositionsAsync(IEnumerable<SppoRawEntryDto> rawEntries, CancellationToken ct = default)
    {
        if (rawEntries == null || !rawEntries.Any())
        {
            return 0;
        }

        var now = RioNow;
        var twoMinutesAgo = now.AddMinutes(-2);
        var futureLimit = now.AddMinutes(1);

        // Filtrar posições que pertencem aos últimos 2 minutos
        var filteredRaw = rawEntries
            .Where(entry =>
            {
                var parsedDate = ParseDataHora(entry.DataHora);
                return parsedDate >= twoMinutesAgo && parsedDate <= futureLimit;
            })
            .ToList();

        if (filteredRaw.Count == 0)
        {
            _logger.LogWarning("Ingestão: nenhum registro dos {Total} recebidos está dentro da janela de 2 minutos (entre {Inicio} e {Fim}).", 
                rawEntries.Count(), twoMinutesAgo.ToString("HH:mm:ss"), futureLimit.ToString("HH:mm:ss"));
            return 0;
        }

        // Mapear, validar e de-duplicar pela ordem mais recente
        var positions = filteredRaw
            .Select(MapToModel)
            .Where(IsValidPosition)
            .GroupBy(p => p.Ordem, StringComparer.OrdinalIgnoreCase)
            .Select(g => g.OrderByDescending(p => p.DataHora).First())
            .ToList();

        if (positions.Count == 0)
        {
            _logger.LogWarning("Ingestão: registros foram filtrados pela janela de tempo, mas nenhum resultou em uma posição válida.");
            return 0;
        }

        await _fetchLock.WaitAsync(ct);
        try
        {
            // Atualiza o histórico para o filtro de ônibus parados.
            _stationaryTracker.UpdateHistory(positions);

            var fallbackTtl = TimeSpan.FromSeconds(_options.CacheSegundos * _options.FallbackCacheMultiplicador);

            _cache.Set(CacheKeyAllBuses, (IEnumerable<BusPosition>)positions,
                new MemoryCacheEntryOptions().SetAbsoluteExpiration(fallbackTtl));
            _cache.Remove(CacheKeyLines);

            _logger.LogInformation("✓ Ingestão externa processada: {Filtrado} registros válidos e de-duplicados em cache (de {Total} enviados).", 
                positions.Count, rawEntries.Count());

            return positions.Count;
        }
        finally
        {
            _fetchLock.Release();
        }
    }

    // ── Internos ───────────────────────────────────────────────────────────────

    /// <summary>
    /// Usado no cache-miss do caminho de leitura do usuário.
    /// Garante que apenas uma thread chame a API externa por vez.
    /// </summary>
    private async Task<IEnumerable<BusPosition>> FetchWithLockAsync(CancellationToken ct)
    {
        await _fetchLock.WaitAsync(ct);
        try
        {
            // Double-check após adquirir o lock — outra thread pode ter populado o cache.
            if (_cache.TryGetValue(CacheKeyAllBuses, out IEnumerable<BusPosition>? cached) && cached is not null)
            {
                _logger.LogDebug("Cache populado por outra thread enquanto aguardávamos o lock.");
                return cached;
            }

            return await FetchAndPopulateCacheAsync(ct);
        }
        finally
        {
            _fetchLock.Release();
        }
    }

    /// <summary>
    /// Chama a API externa, atualiza o tracker de ônibus parados e salva no cache com TTL de FALLBACK.
    /// O TTL de fallback é CacheSegundos × FallbackCacheMultiplicador (padrão: 30s × 5 = 150s).
    /// Isso garante que mesmo que o worker falhe algumas vezes, o usuário não veja erro.
    /// </summary>
    private async Task<IEnumerable<BusPosition>> FetchAndPopulateCacheAsync(CancellationToken ct)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var positions = await FetchFromApiAsync(ct);
        sw.Stop();

        _logger.LogInformation("API externa respondeu em {Ms}ms com {Count} ônibus filtrados.",
            sw.ElapsedMilliseconds, positions.Count);

        // Atualiza o histórico de posições para o filtro de ônibus parados.
        _stationaryTracker.UpdateHistory(positions);

        // TTL estendido: o cache dura muito mais que o intervalo de refresh.
        // Assim, se o worker falhar algumas vezes, o usuário continua sendo servido.
        var fallbackTtl = TimeSpan.FromSeconds(_options.CacheSegundos * _options.FallbackCacheMultiplicador);

        _cache.Set(CacheKeyAllBuses, (IEnumerable<BusPosition>)positions,
            new MemoryCacheEntryOptions().SetAbsoluteExpiration(fallbackTtl));
        _cache.Remove(CacheKeyLines);

        return positions;
    }

    // ── Chamada HTTP ───────────────────────────────────────────────────────────

    private async Task<List<BusPosition>> FetchFromApiAsync(CancellationToken ct)
    {
        var dataFinal = RioNow;
        var dataInicial = dataFinal.AddMinutes(-_options.JanelaTempoMinutos);

        var dataInicialStr = dataInicial.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture);
        var dataFinalStr = dataFinal.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture);

        var url = $"/gps/sppo?dataInicial={Uri.EscapeDataString(dataInicialStr)}&dataFinal={Uri.EscapeDataString(dataFinalStr)}";

        _logger.LogInformation("→ Chamando API Mobilidade Rio: {Url}", url);

        try
        {
            // ResponseHeadersRead: não aguarda o corpo inteiro antes de retornar o HttpResponseMessage.
            // O JSON é deserializado diretamente do stream, sem alocar string intermediária (~10 MB).
            using var response = await _httpClient.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, ct);
            response.EnsureSuccessStatusCode();

            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            var raw = await JsonSerializer.DeserializeAsync<List<SppoRawEntryDto>>(stream, JsonOptions, ct);

            if (raw is null || raw.Count == 0)
            {
                _logger.LogWarning("API retornou lista vazia ou nula");
                return [];
            }

            var positions = raw
                .Select(MapToModel)
                .Where(IsValidPosition)
                .GroupBy(p => p.Ordem, StringComparer.OrdinalIgnoreCase)
                .Select(g => g.OrderByDescending(p => p.DataHora).First())
                .ToList();

            if (positions.Count == 0 && raw.Count > 0)
            {
                var firstRaw = raw.First();
                _logger.LogWarning(
                    "Todos os registros foram descartados. Exemplo bruto: ordem={Ordem}, linha={Linha}, lat={Lat}, lng={Lng}, datahora={DataHora}",
                    firstRaw.Ordem, firstRaw.Linha,
                    firstRaw.Latitude?.ToString(), firstRaw.Longitude?.ToString(),
                    firstRaw.DataHora?.ToString());
            }

            _logger.LogInformation("← API retornou {Total} registros brutos → {Filtrado} ônibus ativos",
                raw.Count, positions.Count);

            return positions;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Erro HTTP ao chamar API Mobilidade Rio");
            throw;
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            _logger.LogError(ex, "Timeout ao chamar API Mobilidade Rio");
            throw new TimeoutException("A API de mobilidade do Rio não respondeu a tempo.", ex);
        }
    }

    // ── Mapeamento ─────────────────────────────────────────────────────────────

    private static BusPosition MapToModel(SppoRawEntryDto raw) => new()
    {
        Ordem      = raw.Ordem ?? string.Empty,
        Linha      = raw.Linha ?? string.Empty,
        Latitude   = ParseDouble(raw.Latitude),
        Longitude  = ParseDouble(raw.Longitude),
        Velocidade = raw.Velocidade,
        DataHora   = ParseDataHora(raw.DataHora),
        Sentido    = raw.Sentido,
        Trajeto    = raw.Trajeto,
    };

    private static bool IsValidPosition(BusPosition p) =>
        !string.IsNullOrWhiteSpace(p.Ordem) &&
        !string.IsNullOrWhiteSpace(p.Linha) &&
        !double.IsNaN(p.Latitude) &&
        !double.IsNaN(p.Longitude) &&
        p.Latitude  is >= -90  and <= 90 &&
        p.Longitude is >= -180 and <= 180 &&
        !(p.Latitude == 0 && p.Longitude == 0) &&
        p.DataHora != default &&
        p.DataHora <= RioNow.AddMinutes(5);

    private static double ParseDouble(object? value) => value switch
    {
        double d   => d,
        float  f   => f,
        decimal m  => (double)m,
        int    i   => i,
        long   l   => l,
        JsonElement { ValueKind: JsonValueKind.Number  } e when e.TryGetDouble(out var n) => n,
        JsonElement { ValueKind: JsonValueKind.String  } e => ParseDouble(e.GetString()),
        string s when double.TryParse(s.Replace(',', '.'),
            NumberStyles.Any, CultureInfo.InvariantCulture, out var p) => p,
        _ => 0
    };

    private static DateTime ParseDataHora(object? value) => value switch
    {
        null    => RioNow,
        long    v => ParseUnix(v),
        int     v => ParseUnix(v),
        double  v => ParseUnix((long)v),
        decimal v => ParseUnix((long)v),
        JsonElement { ValueKind: JsonValueKind.Number } e when e.TryGetInt64(out var u) => ParseUnix(u),
        JsonElement { ValueKind: JsonValueKind.String } e => ParseDataHora(e.GetString()),
        string s when long.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var u) => ParseUnix(u),
        string s when DateTime.TryParseExact(s, "yyyy-MM-dd HH:mm:ss",
            CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt) => dt,
        string s when DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt) => dt,
        _ => RioNow
    };

    private static DateTime ParseUnix(long unix)
    {
        if (unix <= 0) return RioNow;
        try
        {
            return unix > 253_402_300_799
                ? DateTimeOffset.FromUnixTimeMilliseconds(unix).LocalDateTime
                : DateTimeOffset.FromUnixTimeSeconds(unix).LocalDateTime;
        }
        catch (ArgumentOutOfRangeException) { return RioNow; }
    }
}
