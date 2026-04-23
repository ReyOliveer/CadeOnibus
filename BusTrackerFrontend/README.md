# 🚌 BusTracker RJ — Frontend (React + TypeScript)

Interface de rastreamento em tempo real dos ônibus do Rio de Janeiro, consumindo o backend ASP.NET Core.

---

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── Map/
│   │   └── BusMap.tsx          # Mapa Leaflet com clusters e ícones dinâmicos
│   ├── Sidebar/
│   │   └── Sidebar.tsx         # Painel lateral: stats, filtros, linhas
│   └── UI/
│       ├── TopBar.tsx          # Barra flutuante com info e refresh
│       ├── ErrorBanner.tsx     # Banner de erro com retry
│       └── LoadingOverlay.tsx  # Splash screen de carregamento
├── hooks/
│   └── useBuses.ts             # React Query: polling automático
├── services/
│   └── api.ts                  # Chamadas HTTP ao backend
├── types/
│   └── index.ts                # Tipos TypeScript + helpers
├── App.tsx                     # Componente raiz + estado global
├── main.tsx                    # Entry point + QueryClient
└── index.css                   # Tema dark + overrides Leaflet
```

---

## 🚀 Como rodar

### Pré-requisitos
- Node.js 18+
- Backend ASP.NET Core rodando em `http://localhost:5000`

### Passos

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento (proxy automático para o backend)
npm run dev

# Build de produção
npm run build
```

A aplicação estará disponível em **`http://localhost:5173`**.

> O Vite está configurado para fazer proxy de `/api/*` para `http://localhost:5000`, então não há problema de CORS em desenvolvimento.

---

## 🎨 Design

- **Tema:** Dark mode exclusivo com paleta inspirada no Rio (tons de teal/ciano)
- **Fontes:** Syne (display) + DM Sans (corpo) + JetBrains Mono (dados)
- **Mapa:** OpenStreetMap com filtro CSS para dark mode + clusters de marcadores
- **Ícones:** SVG dinâmicos coloridos por velocidade do ônibus

### Cores por velocidade
| Cor | Velocidade |
|-----|-----------|
| 🔘 Cinza | Parado (0 km/h) |
| 🟡 Âmbar | < 20 km/h |
| 🩵 Teal  | 20–50 km/h |
| 🔵 Ciano | > 50 km/h |

---

## ⚙️ Configuração

### Proxy (vite.config.ts)
O proxy já está configurado para desenvolvimento:
```ts
proxy: {
  '/api': { target: 'http://localhost:5000', changeOrigin: true }
}
```

### Intervalo de atualização (useBuses.ts)
```ts
const POLL_INTERVAL = 15_000 // 15 segundos
```

---

## 📡 Endpoints consumidos

| Endpoint | Hook | Intervalo |
|----------|------|-----------|
| `GET /api/buses` | `useBuses()` | 15s |
| `GET /api/buses?linha=X` | `useBuses(linha)` | 15s |
| `GET /api/buses/lines` | `useLines()` | 30s |

---

## 🔮 Próximos passos

- [ ] **React Native + Expo** — reaproveitar hooks e services, trocar Leaflet por `react-native-maps`
- [ ] **Histórico de rota** — clicar num ônibus e ver polyline do trajeto
- [ ] **Heatmap** — densidade de ônibus por região com Leaflet.heat
- [ ] **Notificações** — alertar quando um ônibus chega numa linha favorita
- [ ] **PWA** — transformar em Progressive Web App para instalar no celular
