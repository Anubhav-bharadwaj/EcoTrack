// ═══════════════════════════════════════════════════
// ECOTRACK AI — MULTILINGUAL NEURAL VOICE AGENT OVERLAY
// Features Studio-Quality Fluent Neural Voices for Hindi, Hinglish, & English
// Real-time Voice Switching with instant audible preview
// ═══════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  PhoneOff,
  RotateCcw,
  Radio,
  ChevronDown,
  Check,
  Headphones,
  Zap,
} from 'lucide-react';
import {
  useVoiceAgent,
  VOICE_PERSONAS,
  LANGUAGES,
} from '../context/VoiceAgentContext';

export default function VoiceAgentOverlay() {
  const {
    isOpen,
    status,
    userTranscript,
    assistantReply,
    contextData,
    isMuted,
    continuousMode,
    audioLevel,
    errorMessage,
    language,
    personaId,
    browserVoices,
    useNeuralVoice,
    changeLanguage,
    changePersona,
    closeVoiceAgent,
    startListening,
    stopListening,
    interrupt,
    toggleMute,
    setContinuousMode,
  } = useVoiceAgent();

  const scrollRef = useRef(null);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);

  // Auto-scroll to ensure response card is always 100% visible
  useEffect(() => {
    if (scrollRef.current && (assistantReply || userTranscript || errorMessage)) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [assistantReply, userTranscript, errorMessage]);

  // Handle escape to close and spacebar to interrupt / speak
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        closeVoiceAgent();
      } else if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (status === 'speaking') {
          interrupt();
        } else if (status === 'listening') {
          stopListening();
        } else {
          startListening();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeVoiceAgent, status, interrupt, stopListening, startListening]);

  if (!isOpen) return null;

  const currentPersona =
    VOICE_PERSONAS.find((p) => p.id === personaId) || {
      id: personaId,
      name: personaId,
      icon: '🎙️',
    };

  // Determine Orb colors & pulse scale based on status & audioLevel
  const orbScale = 1 + (audioLevel / 100) * 0.25;

  let orbColorGradient =
    'from-emerald-400 via-teal-500 to-cyan-600 shadow-emerald-500/30';

  let statusBadge = {
    color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
    icon: Mic,
    label:
      language === 'hi'
        ? 'सुन रहा हूँ... बोलिए'
        : language === 'hinglish'
        ? 'Listening... Kuch bhi puchiye'
        : 'Listening to your voice...',
    subLabel:
      language === 'hi'
        ? 'स्वाभाविक रूप से बोलें, रुकने पर उत्तर मिलेगा।'
        : language === 'hinglish'
        ? 'Speak freely in Hindi or English, main reply karunga.'
        : 'Speak naturally, I will automatically answer when you pause.',
  };

  if (status === 'thinking') {
    orbColorGradient =
      'from-purple-500 via-indigo-500 to-cyan-500 shadow-purple-500/40 animate-pulse';
    statusBadge = {
      color: 'text-purple-300 bg-purple-950/60 border-purple-500/40',
      icon: Sparkles,
      label:
        language === 'hi'
          ? 'इकोबॉट सोच रहा है...'
          : language === 'hinglish'
          ? 'EcoBot soch raha hai...'
          : 'EcoBot is thinking...',
      subLabel:
        language === 'hi'
          ? 'पर्यावरण डेटा का विश्लेषण कर रहा हूँ।'
          : language === 'hinglish'
          ? 'Analyzing live emissions data for you.'
          : 'Processing environmental intelligence & emission metrics.',
    };
  } else if (status === 'speaking') {
    orbColorGradient =
      'from-cyan-400 via-blue-500 to-emerald-500 shadow-cyan-500/40';
    statusBadge = {
      color: 'text-cyan-300 bg-cyan-950/60 border-cyan-500/40',
      icon: Volume2,
      label:
        language === 'hi'
          ? 'इकोबॉट बोल रहा है...'
          : language === 'hinglish'
          ? 'EcoBot bol raha hai...'
          : 'EcoBot is speaking...',
      subLabel:
        language === 'hi'
          ? 'रोकने के लिए कभी भी टैप करें।'
          : language === 'hinglish'
          ? 'Tap to interrupt or ask next question anytime.'
          : 'Tap interrupt or ask a follow-up anytime.',
    };
  } else if (status === 'idle') {
    orbColorGradient =
      'from-slate-600 via-slate-500 to-slate-700 shadow-slate-700/20';
    statusBadge = {
      color: 'text-slate-400 bg-slate-900/60 border-slate-700/40',
      icon: MicOff,
      label:
        language === 'hi'
          ? 'आवाज़ सत्र रुका हुआ है'
          : language === 'hinglish'
          ? 'Voice paused — tap to speak'
          : 'Voice session paused',
      subLabel:
        language === 'hi'
          ? 'शुरू करने के लिए नीचे माइक दबाएं।'
          : language === 'hinglish'
          ? 'Neeche mic daba kar baat karein.'
          : 'Tap the microphone below to resume conversation.',
    };
  }

  // Generate 18 visualizer bar heights dynamically
  const waveformBars = Array.from({ length: 18 }).map((_, i) => {
    if (status === 'listening' || status === 'speaking') {
      const offset = Math.sin(i * 0.45) * 10;
      const base = (audioLevel / 100) * 36;
      return Math.max(6, Math.min(42, Math.round(base + offset + (i % 3) * 4)));
    }
    return 5;
  });

  const hasContent = Boolean(assistantReply || userTranscript);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-2xl text-white p-4 sm:p-6 overflow-hidden animate-fade-in select-none">
      {/* ─── Top Header Bar (Fixed at Top) ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full max-w-4xl mx-auto shrink-0 pb-3 border-b border-slate-800/80 gap-3 z-30">
        {/* Title & Active Context */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10 shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold font-display text-sm sm:text-base tracking-wide text-white">
                EcoBot Voice Agent OS
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tracking-wider uppercase flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-emerald-400" />
                <span>HD NEURAL</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
              {contextData?.cityName
                ? `Active Radar: ${contextData.cityName} (${contextData.hotspotsCount || 0} Hotspots Plotted)`
                : 'Real-time conversational environmental intelligence'}
            </p>
          </div>
        </div>

        {/* Controls: Language Switcher, Persona Selector & Close Button */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap relative">
          {/* Language Selector (English / Hinglish / Hindi) */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs shadow-inner">
            {LANGUAGES.map((lang) => {
              const isActive = language === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => changeLanguage(lang.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title={lang.sub}
                >
                  <span className="mr-1">{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              );
            })}
          </div>

          {/* Voice Persona Dropdown (With Live Preview) */}
          <div className="relative">
            <button
              onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 hover:border-emerald-500/50 transition-all cursor-pointer shadow-md"
              title="Change Voice Persona (Includes Live Sample)"
            >
              <span>{currentPersona.icon}</span>
              <span className="font-semibold text-emerald-300">{currentPersona.name.split(' ')[0]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {personaMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-fade-in text-left max-h-96 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-slate-800">
                  <Headphones className="w-3 h-3" />
                  <span>Ultra-Fluent Studio Neural Voices</span>
                </div>
                {VOICE_PERSONAS.map((p) => {
                  const isSel = personaId === p.id && useNeuralVoice;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        changePersona(p.id, false);
                        setPersonaMenuOpen(false);
                      }}
                      className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-colors my-0.5 cursor-pointer ${
                        isSel
                          ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                          : 'text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <span className="text-lg">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white flex items-center justify-between">
                          <span>{p.name}</span>
                          {isSel && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{p.sub}</div>
                      </div>
                    </button>
                  );
                })}

                {/* Local Installed Device Voices (If user wants local system voice) */}
                {browserVoices.length > 0 && (
                  <>
                    <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-800 mt-2">
                      Local Installed Device Voices ({browserVoices.length})
                    </div>
                    {browserVoices.slice(0, 6).map((v) => {
                      const isSel = personaId === v.voiceURI && !useNeuralVoice;
                      return (
                        <button
                          key={v.voiceURI || v.name}
                          onClick={() => {
                            changePersona(v.voiceURI || v.name, true);
                            setPersonaMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition-colors ${
                            isSel
                              ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                              : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <span className="truncate max-w-[210px]">{v.name}</span>
                          <span className="text-[9px] uppercase px-1 rounded bg-slate-800">{v.lang}</span>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={closeVoiceAgent}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all shadow-xl cursor-pointer"
            title="Exit Voice Mode (Esc)"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* ─── Main Center Scrollable Container (Always Fits Viewport) ─── */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-start py-2 sm:py-4 px-2 sm:px-4 max-w-2xl mx-auto w-full z-10"
      >
        {/* Ambient Orb Container (Scales down gracefully when reading text) */}
        <div
          className={`relative flex items-center justify-center transition-all duration-300 ${
            hasContent ? 'w-24 h-24 sm:w-32 sm:h-32 my-1' : 'w-40 h-40 sm:w-52 sm:h-52 my-3 sm:my-6'
          }`}
        >
          {/* Outer diffuse pulsating glow */}
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-tr ${orbColorGradient} opacity-25 blur-2xl transition-transform duration-300 pointer-events-none`}
            style={{ transform: `scale(${orbScale * 1.2})` }}
          />

          {/* Central Glowing Orb */}
          <div
            onClick={() => {
              if (status === 'speaking') {
                interrupt();
              } else if (status === 'idle') {
                startListening();
              }
            }}
            className={`relative flex items-center justify-center rounded-full bg-gradient-to-tr ${orbColorGradient} shadow-2xl cursor-pointer transition-all duration-200 active:scale-95 ${
              hasContent ? 'w-20 h-20 sm:w-26 sm:h-26' : 'w-32 h-32 sm:w-40 sm:h-40'
            }`}
            style={{
              transform: `scale(${orbScale})`,
              boxShadow: `0 0 50px rgba(16, 185, 129, ${status === 'idle' ? 0.15 : 0.4})`,
            }}
          >
            {/* Inner glass lens */}
            <div
              className={`flex items-center justify-center rounded-full bg-slate-950/40 backdrop-blur-md border border-white/20 ${
                hasContent ? 'w-14 h-14 sm:w-18 sm:h-18' : 'w-22 h-22 sm:w-28 sm:h-28'
              }`}
            >
              <statusBadge.icon
                className={`text-white drop-shadow-md animate-pulse ${
                  hasContent ? 'w-6 h-6 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-10 sm:h-10'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Frequency Bars Visualizer */}
        <div className="flex items-center justify-center gap-1 h-8 my-1">
          {waveformBars.map((height, idx) => (
            <div
              key={idx}
              className={`w-1 rounded-full transition-all duration-100 ${
                status === 'speaking'
                  ? 'bg-cyan-400'
                  : status === 'thinking'
                  ? 'bg-purple-400'
                  : 'bg-emerald-400'
              }`}
              style={{
                height: `${height}px`,
                opacity: status === 'idle' ? 0.25 : 0.85,
              }}
            />
          ))}
        </div>

        {/* Status Pill Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md transition-all shadow-md ${statusBadge.color}`}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-ping" />
          <span>{statusBadge.label}</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 max-w-sm text-center">
          {statusBadge.subLabel}
        </p>

        {/* ─── Prominent Spoken Text / Captions Display ─── */}
        <div className="w-full mt-3 sm:mt-4 space-y-3 pb-2">
          {/* Error / Permission Alert Banner */}
          {errorMessage && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs sm:text-sm font-medium animate-fade-in shadow-lg text-left flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => startListening()}
                className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-md"
              >
                Retry
              </button>
            </div>
          )}

          {/* User Spoken Transcript */}
          {userTranscript && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-medium animate-fade-in shadow-md text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
                {language === 'hi'
                  ? 'आपका सवाल:'
                  : language === 'hinglish'
                  ? 'You Asked (सवाल):'
                  : 'You Asked:'}
              </span>
              "{userTranscript}"
            </div>
          )}

          {/* EcoBot Spoken Response (High Contrast & 100% Prominent) */}
          {assistantReply && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/95 border border-cyan-500/40 text-slate-100 shadow-2xl animate-fade-in text-left">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  {language === 'hi'
                    ? 'इकोबॉट का उत्तर'
                    : language === 'hinglish'
                    ? 'EcoBot Spoken Advisory (सलाह)'
                    : 'EcoBot Spoken Advisory'}
                </span>
                {status === 'speaking' && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    <Volume2 className="w-3 h-3 animate-pulse" />
                    <span>{language === 'hi' ? 'बोल रहा है' : 'Speaking (Neural HD)'}</span>
                  </span>
                )}
              </div>
              <div className="text-sm sm:text-base font-normal text-slate-100 leading-relaxed whitespace-pre-line font-sans">
                {assistantReply}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Bottom Command Deck (Fixed at Bottom) ─── */}
      <div className="w-full max-w-xl mx-auto shrink-0 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 z-10">
        {/* Mute Audio Output */}
        <button
          onClick={toggleMute}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs font-semibold border backdrop-blur-md transition-all cursor-pointer ${
            isMuted
              ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title={isMuted ? 'Unmute Audio Speech' : 'Mute Audio Speech'}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-rose-400" />
              <span>Muted</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Voice ON</span>
            </>
          )}
        </button>

        {/* Central Action Button: Interrupt or Speak */}
        <button
          onClick={() => {
            if (status === 'speaking') {
              interrupt();
            } else if (status === 'listening') {
              stopListening();
            } else {
              startListening();
            }
          }}
          className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xl transition-all transform active:scale-95 cursor-pointer ${
            status === 'speaking'
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
              : status === 'listening'
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
          }`}
        >
          {status === 'speaking' ? (
            <>
              <RotateCcw className="w-4 h-4" />
              <span>Tap to Interrupt</span>
            </>
          ) : status === 'listening' ? (
            <>
              <MicOff className="w-4 h-4" />
              <span>Stop Listening</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>{language === 'hi' ? 'बोलने के लिए दबाएं' : 'Tap to Talk'}</span>
            </>
          )}
        </button>

        {/* Hands-Free Loop Toggle */}
        <button
          onClick={() => setContinuousMode(!continuousMode)}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs font-semibold border backdrop-blur-md transition-all cursor-pointer ${
            continuousMode
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
          }`}
          title="Toggle Hands-Free Continuous Conversation Loop"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${continuousMode ? 'text-emerald-400' : ''}`} />
          <span>Hands-Free {continuousMode ? 'ON' : 'OFF'}</span>
        </button>

        {/* End Voice Session Button */}
        <button
          onClick={closeVoiceAgent}
          className="p-2.5 sm:p-3 rounded-2xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white transition-all shadow-lg cursor-pointer"
          title="End Voice Session"
        >
          <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}
