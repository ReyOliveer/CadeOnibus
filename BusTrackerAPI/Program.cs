using System.Threading.RateLimiting;
using BusTrackerAPI.Configuration;
using BusTrackerAPI.Middleware;
using BusTrackerAPI.Services;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// ── Logging ────────────────────────────────────────────────────────────────────
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// ── Options ────────────────────────────────────────────────────────────────────
builder.Services.Configure<MobilidadeRioOptions>(
    builder.Configuration.GetSection(MobilidadeRioOptions.SectionName));

builder.Services.Configure<RateLimitOptions>(
    builder.Configuration.GetSection(RateLimitOptions.SectionName));

var mobilidadeOptions = builder.Configuration
    .GetSection(MobilidadeRioOptions.SectionName)
    .Get<MobilidadeRioOptions>() ?? new MobilidadeRioOptions();

// ── HttpClient ─────────────────────────────────────────────────────────────────
builder.Services.AddHttpClient<IMobilidadeRioService, MobilidadeRioService>(client =>
{
    client.BaseAddress = new Uri(mobilidadeOptions.BaseUrl);
    client.Timeout = TimeSpan.FromSeconds(mobilidadeOptions.TimeoutSegundos);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.DefaultRequestHeaders.Add("User-Agent", "BusTrackerAPI/1.0");
})
.ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    AutomaticDecompression = System.Net.DecompressionMethods.GZip | System.Net.DecompressionMethods.Deflate
});

// ── Serviços ───────────────────────────────────────────────────────────────────
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<IBusStationaryTracker, BusStationaryTracker>();
builder.Services.AddScoped<IBusService, BusService>();
builder.Services.AddHostedService<BackgroundBusRefreshService>();
builder.Services.AddControllers();

// ── Rate Limiting ──────────────────────────────────────────────────────────────
var rateLimitOpts = builder.Configuration
    .GetSection(RateLimitOptions.SectionName)
    .Get<RateLimitOptions>() ?? new RateLimitOptions();

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("fixed", limiterOptions =>
    {
        limiterOptions.PermitLimit = rateLimitOpts.MaxRequests;
        limiterOptions.Window = TimeSpan.FromSeconds(rateLimitOpts.JanelaSegundos);
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 5;
    });

    options.OnRejected = async (ctx, token) =>
    {
        ctx.HttpContext.Response.StatusCode = 429;
        await ctx.HttpContext.Response.WriteAsync(
            "Too Many Requests. Aguarde antes de tentar novamente.", token);
    };
});

// ── Swagger ────────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "BusTracker RJ API",
        Version = "v1",
        Description = "Rastreamento em tempo real dos ônibus do Rio de Janeiro (SPPO).",
    });
});

// ── Build ──────────────────────────────────────────────────────────────────────
var app = builder.Build();

app.UseGlobalExceptionHandler();

// ── Swagger apenas em desenvolvimento ─────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "BusTracker RJ v1");
        c.RoutePrefix = "swagger";
    });
}

// ── Arquivos estáticos do React ────────────────────────────────────────────────
// Espera a pasta wwwroot/  (copie o conteúdo do dist/ do React para lá)
app.UseDefaultFiles();   // serve index.html por padrão em "/"
app.UseStaticFiles();    // serve JS, CSS, assets

app.UseRateLimiter();
app.UseAuthorization();

// ── API routes ─────────────────────────────────────────────────────────────────
app.MapControllers().RequireRateLimiting("fixed");

// ── Fallback: qualquer rota desconhecida devolve o index.html do React ─────────
// Isso garante que o React Router funcione em rotas como /mapa, /sobre, etc.
app.MapFallbackToFile("index.html");

// Detecta se está rodando no Windows e fora de um contêiner Docker (modo Desktop)
bool isDesktopMode = OperatingSystem.IsWindows() && 
                     !string.Equals(Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER"), "true", StringComparison.OrdinalIgnoreCase);

if (isDesktopMode)
{
    // ── Modo Desktop: Executa o Servidor em Background e abre a janela WebView2 ──
    var thread = new System.Threading.Thread(() =>
    {
        System.Windows.Forms.Application.EnableVisualStyles();
        System.Windows.Forms.Application.SetCompatibleTextRenderingDefault(false);

        var form = new System.Windows.Forms.Form
        {
            Text = "CadeÔnibus — Rastreador de Frota RJ",
            Width = 1280,
            Height = 768,
            StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen
        };

        var webView = new Microsoft.Web.WebView2.WinForms.WebView2
        {
            Dock = System.Windows.Forms.DockStyle.Fill
        };

        form.Controls.Add(webView);

        form.Load += async (s, e) =>
        {
            try
            {
                await webView.EnsureCoreWebView2Async(null);
                webView.Source = new Uri("http://localhost:5000");
            }
            catch (Exception ex)
            {
                System.Windows.Forms.MessageBox.Show(
                    $"Erro ao carregar o WebView2: {ex.Message}\nCertifique-se de que o Microsoft Edge WebView2 Runtime está instalado no Windows.",
                    "Erro de Inicialização",
                    System.Windows.Forms.MessageBoxButtons.OK,
                    System.Windows.Forms.MessageBoxIcon.Error);
            }
        };

        // Ao fechar a janela, solicita o encerramento do Kestrel e da aplicação
        form.FormClosed += (s, e) =>
        {
            var lifetime = app.Services.GetRequiredService<Microsoft.Extensions.Hosting.IHostApplicationLifetime>();
            lifetime.StopApplication();
        };

        System.Windows.Forms.Application.Run(form);
    });

    thread.SetApartmentState(System.Threading.ApartmentState.STA);
    thread.Start();

    // Roda Kestrel na porta 5000 fixa para o WebView2 local encontrar
    app.Run("http://localhost:5000");
}
else
{
    // ── Modo Web/Servidor (Railway, Docker, Linux): Executa o Kestrel padrão ──
    // Deixar sem argumentos permite que o ASP.NET Core leia as variáveis de ambiente (como PORT ou ASPNETCORE_URLS)
    app.Run();
}
