using BusTrackerAPI.DTOs;
using BusTrackerAPI.Models;

namespace BusTrackerAPI.Services;

public interface IMobilidadeRioService
{
    /// <summary>
    /// Retorna todas as posições GPS recentes dos ônibus SPPO.
    /// Usa o cache em memória se disponível — nunca bloqueia o usuário esperando a API externa.
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

    /// <summary>
    /// Força uma chamada à API externa, ignorando o cache atual.
    /// Deve ser chamado APENAS pelo BackgroundBusRefreshService.
    /// Atualiza o cache em memória com TTL estendido (fallback).
    /// </summary>
    Task<IEnumerable<BusPosition>> ForceRefreshAsync(CancellationToken ct = default);

    /// <summary>
    /// Recebe posições brutas inseridas externamente (push/ingest), filtra mantendo apenas os últimos 2 minutos,
    /// atualiza o histórico do stationary tracker e popula o cache em memória.
    /// </summary>
    Task<int> IngestBusPositionsAsync(IEnumerable<SppoRawEntryDto> rawEntries, CancellationToken ct = default);
}
