using System.Collections.Concurrent;
using BusTrackerAPI.Models;

namespace BusTrackerAPI.Services;

public interface IBusStationaryTracker
{
    /// <summary>Atualiza o histórico com leituras recentes. Chamado após cada fetch bem-sucedido da API externa.</summary>
    void UpdateHistory(IEnumerable<BusPosition> positions);

    /// <summary>Retorna apenas os ônibus considerados ativos (em movimento ou parados há menos que o limite).</summary>
    List<BusPosition> FilterActive(IEnumerable<BusPosition> positions, TimeSpan maxStationaryTime);
}

public class BusStationaryTracker : IBusStationaryTracker
{
    // Raio em metros dentro do qual duas leituras são consideradas "o mesmo lugar"
    // (absorve o ruído natural do GPS, geralmente 5–15m).
    private const double StationaryRadiusMeters = 25.0;

    // Velocidade (km/h) abaixo da qual o ônibus é considerado parado.
    // Mesmo com GPS estável, ônibus parado pode marcar 1 km/h por ruído do sensor.
    private const double MovingSpeedKmh = 2.0;

    private readonly ConcurrentDictionary<string, HistoryEntry> _history =
        new(StringComparer.OrdinalIgnoreCase);

    private readonly ILogger<BusStationaryTracker> _logger;

    public BusStationaryTracker(ILogger<BusStationaryTracker> logger)
    {
        _logger = logger;
    }

    public void UpdateHistory(IEnumerable<BusPosition> positions)
    {
        var now = DateTime.UtcNow;
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var bus in positions)
        {
            if (string.IsNullOrWhiteSpace(bus.Ordem)) continue;
            seen.Add(bus.Ordem);

            _history.TryGetValue(bus.Ordem, out var prev);

            var distance = prev is null
                ? double.MaxValue
                : HaversineMeters(prev.Lat, prev.Lng, bus.Latitude, bus.Longitude);

            var isMoving = distance > StationaryRadiusMeters || bus.Velocidade >= MovingSpeedKmh;

            // Se em movimento, reseta o timer.
            // Se parado, mantém o stationarySince anterior (ou começa agora na primeira vez).
            DateTime? stationarySince = isMoving
                ? null
                : prev?.StationarySince ?? now;

            _history[bus.Ordem] = new HistoryEntry(bus.Latitude, bus.Longitude, stationarySince);
        }

        // Remove do histórico ônibus que sumiram do feed (provavelmente desligados há muito tempo).
        foreach (var key in _history.Keys)
        {
            if (!seen.Contains(key))
                _history.TryRemove(key, out _);
        }

        _logger.LogDebug("Histórico atualizado: {Total} ônibus rastreados", _history.Count);
    }

    public List<BusPosition> FilterActive(IEnumerable<BusPosition> positions, TimeSpan maxStationaryTime)
    {
        var now = DateTime.UtcNow;
        var active = new List<BusPosition>();
        var removed = 0;

        foreach (var bus in positions)
        {
            if (!_history.TryGetValue(bus.Ordem, out var entry) || entry.StationarySince is null)
            {
                active.Add(bus);
                continue;
            }

            if (now - entry.StationarySince.Value < maxStationaryTime)
                active.Add(bus);
            else
                removed++;
        }

        if (removed > 0)
            _logger.LogDebug("Filtrados {Removed} ônibus parados há mais de {Minutos} min",
                removed, maxStationaryTime.TotalMinutes);

        return active;
    }

    /// <summary>Distância em metros entre dois pontos geográficos (fórmula de Haversine).</summary>
    private static double HaversineMeters(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6_371_000.0; // raio da Terra em metros
        var dLat = ToRad(lat2 - lat1);
        var dLng = ToRad(lng2 - lng1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

        return 2 * R * Math.Asin(Math.Min(1.0, Math.Sqrt(a)));
    }

    private static double ToRad(double degrees) => degrees * Math.PI / 180.0;

    private sealed record HistoryEntry(double Lat, double Lng, DateTime? StationarySince);
}
