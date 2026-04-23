using System.Text.Json;
using System.Text.Json.Serialization;
using System.Globalization;
using BusTrackerAPI.Configuration;
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
    private const string CacheKeyLines = "buses:lines";

    // Garante que apenas uma chamada externa ocorre por vez.
    // Requisições simultâneas com cache expirado aguardam a primeira completar.
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

    public async Task<IEnumerable<BusPosition>> GetBusPositionsAsync(CancellationToken ct = default)
    {
        if (_cache.TryGetValue(CacheKeyAllBuses, out IEnumerable<BusPosition>? cached) && cached is not null)
        {
            _logger.LogDebug("Retornando {Count} ônibus do cache", cached.Count());
            return cached;
        }

        await _fetchLock.WaitAsync(ct);
        try
        {
            // Double-check: outra requisição pode ter populado o cache enquanto aguardávamos.
            if (_cache.TryGetValue(CacheKeyAllBuses, out cached) && cached is not null)
            {
                _logger.LogDebug("Cache populado por outra requisição, retornando {Count} ônibus", cached.Count());
                return cached;
            }

            var positions = await FetchFromApiAsync(ct);

            // Atualiza o tracker com as posições atuais — base para o filtro de ônibus parados.
            _stationaryTracker.UpdateHistory(positions);

            _cache.Set(CacheKeyAllBuses, positions,
                new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromSeconds(_options.CacheSegundos)));
            _cache.Remove(CacheKeyLines);

            return positions;
        }
        finally
        {
            _fetchLock.Release();
        }
    }

    public async Task<IEnumerable<BusPosition>> GetBusPositionsByLineAsync(string linha, CancellationToken ct = default)
    {
        var all = await GetBusPositionsAsync(ct);
        return all.Where(b => string.Equals(b.Linha, linha, StringComparison.OrdinalIgnoreCase));
    }

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

        _cache.Set(CacheKeyLines, lines,
            new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromSeconds(_options.CacheSegundos)));

        return lines;
    }

    private async Task<List<BusPosition>> FetchFromApiAsync(CancellationToken ct)
    {
        const string url = "/gps/sppo";

        _logger.LogInformation("Chamando API Mobilidade Rio: {Url}", url);

        try
        {
            // ResponseHeadersRead: não aguarda o corpo inteiro antes de retornar o HttpResponseMessage.
            // O JSON é desserializado diretamente do stream, sem alocar string intermediária.
            using var response = await _httpClient.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, ct);
            response.EnsureSuccessStatusCode();

            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            var raw = await JsonSerializer.DeserializeAsync<List<SppoRawEntry>>(stream, JsonOptions, ct);

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
                    "Todos os registros foram descartados. Exemplo bruto: ordem={Ordem}, linha={Linha}, latitude={Latitude}, longitude={Longitude}, datahora={DataHora}, extras={Extras}",
                    firstRaw.Ordem,
                    firstRaw.Linha,
                    firstRaw.Latitude?.ToString(),
                    firstRaw.Longitude?.ToString(),
                    firstRaw.DataHora?.ToString(),
                    firstRaw.ExtensionData is null
                        ? "nenhum"
                        : string.Join(", ", firstRaw.ExtensionData.Keys));
            }

            _logger.LogInformation("Recebidos {Total} ônibus da API (após filtro: {Filtrado})",
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

    private static BusPosition MapToModel(SppoRawEntry raw) => new()
    {
        Ordem     = raw.Ordem ?? string.Empty,
        Linha     = raw.Linha ?? string.Empty,
        Latitude  = ParseDouble(raw.Latitude),
        Longitude = ParseDouble(raw.Longitude),
        Velocidade = raw.Velocidade,
        DataHora  = ParseDataHora(raw.DataHora),
        Sentido   = raw.Sentido,
        Trajeto   = raw.Trajeto,
    };

    private static bool IsValidPosition(BusPosition position)
    {
        return
            !string.IsNullOrWhiteSpace(position.Ordem) &&
            !string.IsNullOrWhiteSpace(position.Linha) &&
            !double.IsNaN(position.Latitude) &&
            !double.IsNaN(position.Longitude) &&
            position.Latitude is >= -90 and <= 90 &&
            position.Longitude is >= -180 and <= 180 &&
            !(position.Latitude == 0 && position.Longitude == 0);
    }

    private static double ParseDouble(object? value)
    {
        return value switch
        {
            double d => d,
            float f => f,
            decimal m => (double)m,
            int i => i,
            long l => l,
            JsonElement { ValueKind: JsonValueKind.Number } element when element.TryGetDouble(out var numericValue) => numericValue,
            JsonElement { ValueKind: JsonValueKind.String } element => ParseDouble(element.GetString()),
            // A API retorna coordenadas com vírgula como separador decimal (pt-BR).
            // Substituímos vírgula por ponto antes de parsear para evitar que
            // InvariantCulture interprete a vírgula como separador de milhares.
            string s when double.TryParse(s.Replace(',', '.'),
                NumberStyles.Any,
                CultureInfo.InvariantCulture,
                out var parsed) => parsed,
            _ => 0
        };
    }

    private static DateTime ParseDataHora(object? value)
    {
        return value switch
        {
            null => DateTime.Now,
            long unixValue => ParseUnixTimestamp(unixValue),
            int unixValue => ParseUnixTimestamp(unixValue),
            double unixValue => ParseUnixTimestamp((long)unixValue),
            decimal unixValue => ParseUnixTimestamp((long)unixValue),
            JsonElement { ValueKind: JsonValueKind.Number } element when element.TryGetInt64(out var unixValue)
                => ParseUnixTimestamp(unixValue),
            JsonElement { ValueKind: JsonValueKind.String } element => ParseDataHora(element.GetString()),
            string s when long.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var unixFromString)
                => ParseUnixTimestamp(unixFromString),
            string s when DateTime.TryParseExact(s, "yyyy-MM-dd HH:mm:ss",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None, out var dt) => dt,
            string s when DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate)
                => parsedDate,
            _ => DateTime.Now
        };
    }

    private static DateTime ParseUnixTimestamp(long unixValue)
    {
        if (unixValue <= 0)
            return DateTime.Now;

        // A API pode retornar Unix time em segundos ou milissegundos.
        try
        {
            if (unixValue > 253_402_300_799)
                return DateTimeOffset.FromUnixTimeMilliseconds(unixValue).LocalDateTime;

            return DateTimeOffset.FromUnixTimeSeconds(unixValue).LocalDateTime;
        }
        catch (ArgumentOutOfRangeException)
        {
            return DateTime.Now;
        }
    }

    private sealed class SppoRawEntry
    {
        [JsonPropertyName("ordem")]     public string? Ordem     { get; set; }
        [JsonPropertyName("linha")]     public string? Linha     { get; set; }
        [JsonPropertyName("latitude")]  public object? Latitude  { get; set; }
        [JsonPropertyName("longitude")] public object? Longitude { get; set; }
        [JsonPropertyName("velocidade")]public double  Velocidade{ get; set; }
        [JsonPropertyName("datahora")]  public object? DataHora  { get; set; }
        [JsonPropertyName("sentido")]   public string? Sentido   { get; set; }
        [JsonPropertyName("trajeto")]   public string? Trajeto   { get; set; }
        [JsonExtensionData]             public Dictionary<string, JsonElement>? ExtensionData { get; set; }
    }
}
