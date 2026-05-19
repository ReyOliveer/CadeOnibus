using System.Text.Json.Serialization;

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

/// <summary>
/// DTO que representa o formato bruto de uma entrada de GPS da API externa de mobilidade para ingestão.
/// </summary>
public class SppoRawEntryDto
{
    [JsonPropertyName("ordem")]      public string? Ordem      { get; set; }
    [JsonPropertyName("linha")]      public string? Linha      { get; set; }
    [JsonPropertyName("latitude")]   public object? Latitude   { get; set; }
    [JsonPropertyName("longitude")]  public object? Longitude  { get; set; }
    [JsonPropertyName("velocidade")] public double  Velocidade { get; set; }
    [JsonPropertyName("datahora")]   public object? DataHora   { get; set; }
    [JsonPropertyName("sentido")]    public string? Sentido    { get; set; }
    [JsonPropertyName("trajeto")]    public string? Trajeto    { get; set; }
}
