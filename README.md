# 🚌 CadeÔnibus (CadeBuson)

Uma aplicação web moderna, responsiva e de altíssimo desempenho para o rastreamento em tempo real da frota de ônibus municipais do Rio de Janeiro (SPPO), integrada com a API de dados abertos da prefeitura (**Mobilidade Rio**).

---

## ✨ Funcionalidades e Diferenciais

### 🎨 Frontend Otimizado & Design Premium
* **Renderização Acelerada por Hardware (GPU)**: Mapa baseado em **Leaflet** com a diretiva `preferCanvas: true`, permitindo a plotagem e movimentação suave de centenas de ônibus simultaneamente sem sobrecarga de CPU.
* **Viewport Culling (Filtro por Limites Visualizados)**: Os marcadores só são processados e inseridos no DOM caso estejam visíveis na janela ativa do mapa, economizando recursos de renderização.
* **Reconciliação e Reciclagem de Marcadores**: 
  * **Zoom Macro (Geral)**: Representado por pequenos círculos coloridos dinamicamente de acordo com a velocidade do veículo.
  * **Zoom Micro (Detalhado)**: Substitui os círculos por ícones detalhados contendo a identificação da linha e sentido, com suporte a tooltips permanentes.
* **Sistema de Temas Dinâmico (Claro/Escuro)**: Alternância suave com persistência no `localStorage`. Troca em tempo real do estilo dos blocos do mapa (Mapbox ou OpenStreetMap no tema claro, CartoDB Dark Matter no tema escuro).
* **Carregamento Inicial Inteligente**: A aplicação inicia limpa (sem carregar milhares de veículos de uma vez) para uma experiência instantânea, guiando o usuário a escolher linhas específicas.
* **Multilinhas Paralelas**: Permite rastrear múltiplas linhas específicas simultaneamente no mesmo mapa com cores distintas.
* **Feed do X (Twitter) Integrado**: Painel lateral direito que exibe avisos operacionais em tempo real da conta `@OperacoesRio`, com carregamento assíncrono à prova de condições de corrida e tratamento de bloqueadores de anúncio (Ad-blockers).

### ⚡ Backend Robusto & Otimizado (.NET 8)
* **Descompressão Automática na Rede (GZip/Deflate)**: Decodifica o payload JSON compactado diretamente do fluxo de rede ao consultar a API da prefeitura, reduzindo drasticamente o consumo de banda e o tempo de resposta.
* **Cache em Memória e Aquecimento Inicial**: As requisições dos usuários são respondidas instantaneamente em **menos de 1ms** a partir de um cache interno em memória.
* **Worker em Background (Background Service)**: Um worker realiza requisições periódicas programadas (ex: a cada 30 segundos) para manter o cache aquecido. Possui lógica de **fallback automático**: mesmo que a API da prefeitura falhe por várias tentativas seguidas, os usuários continuam sendo servidos com as últimas posições conhecidas.
* **Filtros e Higienização de Dados**:
  * Descarte de coordenadas inválidas (`0, 0` ou fora dos limites geográficos do Rio).
  * Exclusão de veículos parados há muito tempo (inativos) ou com telemetria desatualizada no tempo configurado.
* **Rate Limiting Nativo**: Proteção contra abusos na API utilizando políticas de limitação de requisições por janela temporal fixa.

---

## 🛠️ Pré-requisitos

* [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)
* [Node.js 18+](https://nodejs.org)

---

## 📁 Estrutura do Projeto

```text
CadeBuson/
├── BusTrackerAPI/          # Backend ASP.NET Core 8 Web API
│   ├── Configuration/      # Classes de mapeamento de opções (Options Pattern)
│   ├── Controllers/        # Endpoints expostos
│   ├── DTOs/               # Objetos de transferência de dados (SPPO)
│   ├── Services/           # Serviços de cache, processamento de dados e worker
│   └── wwwroot/            # Destino final do build estático do Frontend (React)
└── BusTrackerFrontend/     # Frontend SPA escrito em React + TypeScript + Vite
    ├── src/
    │   ├── components/     # Componentes estruturais (Mapa, Sidebar, Painéis)
    │   ├── hooks/          # Hooks reutilizáveis (useBuses, useTheme, etc.)
    │   └── services/       # Cliente HTTP da API
    └── vite.config.ts      # Configurações do Vite
```

---

## 🚀 Como Executar

### 1. Build do Frontend
Compila os arquivos do React e os transfere automaticamente para a pasta de arquivos estáticos do backend (`wwwroot`):

```bash
cd BusTrackerFrontend
npm install
npm run build
```

### 2. Executar o Servidor Unificado
Uma vez compilado o frontend, o backend C# hospeda tanto a API quanto os arquivos estáticos na mesma porta:

```bash
cd ../BusTrackerAPI
dotnet run
```

Acesse **[http://localhost:5000](http://localhost:5000)** no seu navegador.

---

## 💻 Ambiente de Desenvolvimento (Hot Reloading)

Para trabalhar nas partes de forma isolada com recarregamento em tempo real:

1. **Inicie o Backend (Terminal 1)**:
   ```bash
   cd BusTrackerAPI
   dotnet run --urls "http://localhost:5000"
   ```

2. **Inicie o Frontend Dev Server (Terminal 2)**:
   ```bash
   cd BusTrackerFrontend
   npm run dev
   ```
   Acesse **[http://localhost:5173](http://localhost:5173)**. As requisições para `/api` serão automaticamente redirecionadas para o backend na porta 5000.

---

## ⚙️ Configurações (`appsettings.json`)

Você pode ajustar o comportamento do cache e dos filtros editando as variáveis em `BusTrackerAPI/appsettings.json`:

```json
  "MobilidadeRio": {
    "BaseUrl": "https://dados.mobilidade.rio",
    "JanelaTempoMinutos": 2,          // Período máximo considerado para considerar o dado atual
    "CacheSegundos": 30,             // Frequência de atualização em background da API externa
    "TimeoutSegundos": 45,           // Limite de tempo de espera pela API externa
    "MinutosMaximosParado": 10       // Tempo máximo parado antes de ocultar o veículo
  }
```

---

## 🔌 Endpoints Principais da API

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| **GET** | `/api/buses` | Retorna todos os ônibus ativos no cache (se o filtro inicial não estiver ativado). |
| **GET** | `/api/buses?linha=485` | Retorna posições filtradas para uma linha específica. |
| **GET** | `/api/buses/lines` | Lista de linhas ativas com estatísticas de veículos ativos e parados. |
| **POST** | `/api/buses/ingest` | Força uma ingestão manual externa dos dados de GPS. |
| **GET** | `/swagger` | Interface do Swagger para documentação e testes rápidos (apenas em modo `Development`). |
