using System.Net;
using System.Text.Json;
using BusTrackerAPI.DTOs;

namespace BusTrackerAPI.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exceção não tratada: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, message) = exception switch
        {
            TimeoutException       => (HttpStatusCode.ServiceUnavailable, "Timeout ao acessar serviço externo."),
            HttpRequestException   => (HttpStatusCode.ServiceUnavailable, "Serviço de mobilidade indisponível."),
            OperationCanceledException => (HttpStatusCode.RequestTimeout,  "Requisição cancelada."),
            _                      => (HttpStatusCode.InternalServerError, "Erro interno inesperado.")
        };

        context.Response.StatusCode = (int)statusCode;

        var error = new ErrorResponseDto(message, exception.Message, (int)statusCode);
        var json  = JsonSerializer.Serialize(error,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        await context.Response.WriteAsync(json);
    }
}

public static class GlobalExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
        => app.UseMiddleware<GlobalExceptionMiddleware>();
}
