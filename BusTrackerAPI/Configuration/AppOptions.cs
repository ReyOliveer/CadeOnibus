namespace BusTrackerAPI.Configuration;

public class MobilidadeRioOptions
{
    public const string SectionName = "MobilidadeRio";

    /// <summary>URL base da API de mobilidade do Rio</summary>
    public string BaseUrl { get; set; } = "https://dados.mobilidade.rio";

    /// <summary>Janela de tempo em minutos para buscar dados GPS (padrão: últimos 2 min)</summary>
    public int JanelaTempoMinutos { get; set; } = 2;

    /// <summary>Tempo de cache em segundos para evitar chamadas repetidas</summary>
    public int CacheSegundos { get; set; } = 20;

    /// <summary>
    /// Multiplicador do cache de fallback. O cache em memória dura CacheSegundos * FallbackCacheMultiplicador.
    /// Isso garante que o sistema continue servindo dados mesmo se o background refresh falhar algumas vezes.
    /// Ex: CacheSegundos=30, FallbackCacheMultiplicador=5 → dados ficam até 150s em memória.
    /// </summary>
    public int FallbackCacheMultiplicador { get; set; } = 5;

    /// <summary>Timeout em segundos para chamadas HTTP</summary>
    public int TimeoutSegundos { get; set; } = 15;

    /// <summary>Número máximo de tentativas em caso de falha (Polly retry)</summary>
    public int MaxRetries { get; set; } = 3;

    /// <summary>Tempo máximo (em minutos) que um ônibus pode ficar parado no mesmo lugar antes de ser ocultado do mapa</summary>
    public int MinutosMaximosParado { get; set; } = 10;
}

public class RateLimitOptions
{
    public const string SectionName = "RateLimit";

    /// <summary>Máximo de requisições por janela de tempo por IP</summary>
    public int MaxRequests { get; set; } = 30;

    /// <summary>Janela de tempo em segundos</summary>
    public int JanelaSegundos { get; set; } = 60;
}
