// ═══════════════════════════════════════════════════
// ECOTRACK AI — HOTSPOT ENVIRONMENTAL AUDIT MODAL
// In-depth AI inspection of a selected pollution & carbon hotspot
// ═══════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ShieldAlert,
  Factory,
  Car,
  Flame,
  Wind,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Wrench,
  Loader2,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { getHotspotAiAudit } from '../services/cityPollutionService';

export default function HotspotAuditModal({ hotspot, cityName, liveAqi, onClose }) {
  const [loading, setLoading] = useState(true);
  const [auditData, setAuditData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!hotspot) return;

    let isMounted = true;
    setLoading(true);

    getHotspotAiAudit(hotspot, cityName, liveAqi)
      .then((data) => {
        if (isMounted) {
          setAuditData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Audit modal fetch error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [hotspot, cityName, liveAqi]);

  if (!hotspot) return null;

  const handleCopy = () => {
    if (!auditData) return;
    const text = `ECOTRACK AI HOTSPOT AUDIT: ${hotspot.name} (${cityName})
Threat Level: ${hotspot.threatLevel} | Category: ${hotspot.category}
Est. CO2: ${hotspot.estimatedCO2TonsDay} Tons/day | Dominant Pollutant: ${hotspot.primaryPollutant}
Summary: ${auditData.executiveSummary}
Health Advisory: ${auditData.healthAdvisory}
Mitigation Solutions:
${auditData.actionableSolutions?.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-lg ${
              hotspot.threatLevel === 'Critical'
                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                : hotspot.threatLevel === 'High'
                ? 'bg-orange-500/10 text-orange-500 border border-orange-500/30'
                : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
            }`}
          >
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0 pr-8">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  hotspot.threatLevel === 'Critical'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    : hotspot.threatLevel === 'High'
                    ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                }`}
              >
                ● {hotspot.threatLevel} Threat
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {hotspot.category}
              </span>
              <span className="text-xs text-slate-400">
                {hotspot.distanceKm} km from {cityName} center
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white truncate">
              {hotspot.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Coordinates: {hotspot.lat.toFixed(4)} N, {hotspot.lon.toFixed(4)} E
            </p>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Daily CO₂ Output
            </span>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {hotspot.estimatedCO2TonsDay} <span className="text-xs font-normal text-slate-400">Tons</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Primary Pollutant
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5 truncate">
              {hotspot.primaryPollutant}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Local AQI Est.
            </span>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {hotspot.aqi || 120}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Est. PM2.5 Level
            </span>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {hotspot.pm25} <span className="text-xs font-normal text-slate-400">µg/m³</span>
            </div>
          </div>
        </div>

        {/* AI Audit Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Synthesizing Groq AI Environmental Audit...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Analyzing local pollutant dispersion models, industrial stack impact, and health advisories.
            </p>
          </div>
        ) : auditData ? (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Executive Environmental Diagnostic</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {auditData.executiveSummary}
              </p>
            </div>

            {/* Health Advisory */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
                <HeartPulse className="w-4 h-4" />
                <span>Community Health & Protective Advisory</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {auditData.healthAdvisory}
              </p>
            </div>

            {/* Actionable Engineering Solutions */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-slate-900 dark:text-white font-bold text-sm">
                <Wrench className="w-4 h-4 text-emerald-500" />
                <span>Recommended Mitigation Interventions</span>
              </div>

              <div className="space-y-2.5">
                {auditData.actionableSolutions?.map((sol, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-snug">
                      {sol}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer Actions */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Audit Report</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
