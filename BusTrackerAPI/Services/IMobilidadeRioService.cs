using BusTrackerAPI.Models;

namespace BusTrackerAPI.Services;

public interface IMobilidadeRioService
{
    /// <summary>
    /// Retorna todas as posições GPS recentes dos ônibus SPPO.
    /// </summary>
    Task<IEnumerable<BusPosition>> GetBusPositionsAsync(CancellationToken ct = default);

    /// <summary>
    /// Retorna posições filtradas por linha.
    /// </summary>
    Task<IEnumerable<BusPosition>> GetBusPositionsByLineAsync(string linha, CancellationToken ct = default);

    /// <summary>
    /// Retorna lista de linhas únicas ativas no momento.
    /// </summary>
    Task<IEnumerable<string>> GetActiveLinesAsync(CancellationToken ct = default);
}
