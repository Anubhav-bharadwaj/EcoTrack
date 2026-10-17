import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { VoiceAgentProvider } from './context/VoiceAgentContext';
import Dashboard from './pages/Dashboard';
import Tracker from './pages/Tracker';
import Simulator from './pages/Simulator';
import Challenges from './pages/Challenges';
import EmissionsMap from './pages/EmissionsMap';
import AIChat from './components/AIChat';
import VoiceAgentOverlay from './components/VoiceAgentOverlay';

function App() {
  return (
    <AppProvider>
      <VoiceAgentProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<EmissionsMap />} />
            <Route path="/tracker" element={<Tracker />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/challenges" element={<Challenges />} />
          </Routes>
          <AIChat />
          <VoiceAgentOverlay />
        </BrowserRouter>
      </VoiceAgentProvider>
    </AppProvider>
  );
}

export default App;
