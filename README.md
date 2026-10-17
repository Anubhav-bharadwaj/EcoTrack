<div align="center">
  
  # 🌿 EcoTrack AI
  
  **Enterprise Sustainability Intelligence & Multilingual Voice-Enabled Carbon Accounting Platform**

  [![Live Demo](https://img.shields.io/badge/demo-online-emerald.svg)](https://carbontrackerecoai.vercel.app/)
  [![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)
  [![Vite](https://img.shields.io/badge/Vite-8-purple.svg)](https://vitejs.dev/)
  [![Groq LPU](https://img.shields.io/badge/AI-Groq%20LPU-orange.svg)](https://groq.com/)
  [![Web Audio](https://img.shields.io/badge/Audio-Web%20Audio%20API-teal.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
</div>

<br />

**EcoTrack AI** is a state-of-the-art sustainability intelligence and personal carbon footprint tracking platform. Combining high-speed Agentic LLM reasoning, client-side OCR receipt parsing, geospatial pollution heatmaps, and a **real-time multilingual neural voice agent**, EcoTrack transforms complex environmental data into clear, actionable daily decisions.

---

## ✨ Core Highlights & Key Features

### 🎙️ 1. Multilingual Neural Voice Agent OS (EcoBot)
A conversational, hands-free AI Eco-Coach operating in real time:
- **Studio-Quality Personas**:
  - **Aditi (Indian Female)**: Formant-shifted ($1.07\times$) and acoustically shaped via Web Audio API with a $190\text{ Hz}$ Butterworth high-pass filter and $+2.0\text{ dB}$ high-shelf presence boost at $3.2\text{ kHz}$ for a light, articulate, and natural feminine register.
  - **Aarav (Indian Male)**: Grounded baritone ($0.95\times$) with rich chest resonance for a calm, confident advisory cadence.
- **Trilingual Fluency**: Seamlessly converse in **English**, **Hinglish (हिंदी + English Mix)**, and **Hindi (शुद्ध हिंदी)**.
- **Dynamic Speech Recognition Sync**: Automatically switches acoustic speech recognition models (`en-US` for English, `hi-IN` for Hindi/Hinglish) with real-time recognition restart upon switching languages.
- **Environmental Phonetic Smoothing**: Built-in speech normalizer (`speechNormalizer.js`) converts environmental symbols and units into natural spoken language (e.g., `2.5 kg CO2e` $\rightarrow$ *"2.5 kilograms of carbon dioxide equivalent"*, `350 kWh` $\rightarrow$ *"350 kilowatt-hours"*, `AQI`, `PM2.5`, etc.).
- **Zero-Latency Sentence Pipelining**: Splits incoming LLM streams into natural sentence chunks and preloads subsequent chunks in the background for gapless playback.
- **Data-Grounded Personalization**: Spoken advice is tailored to the user's actual logged carbon metrics, weekly trends, top emission category, and Eco Score.
- **Interactive Command Deck**: Live pulsing visualizer orb, 18-bar reactive audio frequency visualizer, one-tap interrupt, and quick keyboard shortcuts (<kbd>Space</kbd> to talk/interrupt, <kbd>Escape</kbd> to dismiss).

---

### 📊 2. Enterprise Sustainability Dashboard
- **Dynamic EcoScore Gauge**: Real-time 0–100 efficiency scoring with dynamic grading tiers (*Eco Guardian*, *Green Champion*, *Conscious Citizen*, *Developing*).
- **Categorical Breakdown & Visual Analytics**: Interactive emission charts powered by Recharts covering Transportation, Electricity, Food, and Waste.
- **Time-Series Trendlines**: Historical tracking to identify peak emission spikes and verify reduction progress over weeks and months.

---

### 📄 3. Smart Bill & Receipt Scanner (OCR + AI Extraction)
- **Client-Side Optical Character Recognition**: Fast, privacy-friendly OCR powered by **Tesseract.js** directly inside the browser.
- **Zero-Friction Parsing**: Drag-and-drop electricity utility bills, flight boarding passes, train tickets, fuel receipts, or grocery slips.
- **Agentic Information Extraction**: Powered by **Groq LPU**, automatically extracting kilowatt-hours, vehicle mileage, fuel quantity, or dietary items and calculating exact carbon equivalencies (`kg CO2e`).

---

### 🗺️ 4. Geospatial Emissions Radar & Heatmap Canvas
- **Interactive Leaflet Mapping**: Explore regional and metropolitan environmental hotspots with dynamic color-coded severity heat rings.
- **Live Environmental Metrics**: Real-time Air Quality Index (AQI), PM2.5, and PM10 metrics linked directly to regional carbon generation sources.
- **Hotspot Audit Modals**: Deep-dive inspection into specific urban nodes (traffic corridors, industrial zones, power plants) with tailored mitigation blueprints.

---

### ⚡ 5. "What If" Sustainability Simulator
- **Scenario Projections**: Interactively model the cumulative environmental impact of personal lifestyle transformations before taking action.
- **Actionable Scenarios**: EV transition, solar panel installation, adopting a plant-rich diet, eliminating phantom standby power, and public transit adoption.
- **Cumulative Savings Projection**: Calculates annual kilograms of $\text{CO}_2$ averted and the equivalent trees planted.

---

### 🎯 6. Gamified Challenges & Milestones
- **Eco Challenges**: Curated behavioral challenges across daily commutes, energy conservation, zero-waste shopping, and conscious consumption.
- **Achievement Badges**: Earn verifiable sustainability badges (*Transit Pioneer*, *Kilowatt Crusher*, *Zero-Waste Advocate*) as milestones are unlocked.

---

## 🛠️ Technology Stack

| Domain | Technology / Library | Purpose |
|---|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) | Component architecture, state management & concurrent features |
| **Build Tooling** | [Vite 8](https://vitejs.dev/) | Lightning-fast HMR and optimized production bundling |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern glassmorphism, dynamic animations & responsive layout |
| **AI Inference** | [Groq SDK](https://groq.com/) | Ultra-low latency LLM inference for chatbot and voice reasoning |
| **Voice & Audio** | **Web Audio API** + Streaming Proxy | Real-time parametric Biquad filtering, formant shifting & streaming |
| **OCR Engine** | [Tesseract.js](https://tesseract.projectnaptha.com/) | Client-side text extraction from receipts and utility bills |
| **Mapping & Geospatial** | [Leaflet](https://leafletjs.com/) | Interactive environmental hotspot visualization and canvas maps |
| **Data Visualization** | [Recharts](https://recharts.org/) | Responsive SVG charts for category breakdowns and trends |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, accessible iconography |

---

## 📁 Project Architecture

```
EcoTrack/
├── src/
│   ├── assets/               # Static icons, logos, and illustrations
│   ├── components/           # Reusable UI components
│   │   ├── VoiceAgentOverlay.jsx    # Fullscreen voice assistant modal & visualizer
│   │   ├── VoiceAgentButton.jsx     # Persistent floating voice action trigger
│   │   ├── SmartScanner.jsx         # Tesseract.js OCR bill/receipt scanner
│   │   ├── EmissionsMapCanvas.jsx   # Leaflet geospatial emission radar
│   │   ├── EcoScoreGauge.jsx        # SVG radial gauge for 0-100 sustainability index
│   │   ├── ActivityForm.jsx         # Manual carbon entry modal with smart calculations
│   │   ├── SimulatorCard.jsx        # Interactive "What If" scenario sliders
│   │   ├── TrendChart.jsx           # Time-series emission visualizations
│   │   └── Layout.jsx               # Navigation bar, mobile drawer, and shell layout
│   ├── context/
│   │   └── VoiceAgentContext.jsx    # Voice state engine, SpeechRecognition & prompt router
│   ├── services/
│   │   └── naturalVoiceService.js   # Audio player, Web Audio EQ filter chain & pipeline
│   ├── store/
│   │   └── AppContext.jsx           # Centralized persistence for carbon logs & goals
│   ├── utils/
│   │   ├── agentBot.js              # Groq chat completions & structured tool parsing
│   │   ├── carbonCalculator.js      # Scientific emission factors (DEFRA / EPA standards)
│   │   └── speechNormalizer.js      # Environmental phonetic transliterator (kg CO2e, kWh)
│   ├── pages/
│   │   ├── Dashboard.jsx            # Executive carbon analytics overview
│   │   ├── Tracker.jsx              # Activity logging & OCR bill scanner page
│   │   ├── EmissionsMap.jsx         # Geospatial hotspot audit & radar page
│   │   ├── Simulator.jsx            # Interactive lifestyle transition simulator
│   │   └── Challenges.jsx           # Sustainability benchmarks & achievement badges
│   ├── App.jsx                      # Route management & contextual providers
│   ├── main.jsx                     # Application bootstrap
│   └── index.css                    # Tailwind CSS v4 design system tokens
├── vite.config.js                   # Vite config with same-origin /api/tts streaming proxy
├── package.json
└── README.md
```

---

## 🚀 Getting Started

Follow these steps to run EcoTrack AI locally on your development machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` or `pnpm`

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/EcoTrack.git
cd EcoTrack
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Add your API credentials:
```env
# Groq Cloud API Key (Get free from https://console.groq.com)
VITE_GROQ_API_KEY=your_groq_api_key_here
```

### 4. Start Development Server
```bash
npm run dev
```

The app will start at `http://localhost:5173`. Open your browser (Google Chrome or Microsoft Edge recommended for complete Web Speech API recognition support).

### 5. Build for Production
```bash
npm run build
```

---

## 🎙️ Keyboard Shortcuts (Voice Agent)

| Shortcut | Action |
|---|---|
| <kbd>Space</kbd> | Toggle microphone listening / Interrupt assistant while speaking |
| <kbd>Esc</kbd> | Exit voice mode and close overlay |

---

## 🌍 Emission Calculation Methodology

EcoTrack calculations utilize standardized emission conversion factors aligned with **GHG Protocol**, **EPA**, and **DEFRA** guidelines:
- **Transportation**: Distance-based emission factors for petrol/diesel cars ($0.171\text{ kg CO}_2\text{e/km}$), electric vehicles ($0.047\text{ kg CO}_2\text{e/km}$), public buses ($0.089\text{ kg CO}_2\text{e/km}$), and aviation ($0.254\text{ kg CO}_2\text{e/passenger-km}$).
- **Electricity**: Regional grid electricity intensity factors ($0.71\text{ kg CO}_2\text{e/kWh}$).
- **Diet**: Lifecycle food emission factors differentiating meat-heavy, vegetarian, and plant-based consumption patterns.
- **Waste**: Landfill methane generation versus diverted compost and recycling impact.
