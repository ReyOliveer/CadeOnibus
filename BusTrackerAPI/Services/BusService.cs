using BusTrackerAPI.Configuration;
using BusTrackerAPI.DTOs;
using BusTrackerAPI.Models;
using Microsoft.Extensions.Options;

namespace BusTrackerAPI.Services;

public interface IBusService
{
    Task<BusListResponseDto> GetAllBusesAsync(string? linha, CancellationToken ct = default);
    Task<IEnumerable<BusLineDto>> GetLinesStatsAsync(CancellationToken ct = default);
}

public class BusService : IBusService
{
    private readonly IMobilidadeRioService _mobilidadeService;
    private readonly IBusStationaryTracker _stationaryTracker;
    private readonly MobilidadeRioOptions _options;
    private readonly ILogger<BusService> _logger;
    private const double VelocidadeMinima = 2.0;

    public BusService(
        IMobilidadeRioService mobilidadeService,
        IBusStationaryTracker stationaryTracker,
        IOptions<MobilidadeRioOptions> options,
        ILogger<BusService> logger)
    {
        _mobilidadeService = mobilidadeService;
        _stationaryTracker = stationaryTracker;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<BusListResponseDto> GetAllBusesAsync(string? linha, CancellationToken ct = default)
    {
        IEnumerable<BusPosition> positions = string.IsNullOrWhiteSpace(linha)
            ? await _mobilidadeService.GetBusPositionsAsync(ct)
            : await _mobilidadeService.GetBusPositionsByLineAsync(linha, ct);

        // Oculta ônibus parados no mesmo lugar por mais que o limite configurado.
        var active = _stationaryTracker.FilterActive(
            positions,
            TimeSpan.FromMinutes(_options.MinutosMaximosParado));

        var dtos = active.Select(MapToDto).ToList();

        return new BusListResponseDto(
            Buses: dtos,
            Total: dtos.Count,
            CachedAt: DateTime.UtcNow,
            FiltroLinha: linha
        );
    }

    public async Task<IEnumerable<BusLineDto>> GetLinesStatsAsync(CancellationToken ct = default)
    {
        var all = await _mobilidadeService.GetBusPositionsAsync(ct);

        return all
            .GroupBy(b => b.Linha, StringComparer.OrdinalIgnoreCase)
            .Where(g => !string.IsNullOrWhiteSpace(g.Key))
            .Select(g => new BusLineDto(
                Linha: g.Key,
                TotalVeiculos: g.Count(),
                VeiculosEmMovimento: g.Count(b => b.Velocidade >= VelocidadeMinima),
                VelocidadeMedia: Math.Round(g.Average(b => b.Velocidade), 1)
            ))
            .OrderByDescending(l => l.TotalVeiculos)
            .ToList();
    }

    private static BusPositionDto MapToDto(BusPosition b) => new(
        Ordem: b.Ordem,
        Linha: b.Linha,
        Latitude: b.Latitude,
        Longitude: b.Longitude,
        Velocidade: Math.Round(b.Velocidade, 1),
        DataHora: b.DataHora,
        Sentido: b.Sentido,
        Trajeto: b.Trajeto,
        EmMovimento: b.Velocidade >= VelocidadeMinima
    );
}
