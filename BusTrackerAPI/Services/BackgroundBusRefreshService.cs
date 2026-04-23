using BusTrackerAPI.Configuration;
using Microsoft.Extensions.Options;

namespace BusTrackerAPI.Services;

public class BackgroundBusRefreshService(
    IServiceScopeFactory scopeFactory,
    IOptions<MobilidadeRioOptions> options,
    ILogger<BackgroundBusRefreshService> logger) : BackgroundService
{
    private readonly TimeSpan _interval = TimeSpan.FromSeconds(30);

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        logger.LogInformation("Background refresh iniciado (intervalo: {Segundos}s)", _interval.TotalSeconds);

        // Primeira busca imediata ao iniciar, para o cache estar pronto quando o primeiro usuário abrir o site
        await RefreshAsync(ct);

        using var timer = new PeriodicTimer(_interval);

        while (!ct.IsCancellationRequested && await timer.WaitForNextTickAsync(ct))
            await RefreshAsync(ct);
    }

    private async Task RefreshAsync(CancellationToken ct)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var svc = scope.ServiceProvider.GetRequiredService<IMobilidadeRioService>();
            var buses = await svc.GetBusPositionsAsync(ct);
            logger.LogDebug("Cache atualizado em background: {Total} ônibus", buses.Count());
        }
        catch (OperationCanceledException) { /* shutdown normal */ }
        catch (Exception ex)
        {
            // Loga e continua — um erro não deve derrubar o serviço inteiro
            logger.LogWarning(ex, "Falha no refresh em background. Próxima tentativa em {Segundos}s", _interval.TotalSeconds);
        }
    }
}
