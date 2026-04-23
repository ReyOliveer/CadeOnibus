namespace BusTrackerAPI.DTOs;

/// <summary>
/// DTO exposto ao frontend com posição do ônibus.
/// </summary>
public record BusPositionDto(
    string Ordem,
    string Linha,
    double Latitude,
    double Longitude,
    double Velocidade,
    DateTime DataHora,
    string? Sentido,
    string? Trajeto,
    bool EmMovimento
);

/// <summary>
/// DTO com resumo de uma linha de ônibus.
/// </summary>
public record BusLineDto(
    string Linha,
    int TotalVeiculos,
    int VeiculosEmMovimento,
    double VelocidadeMedia
);

/// <summary>
/// DTO de resposta paginada de ônibus.
/// </summary>
public record BusListResponseDto(
    IEnumerable<BusPositionDto> Buses,
    int Total,
    DateTime CachedAt,
    string? FiltroLinha
);

/// <summary>
/// DTO de resposta de erro padronizado.
/// </summary>
public record ErrorResponseDto(
    string Message,
    string? Detail = null,
    int StatusCode = 500
);
