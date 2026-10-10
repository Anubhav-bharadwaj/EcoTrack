<div align="center">
  
  # 🌿 EcoTrack
  
  **An AI-powered Enterprise Sustainability & Carbon Tracking Platform.**

  [![Live Demo](https://img.shields.io/badge/demo-online-green.svg)](https://carbontrackerecoai.vercel.app/)
  [![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
  [![Tailwind v4](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)
  [![Groq](https://img.shields.io/badge/AI-Groq%20LPU-orange.svg)](https://groq.com/)
</div>

<br />

EcoTrack is a modern, responsive web application designed to help individuals and enterprises track, understand, and reduce their carbon footprint. Powered by state-of-the-art Agentic AI, it provides intelligent data extraction, real-time web search capabilities, and actionable sustainability insights.

---

## ✨ Key Features

- **🤖 Agentic AI Assistant**: A built-in intelligent chatbot powered by **Groq (`qwen/qwen3.8-27b`)** and **SerpAPI**. It doesn't just chat—it can actively browse the live web to fetch real-time climate data, policies, and offset prices to answer your questions.
- **📄 Smart Bill & Receipt Scanner**: Seamlessly upload images or paste raw text from electricity bills, flight itineraries, or grocery receipts. Using **Tesseract.js** for client-side OCR and Groq's blazing-fast JSON mode, EcoTrack automatically extracts, categorizes, and logs the precise carbon footprint of your activities.
- **📊 Enterprise Sustainability Dashboard**: A sleek, professional interface built with Tailwind CSS v4, featuring a dynamic "Sustainability Index", beautiful data visualizations, and glassmorphic design elements.
- **⚡ "What If" Simulator**: Interactive scenarios that let you project the long-term impact of adopting greener habits (e.g., switching to an EV, adopting a plant-based diet).
- **🎯 Reduction Goals**: Track progress against targeted environmental benchmarks and earn performance-based efficiency grades.

## 🛠️ Technology Stack

- **Frontend Core**: React.js (Vite), JavaScript
- **Styling**: Tailwind CSS v4 (Custom Enterprise SaaS Theme)
- **AI & Logic**: 
  - **Groq SDK**: High-speed LLM inference
  - **SerpAPI**: Agentic tool calling for real-time web search
  - **Tesseract.js**: Client-side Optical Character Recognition (OCR)
- **Icons**: Lucide React
- **Deployment**: Vercel

## 🚀 Getting Started

Follow these steps to run EcoTrack locally on your machine.

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/EcoTrack.git
cd EcoTrack
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment file and add your API keys:
```bash
cp .env.example .env
```
Open `.env` and configure your API keys:
- `VITE_GROQ_API_KEY`: Get it from [Groq Console](https://console.groq.com/)
- `VITE_SERPAPI_API_KEY`: Get it from [SerpAPI](https://serpapi.com/)

### 4. Run the Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser to see the app running.

## 📁 Project Architecture
- `src/utils/agentBot.js`: Contains the core logic for the Groq AI agent, function calling (SerpAPI), and the intelligent JSON-mode receipt parser.
- `src/utils/carbonCalculator.js`: The algorithmic engine containing emission factors and efficiency grading logic.
- `src/components/SmartScanner.jsx`: The UI and OCR logic for image-to-text receipt scanning.
- `src/store/AppContext.jsx`: Centralized state management for activities, reduction goals, and chat history.

## 🎯 Purpose
EcoTrack bridges the gap between complex environmental data and actionable daily habits. By leveraging cutting-edge Agentic AI, it eliminates the friction of manual tracking and provides users with a professional, automated, and deeply informative sustainability experience.
