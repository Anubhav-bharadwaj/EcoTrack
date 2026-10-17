// ═══════════════════════════════════════════════════
// ECOTRACK AI — VOICE AGENT LAUNCH PILL BUTTON
// Inspired by screenshot design: [ 〰️ Voice Agent OS ]
// ═══════════════════════════════════════════════════

import { Radio, Mic } from 'lucide-react';
import { useVoiceAgent } from '../context/VoiceAgentContext';

export default function VoiceAgentButton({ context = null, className = '', compact = false }) {
  const { openVoiceAgent, isOpen, status } = useVoiceAgent();

  const isLive = isOpen && status !== 'idle';

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => openVoiceAgent(context)}
        className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center ${
          isLive
            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/30 animate-pulse'
            : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border-emerald-300 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 shadow-sm'
        } ${className}`}
        title="Open EcoBot Voice Agent OS"
      >
        <Mic className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openVoiceAgent(context)}
      className={`group relative inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 border cursor-pointer ${
        isLive
          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/30'
          : 'bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border-emerald-500/30 hover:border-emerald-500/50 text-emerald-700 dark:text-emerald-300 shadow-sm'
      } ${className}`}
      title="Launch Hands-Free Voice Agent OS"
    >
      {/* Animated Soundwave Icon (Matching Screenshot 〰️) */}
      <span className="flex items-center gap-0.5 h-3.5">
        <span className="w-0.5 h-2.5 rounded-full bg-emerald-500 group-hover:h-3.5 transition-all duration-150 animate-pulse" />
        <span className="w-0.5 h-3.5 rounded-full bg-emerald-400 group-hover:h-4 transition-all duration-150" />
        <span className="w-0.5 h-2 rounded-full bg-emerald-500 group-hover:h-3 transition-all duration-150 animate-pulse" />
      </span>

      <span className="font-bold">Voice Agent OS</span>

      {/* Live beacon indicator */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
    </button>
  );
}
