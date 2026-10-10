// ═══════════════════════════════════════════════════
// ECOTRACK AI — GLOBAL IMPACT COUNTERS COMPONENT
// ═══════════════════════════════════════════════════

import { useEffect, useState, useRef } from 'react';
import { TreePine, TrendingDown, CheckCircle, Activity } from 'lucide-react';

function AnimatedCounter({ value, decimals = 0, duration = 1500 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current && value === 0) return;
    hasAnimated.current = true;

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(eased * value);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue);
}

const STAT_CARDS = [
  {
    key: 'co2',
    label: 'CO₂ Tracked',
    unit: 'kg',
    icon: TrendingDown,
    color: 'text-primary-500',
    bgColor: 'bg-primary-100 dark:bg-primary-900/20',
    delay: 0,
  },
  {
    key: 'challenges',
    label: 'Goals Met',
    unit: '',
    icon: CheckCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    delay: 100,
  },
  {
    key: 'activities',
    label: 'Activities Logged',
    unit: '',
    icon: Activity,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    delay: 200,
  },
  {
    key: 'trees',
    label: 'Trees Equivalent',
    unit: '',
    icon: TreePine,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    delay: 300,
  },
];

export default function GlobalImpact({
  totalCO2Reduced = 0,
  challengesCompleted = 0,
  activitiesLogged = 0,
  treesEquivalent = 0,
}) {
  const values = {
    co2: totalCO2Reduced,
    challenges: challengesCompleted,
    activities: activitiesLogged,
    trees: treesEquivalent,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STAT_CARDS.map(({ key, label, unit, icon: Icon, color, bgColor, delay }) => (
        <div
          key={key}
          className="glass-card p-5 text-center animate-slide-up animate-float"
          style={{
            animationDelay: `${delay}ms`,
            animationDuration: key === 'co2' ? '3s' : key === 'challenges' ? '3.5s' : key === 'activities' ? '4s' : '4.5s',
          }}
        >
          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${bgColor} mb-3`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>

          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold font-display text-gray-800 dark:text-white">
              <AnimatedCounter
                value={values[key]}
                decimals={key === 'co2' || key === 'trees' ? 1 : 0}
              />
            </span>
            {unit && (
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                {unit}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
