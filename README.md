# CadeOnibus

Aplicacao de rastreamento em tempo real dos onibus do Rio de Janeiro (frota SPPO).

## Pre-requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)
- [Node.js 18+](https://nodejs.org)

## Estrutura

```text
CadeOnibus/
|-- BusTrackerAPI/          <- backend C#
`-- BusTrackerFrontend/     <- frontend React
```

## Como rodar

### 1. Build do frontend

So precisa rodar novamente se mudar algo no frontend.

```bash
cd BusTrackerFrontend
npm install
npm run build
```

Isso gera os arquivos estaticos em `BusTrackerAPI/wwwroot/` automaticamente.

### 2. Rodar o backend

```bash
cd BusTrackerAPI
dotnet run
```

Acesse **http://localhost:5000** para abrir o mapa com os onibus.

## Desenvolvimento

Se estiver mexendo no React e quiser ver mudancas sem fazer build:

```bash
# Terminal 1
cd BusTrackerAPI && dotnet run

# Terminal 2
cd BusTrackerFrontend && npm run dev
```

Acesse **http://localhost:5173** para ver as mudancas em tempo real.

## Endpoints da API

| Rota | Descricao |
|------|-----------|
| `GET /api/buses` | Todos os onibus |
| `GET /api/buses?linha=485` | Filtrado por linha |
| `GET /api/buses/lines` | Estatisticas por linha |
| `GET /api/buses/health` | Health check |
| `GET /swagger` | Documentacao (so em dev) |
