using BusTrackerAPI.DTOs;
using BusTrackerAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace BusTrackerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class BusesController : ControllerBase
{
    private readonly IBusService _busService;
    private readonly IMobilidadeRioService _mobilidadeService;
    private readonly ILogger<BusesController> _logger;

    public BusesController(
        IBusService busService,
        IMobilidadeRioService mobilidadeService,
        ILogger<BusesController> logger)
    {
        _busService = busService;
        _mobilidadeService = mobilidadeService;
        _logger = logger;
    }

    /// <summary>Retorna posições GPS recentes de todos os ônibus (ou filtrados por linha).</summary>
    /// <param name="linha">Número da linha. Ex: "485". Opcional.</param>
    [HttpGet]
    public async Task<IActionResult> GetBuses([FromQuery] string? linha, CancellationToken ct)
    {
        _logger.LogInformation("GET /api/buses | linha={Linha}", linha ?? "todas");
        try
        {
            var result = await _busService.GetAllBusesAsync(linha, ct);
            return Ok(result);
        }
        catch (TimeoutException ex)
        {
            return StatusCode(503, new ErrorResponseDto("Serviço de mobilidade indisponível.", ex.Message, 503));
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(503, new ErrorResponseDto("Não foi possível conectar ao serviço.", ex.Message, 503));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro inesperado ao buscar ônibus");
            return StatusCode(500, new ErrorResponseDto("Erro interno do servidor.", ex.Message, 500));
        }
    }

    /// <summary>Estatísticas por linha: total de veículos, em movimento e velocidade média.</summary>
    [HttpGet("lines")]
    public async Task<IActionResult> GetLines(CancellationToken ct)
    {
        _logger.LogInformation("GET /api/buses/lines");
        try
        {
            var result = await _busService.GetLinesStatsAsync(ct);
            return Ok(result);
        }
        catch (TimeoutException ex)
        {
            return StatusCode(503, new ErrorResponseDto("Timeout ao consultar linhas.", ex.Message, 503));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar linhas");
            return StatusCode(500, new ErrorResponseDto("Erro interno.", ex.Message, 500));
        }
    }

    /// <summary>Dados de um ônibus específico pelo código de ordem.</summary>
    [HttpGet("{ordem}")]
    public async Task<IActionResult> GetBusByOrdem(string ordem, CancellationToken ct)
    {
        _logger.LogInformation("GET /api/buses/{Ordem}", ordem);
        try
        {
            var all = await _busService.GetAllBusesAsync(null, ct);
            var bus = all.Buses.FirstOrDefault(b =>
                string.Equals(b.Ordem, ordem, StringComparison.OrdinalIgnoreCase));

            return bus is null
                ? NotFound(new ErrorResponseDto($"Ônibus '{ordem}' não encontrado.", null, 404))
                : Ok(bus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar ônibus {Ordem}", ordem);
            return StatusCode(500, new ErrorResponseDto("Erro interno.", ex.Message, 500));
        }
    }

    /// <summary>Health check — verifica se a API de mobilidade está acessível.</summary>
    [HttpGet("health")]
    public async Task<IActionResult> HealthCheck(CancellationToken ct)
    {
        try
        {
            var result = await _busService.GetAllBusesAsync(null, ct);
            return Ok(new { status = "healthy", busesDisponiveis = result.Total, timestamp = DateTime.UtcNow });
        }
        catch
        {
            return StatusCode(503, new { status = "unhealthy", timestamp = DateTime.UtcNow });
        }
    }

    /// <summary>Recebe posições brutas inseridas externamente, mantendo apenas os registros dos últimos 2 minutos.</summary>
    [HttpPost("ingest")]
    public async Task<IActionResult> IngestBuses([FromBody] List<SppoRawEntryDto> rawEntries, CancellationToken ct)
    {
        if (rawEntries == null || rawEntries.Count == 0)
        {
            return BadRequest(new ErrorResponseDto("A lista de posições de ônibus não pode estar vazia.", null, 400));
        }

        _logger.LogInformation("POST /api/buses/ingest | Recebidos {Count} registros brutas", rawEntries.Count);
        try
        {
            var totalIngerido = await _mobilidadeService.IngestBusPositionsAsync(rawEntries, ct);
            return Ok(new { 
                message = "Ingestão processada com sucesso.", 
                totalRecebido = rawEntries.Count, 
                totalIngerido = totalIngerido, 
                timestamp = DateTime.UtcNow 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao processar ingestão externa de ônibus");
            return StatusCode(500, new ErrorResponseDto("Erro interno ao processar a ingestão de ônibus.", ex.Message, 500));
        }
    }
}
