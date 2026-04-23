# 🚌 BusTracker RJ — Backend (ASP.NET Core 8)

API REST que faz proxy e caching dos dados GPS da frota SPPO do Rio de Janeiro,
consumindo a [API de Mobilidade do Rio](https://dados.mobilidade.rio).

---

## 📁 Estrutura do Projeto

```
BusTrackerAPI/
├── Controllers/
│   └── BusesController.cs       # Endpoints REST
├── Services/
│   ├── IMobilidadeRioService.cs  # Interface do serviço externo
│   ├── MobilidadeRioService.cs   # Consome a API do Rio + cache
│   └── BusService.cs             # Lógica de negócio + mapeamento
├── Models/
│   └── BusPosition.cs            # Modelo interno
├── DTOs/
│   └── BusDtos.cs                # O que é exposto ao frontend
├── Configuration/
│   └── AppOptions.cs             # Opções tipadas (Options Pattern)
├── Middleware/
│   └── GlobalExceptionMiddleware.cs
├── Program.cs                    # Bootstrap e DI
├── appsettings.json
└── appsettings.Development.json
```

---

## 🚀 Como rodar

### Pré-requisitos
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)

### Passos

```bash
# Restaurar dependências
dotnet restore

# Rodar em desenvolvimento (Swagger disponível em http://localhost:5000)
dotnet run

# Ou com hot reload
dotnet watch run
```

O Swagger UI estará disponível em **`http://localhost:5000`** (raiz).

---

## 📡 Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/buses` | Todos os ônibus (GPS recente) |
| `GET` | `/api/buses?linha=485` | Filtrado por linha |
| `GET` | `/api/buses/lines` | Estatísticas por linha |
| `GET` | `/api/buses/{ordem}` | Ônibus específico por código |
| `GET` | `/api/buses/health` | Health check |

### Exemplo de resposta — `GET /api/buses?linha=485`

```json
{
  "buses": [
    {
      "ordem": "C12345",
      "linha": "485",
      "latitude": -22.9068,
      "longitude": -43.1729,
      "velocidade": 34.5,
      "dataHora": "2024-03-27T14:32:10",
      "sentido": "I",
      "trajeto": "CASTELO - MÉIER",
      "emMovimento": true
    }
  ],
  "total": 42,
  "cachedAt": "2024-03-27T14:32:15Z",
  "filtroLinha": "485"
}
```

---

## ⚙️ Configurações (`appsettings.json`)

| Chave | Padrão | Descrição |
|-------|--------|-----------|
| `MobilidadeRio:BaseUrl` | `https://dados.mobilidade.rio` | URL da API do Rio |
| `MobilidadeRio:JanelaTempoMinutos` | `2` | Janela de tempo da consulta GPS |
| `MobilidadeRio:CacheSegundos` | `20` | Tempo de cache em memória |
| `MobilidadeRio:TimeoutSegundos` | `15` | Timeout das chamadas HTTP |
| `MobilidadeRio:MaxRetries` | `3` | Tentativas com Polly |
| `RateLimit:MaxRequests` | `30` | Máx. requisições por IP/minuto |
| `Cors:AllowedOrigins` | `localhost:5173` | Origins permitidas |

---

## 🛡️ Recursos de resiliência

- **Cache em memória** — evita chamadas repetidas à API do Rio (20s padrão)
- **Polly Retry** — 3 tentativas com backoff exponencial em erros transitórios
- **Circuit Breaker** — abre após 5 falhas consecutivas, fecha em 30s
- **Rate Limiting** — 30 req/min por IP (sliding window)
- **Timeout configurável** — evita travamentos por API lenta
- **Global Exception Middleware** — respostas de erro padronizadas

---

## 🔮 Próximos passos sugeridos

- [ ] Adicionar **SignalR** para push em tempo real (substituir polling)
- [ ] Persistência com **PostgreSQL + EF Core** para histórico de posições
- [ ] **Background Service** (`IHostedService`) para buscar dados periodicamente
- [ ] Autenticação com **JWT** se quiser áreas privadas
- [ ] Deploy no **Railway** ou **Render** (gratuito para portfólio)
