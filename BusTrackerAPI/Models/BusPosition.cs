namespace BusTrackerAPI.Models;

/// <summary>
/// Representa a posição GPS bruta retornada pela API da Mobilidade Rio (SPPO).
/// </summary>
public class BusPosition
{
    /// <summary>Código de ordem do veículo (identificador único do ônibus)</summary>
    public string Ordem { get; set; } = string.Empty;

    /// <summary>Linha do ônibus (ex: "485", "SP")</summary>
    public string Linha { get; set; } = string.Empty;

    /// <summary>Latitude em graus decimais</summary>
    public double Latitude { get; set; }

    /// <summary>Longitude em graus decimais</summary>
    public double Longitude { get; set; }

    /// <summary>Velocidade em km/h</summary>
    public double Velocidade { get; set; }

    /// <summary>Data e hora do registro GPS</summary>
    public DateTime DataHora { get; set; }

    /// <summary>Sentido do percurso (I = Ida, V = Volta)</summary>
    public string? Sentido { get; set; }

    /// <summary>Trajeto associado ao veículo</summary>
    public string? Trajeto { get; set; }
}
