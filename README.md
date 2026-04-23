# 🚌 BusTracker RJ

Rastreamento em tempo real dos ônibus do Rio de Janeiro (frota SPPO).

---

## Pré-requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)
- [Node.js 18+](https://nodejs.org)

---

## Estrutura

```
CadeOnibus/
├── BusTrackerAPI/          ← backend C#
└── BusTrackerFrontend/     ← frontend React
```

---

## Como rodar

### 1. Build do frontend
> Só precisa rodar novamente se mudar algo no frontend.

```bash
cd BusTrackerFrontend
npm install
npm run build
```

Isso gera os arquivos estáticos em `BusTrackerAPI/wwwroot/` automaticamente.

### 2. Rodar o backend
```bash
cd BusTrackerAPI
dotnet run
```

Acesse **http://localhost:5000** — o mapa já aparece com os ônibus ao vivo.

---

## Desenvolvimento (hot reload no frontend)

Se estiver mexendo no React e quiser ver mudanças sem fazer build:

```bash
# Terminal 1
cd BusTrackerAPI && dotnet run

# Terminal 2
cd BusTrackerFrontend && npm run dev
```

Acesse **http://localhost:5173** — as mudanças aparecem em tempo real.

---

## Endpoints da API

| Rota | Descrição |
|------|-----------|
| `GET /api/buses` | Todos os ônibus |
| `GET /api/buses?linha=485` | Filtrado por linha |
| `GET /api/buses/lines` | Estatísticas por linha |
| `GET /api/buses/health` | Health check |
| `GET /swagger` | Documentação (só em dev) |
