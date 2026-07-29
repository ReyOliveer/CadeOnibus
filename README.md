# 🚌 CadeÔnibus

**Rastreamento em tempo real da frota de ônibus do Rio de Janeiro (SPPO)**, integrado à API de dados abertos da prefeitura ([Mobilidade Rio](https://dados.mobilidade.rio)).

**🔗 Demo ao vivo: [cadeonibus.up.railway.app](https://cadeonibus.up.railway.app/)**

![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Mapbox](https://img.shields.io/badge/Mapbox_GL-JS-000000?logo=mapbox&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

<!-- 📸 TODO: adicionar screenshot/GIF do mapa em funcionamento aqui -->

---

## 🏗️ Arquitetura

O backend é um proxy inteligente entre os usuários e a API pública da prefeitura — **nenhuma requisição de usuário toca a API externa**:

```
┌──────────────────────┐
│  BusTrackerFrontend  │  React + TypeScript + Vite + Mapbox GL JS
│      (SPA web)       │  servido pelo próprio backend (wwwroot)
└──────────┬───────────┘
           │ REST /api
           ▼
┌──────────────────────┐
│    BusTrackerAPI     │  ASP.NET Core 8
│                      │  · cache em memória (< 1ms)
│                      │  · worker de refresh em background (60s)
│                      │  · filtro de ônibus parados (Haversine)
│                      │  · rate limiting por IP
└──────────┬───────────┘
           │ 1 chamada a cada 60s
           ▼
┌──────────────────────┐
│  API Mobilidade Rio  │  dados.mobilidade.rio (GPS da frota SPPO)
└──────────────────────┘
```

```text
CadeBuson/
├── BusTrackerAPI/          # Backend ASP.NET Core 8 — API REST + hospeda o build da web
│   ├── Configuration/      # Options Pattern (MobilidadeRio, RateLimit)
│   ├── Controllers/        # Endpoints REST
│   ├── DTOs/               # Contratos de dados (SPPO)
│   ├── Services/           # Cache, worker em background, tracker de veículos parados
│   └── wwwroot/            # Build estático do frontend (gerado pelo Vite)
│
└── BusTrackerFrontend/     # SPA — React + TypeScript + Vite + Mapbox GL
    └── src/
        ├── components/     # Mapa, Sidebar, painéis
        ├── hooks/          # useBuses, useTheme...
        └── services/       # Cliente HTTP
```

---

## ✨ Destaques técnicos

### ⚡ Backend (.NET 8)
* **Cache em memória com aquecimento**: usuários são respondidos em **< 1ms**; um `BackgroundService` é o único componente que fala com a API externa, a cada 60s.
* **Fallback resiliente**: o cache tem TTL estendido (5× o intervalo de refresh) — mesmo que a API da prefeitura falhe várias vezes seguidas, os usuários continuam vendo as últimas posições conhecidas.
* **Anti-estampido (cache stampede)**: em cache-miss, `SemaphoreSlim` + double-check locking garantem que apenas **uma** chamada externa acontece por vez.
* **Streaming JSON**: deserialização direto do stream HTTP com descompressão GZip/Deflate automática — sem alocar ~10 MB de string intermediária.
* **Higienização de dados**: descarte de coordenadas inválidas/`(0,0)`, timestamps futuros, de-duplicação por veículo (leitura mais recente vence).
* **Filtro de "ônibus fantasma"**: tracker com **fórmula de Haversine** oculta veículos parados no mesmo raio de 25m por mais de 10 minutos (ônibus desligados que continuam no feed).
* **Rate limiting nativo** (fixed window, 30 req/min por IP).

### 🌐 Frontend (React + Mapbox GL)
* **Reconciliação de marcadores**: reaproveita marcadores existentes em vez de recriar o DOM a cada atualização de posição.
* **Viewport culling**: só processa marcadores visíveis na janela atual do mapa.
* **Nível de detalhe por zoom**: pontos coloridos por velocidade no zoom macro → ícones de ônibus com linha e popup detalhado no zoom micro.
* **Carregamento inicial inteligente**: começa vazio e guia o usuário a escolher linhas — evita plotar milhares de veículos de uma vez.
* **Multilinhas em paralelo**: rastreie várias linhas simultaneamente (TanStack Query com polling de 60s, alinhado ao ciclo do cache do backend).
* **Tema claro/escuro** com persistência e troca do estilo do mapa em tempo real.

---

## 🚀 Como executar

### Pré-requisitos
* [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)
* [Node.js 18+](https://nodejs.org)
* Token do [Mapbox](https://account.mapbox.com/access-tokens/) (gratuito)

### Servidor unificado (produção local)

```bash
# 1. Build do frontend (sai direto em BusTrackerAPI/wwwroot)
cd BusTrackerFrontend
echo "VITE_MAPBOX_TOKEN=seu_token_aqui" > .env
npm install
npm run build

# 2. Servidor
cd ../BusTrackerAPI
dotnet run
```

Acesse **http://localhost:5000**. Em modo `Development`, o Swagger fica em `/swagger`.

### Modo dev (hot reload)

```bash
# Terminal 1 — backend
cd BusTrackerAPI && dotnet run --urls "http://localhost:5000"

# Terminal 2 — frontend
cd BusTrackerFrontend && npm run dev   # http://localhost:5173, /api → proxy p/ :5000
```

### Docker

```bash
docker build -t cadeonibus --build-arg VITE_MAPBOX_TOKEN=seu_token .
docker run -p 5000:8080 cadeonibus
```

---

## 🔌 API

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/buses` | Todos os ônibus ativos (do cache) |
| `GET` | `/api/buses?linha=485` | Posições filtradas por linha |
| `GET` | `/api/buses/{ordem}` | Um veículo específico pelo código de ordem |
| `GET` | `/api/buses/lines` | Linhas ativas com estatísticas (total, em movimento, vel. média) |
| `GET` | `/api/buses/health` | Health check |
| `POST` | `/api/buses/ingest` | Ingestão manual de posições GPS brutas |

### Configuração (`BusTrackerAPI/appsettings.json`)

```jsonc
"MobilidadeRio": {
  "BaseUrl": "https://dados.mobilidade.rio",
  "JanelaTempoMinutos": 2,     // Janela de busca de posições GPS
  "CacheSegundos": 60,         // Intervalo do refresh em background
  "TimeoutSegundos": 60,       // Timeout da API externa
  "MinutosMaximosParado": 10   // Oculta veículos parados além disso
},
"RateLimit": {
  "MaxRequests": 30,           // Por IP...
  "JanelaSegundos": 60         // ...por janela de tempo
}
```

---

## 🧰 Stack

| Camada | Tecnologias |
| :--- | :--- |
| **Backend** | ASP.NET Core 8, `IMemoryCache`, `BackgroundService`, Rate Limiting nativo, Swagger |
| **Frontend** | React 18, TypeScript, Vite, Mapbox GL JS, TanStack Query, Tailwind CSS |
| **Infra** | Docker, deploy no Railway |

---

## 📄 Licença

Distribuído sob a licença MIT — veja [LICENSE](LICENSE).
Dados públicos fornecidos pela API [Mobilidade Rio](https://dados.mobilidade.rio) (Prefeitura do Rio de Janeiro).
