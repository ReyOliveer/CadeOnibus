using BusTrackerAPI.Configuration;
using Microsoft.Extensions.Options;

namespace BusTrackerAPI.Services;

/// <summary>
/// Serviço em background responsável por manter o cache aquecido.
/// 
/// IMPORTANTE: Este é o ÚNICO componente que chama a API externa de mobilidade.
/// As requisições dos usuários lêem exclusivamente do cache em memória (< 1ms).
///
/// Fluxo:
///   1. Ao iniciar: chama ForceRefreshAsync imediatamente para aquecer o cache.
///   2. A cada `CacheSegundos` (padrão: 30s): chama ForceRefreshAsync novamente.
///   3. O cache tem TTL de fallback = CacheSegundos × FallbackCacheMultiplicador (padrão: 150s).
///      → Mesmo que o worker falhe 4 vezes seguidas, o usuário continua sendo servido.
/// </summary>
public class BackgroundBusRefreshService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BackgroundBusRefreshService> _logger;
    private readonly TimeSpan _interval;

    public BackgroundBusRefreshService(
        IServiceScopeFactory scopeFactory,
        IOptions<MobilidadeRioOptions> options,
        ILogger<BackgroundBusRefreshService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _interval = TimeSpan.FromSeconds(options.Value.CacheSegundos);
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        _logger.LogInformation(
            "BackgroundBusRefreshService iniciado. Intervalo de refresh: {Segundos}s",
            _interval.TotalSeconds);

        // Aquece o cache imediatamente no startup — o primeiro usuário não vai esperar.
        try
        {
            await ForceRefreshAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao aquecer cache no startup. O serviço tentará novamente.");
        }

        using var timer = new PeriodicTimer(_interval);

        while (!ct.IsCancellationRequested && await timer.WaitForNextTickAsync(ct))
        {
            await ForceRefreshAsync(ct);
        }
    }

    private async Task ForceRefreshAsync(CancellationToken ct)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var svc = scope.ServiceProvider.GetRequiredService<IMobilidadeRioService>();

            // ForceRefreshAsync bypassa o cache e sempre chama a API externa.
            // Isso é o oposto de GetBusPositionsAsync (que serve do cache).
            var buses = await svc.ForceRefreshAsync(ct);

            sw.Stop();
            _logger.LogInformation(
                "   Cache atualizado em background em {Ms}ms — {Total} ônibus ativos",
                sw.ElapsedMilliseconds, buses.Count());
        }
        catch (OperationCanceledException)
        {
            // Shutdown normal da aplicação — não logar como erro.
        }
        catch (Exception ex)
        {
            sw.Stop();
            // Loga e continua — uma falha não deve derrubar o serviço.
            // O cache de fallback garante que os usuários continuem sendo servidos.
            _logger.LogWarning(ex,
                "✗ Falha no refresh em background após {Ms}ms. Cache de fallback ativo. Próxima tentativa em {Segundos}s",
                sw.ElapsedMilliseconds, _interval.TotalSeconds);
        }
    }
}
