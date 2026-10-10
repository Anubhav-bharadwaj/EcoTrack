import { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  ArrowRight,
  Sparkles,
  Calculator,
  TrendingDown,
  Zap,
  Bike,
  Car,
  Utensils,
  Train,
  Lightbulb,
  ShoppingBag,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { EMISSION_FACTORS } from '../utils/carbonCalculator';
import { getSimulatorInsight } from '../utils/agentBot';
import Layout from '../components/Layout';
import SimulatorCard from '../components/SimulatorCard';

const SCENARIOS = [
  {
    id: 'bike-commute',
    emoji: '🚗→🚲',
    title: 'Bike instead of drive',
    description: '10km daily commute',
    iconFrom: Car,
    iconTo: Bike,
    current: { category: 'transport', type: 'car', distance: 10 },
    alternative: { category: 'transport', type: 'bike', distance: 10 },
    color: 'from-green-400 to-emerald-500',
  },
  {
    id: 'vegetarian-meal',
    emoji: '🥩→🥗',
    title: 'Vegetarian instead of beef',
    description: '1 meal swap',
    iconFrom: Utensils,
    iconTo: Utensils,
    current: { category: 'food', type: 'beef', amount: 1 },
    alternative: { category: 'food', type: 'vegetarian', amount: 1 },
    color: 'from-amber-400 to-orange-500',
  },
  {
    id: 'train-commute',
    emoji: '🚗→🚆',
    title: 'Train instead of drive',
    description: '30km journey',
    iconFrom: Car,
    iconTo: Train,
    current: { category: 'transport', type: 'car', distance: 30 },
    alternative: { category: 'transport', type: 'train', distance: 30 },
    color: 'from-blue-400 to-indigo-500',
  },
  {
    id: 'reduce-electricity',
    emoji: '⚡→⚡',
    title: 'Reduce electricity 20%',
    description: 'Monthly savings',
    iconFrom: Zap,
    iconTo: Lightbulb,
    current: { category: 'electricity', type: 'electricity', amount: 300 },
    alternative: { category: 'electricity', type: 'electricity', amount: 240 },
    color: 'from-yellow-400 to-amber-500',
  },
  {
    id: 'secondhand',
    emoji: '🛍️→♻️',
    title: 'Buy second-hand',
    description: '1 clothing item',
    iconFrom: ShoppingBag,
    iconTo: ShoppingBag,
    current: { category: 'shopping', type: 'new_clothing', amount: 1 },
    alternative: { category: 'shopping', type: 'secondhand_clothing', amount: 1 },
    color: 'from-purple-400 to-pink-500',
  },
];

// Custom scenario options
const CUSTOM_CATEGORIES = [
  { value: 'transport', label: 'Transport' },
  { value: 'food', label: 'Food' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'shopping', label: 'Shopping' },
];

const CUSTOM_OPTIONS = {
  transport: {
    current: [
      { value: 'car', label: 'Drive a car' },
      { value: 'bus', label: 'Take a bus' },
      { value: 'flight_domestic', label: 'Domestic flight' },
    ],
    alternative: [
      { value: 'bike', label: 'Ride a bike' },
      { value: 'walk', label: 'Walk' },
      { value: 'train', label: 'Take a train' },
      { value: 'bus', label: 'Take a bus' },
      { value: 'ev', label: 'Drive an EV' },
    ],
    unit: 'km',
  },
  food: {
    current: [
      { value: 'beef', label: 'Eat beef' },
      { value: 'chicken', label: 'Eat chicken' },
      { value: 'pork', label: 'Eat pork' },
    ],
    alternative: [
      { value: 'vegetarian', label: 'Go vegetarian' },
      { value: 'vegan', label: 'Go vegan' },
      { value: 'chicken', label: 'Switch to chicken' },
      { value: 'fish', label: 'Switch to fish' },
    ],
    unit: 'meals',
  },
  electricity: {
    current: [
      { value: 'electricity', label: 'Standard electricity' },
    ],
    alternative: [
      { value: 'electricity', label: 'Reduced usage' },
      { value: 'solar', label: 'Solar energy' },
    ],
    unit: 'kWh',
  },
  shopping: {
    current: [
      { value: 'new_clothing', label: 'Buy new clothing' },
      { value: 'electronics', label: 'New electronics' },
    ],
    alternative: [
      { value: 'secondhand_clothing', label: 'Buy second-hand' },
      { value: 'refurbished', label: 'Buy refurbished' },
    ],
    unit: 'items',
  },
};

function getEmission(category, type, amount) {
  // Try to get from EMISSION_FACTORS
  const factors = EMISSION_FACTORS || {};
  const catFactors = factors[category] || {};
  const factor = catFactors[type];

  // Fallback factors if EMISSION_FACTORS doesn't have it
  const FALLBACK = {
    transport: { car: 0.21, bus: 0.089, train: 0.041, bike: 0, walk: 0, ev: 0.053, flight_domestic: 0.255 },
    food: { beef: 6.61, chicken: 1.82, pork: 3.35, vegetarian: 0.69, vegan: 0.45, fish: 1.34 },
    electricity: { electricity: 0.42, solar: 0.05 },
    shopping: { new_clothing: 25, secondhand_clothing: 2.5, electronics: 50, refurbished: 15 },
  };

  const usedFactor = factor ?? FALLBACK[category]?.[type] ?? 0;
  return usedFactor * amount;
}

export default function Simulator() {
  const { state } = useApp();
  const [visible, setVisible] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [aiInsight, setAiInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Custom scenario state
  const [customCategory, setCustomCategory] = useState('transport');
  const [customCurrent, setCustomCurrent] = useState('car');
  const [customAlternative, setCustomAlternative] = useState('bike');
  const [customAmount, setCustomAmount] = useState(10);
  const [showCustomResult, setShowCustomResult] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  // Calculate comparison for a scenario
  function calculateScenario(scenario) {
    const currentCO2 = getEmission(
      scenario.current.category,
      scenario.current.type,
      scenario.current.distance || scenario.current.amount || 1
    );
    const altCO2 = getEmission(
      scenario.alternative.category,
      scenario.alternative.type,
      scenario.alternative.distance || scenario.alternative.amount || 1
    );
    const savings = currentCO2 - altCO2;
    const savingsPercent = currentCO2 > 0 ? (savings / currentCO2) * 100 : 0;

    return {
      currentCO2: Math.max(0, currentCO2),
      alternativeCO2: Math.max(0, altCO2),
      savings: Math.max(0, savings),
      savingsPercent: Math.max(0, savingsPercent),
      yearlySavings: Math.max(0, savings * 365),
      treesEquivalent: Math.max(0, Math.round((savings * 365) / 21)),
    };
  }

  function handleSelectScenario(scenario) {
    setSelectedScenario(scenario);
    const result = calculateScenario(scenario);
    setComparison(result);
    setShowCustomResult(false);

    // Fetch AI insight
    setLoadingInsight(true);
    setAiInsight('');
    getSimulatorInsight(
      scenario.title,
      result.savings,
      result.yearlySavings
    )
      .then((insight) => setAiInsight(insight || ''))
      .catch(() => setAiInsight(''))
      .finally(() => setLoadingInsight(false));
  }

  function handleCustomCalculate() {
    const currentCO2 = getEmission(customCategory, customCurrent, customAmount);
    const altCO2 = getEmission(customCategory, customAlternative, customAmount);
    const savings = currentCO2 - altCO2;

    setComparison({
      currentCO2: Math.max(0, currentCO2),
      alternativeCO2: Math.max(0, altCO2),
      savings: Math.max(0, savings),
      savingsPercent: currentCO2 > 0 ? Math.max(0, (savings / currentCO2) * 100) : 0,
      yearlySavings: Math.max(0, savings * 365),
      treesEquivalent: Math.max(0, Math.round((savings * 365) / 21)),
    });

    setSelectedScenario({
      title: 'Custom Scenario',
      emoji: '🔧',
      description: `${customCurrent} → ${customAlternative}`,
    });
    setShowCustomResult(true);

    setLoadingInsight(true);
    setAiInsight('');
    getSimulatorInsight(
      `switching from ${customCurrent} to ${customAlternative}`,
      Math.max(0, savings),
      Math.max(0, savings * 365)
    )
      .then((insight) => setAiInsight(insight || ''))
      .catch(() => setAiInsight(''))
      .finally(() => setLoadingInsight(false));
  }

  const customOptions = CUSTOM_OPTIONS[customCategory] || CUSTOM_OPTIONS.transport;

  // Reset dropdowns when category changes
  useEffect(() => {
    const opts = CUSTOM_OPTIONS[customCategory];
    if (opts) {
      setCustomCurrent(opts.current[0]?.value || '');
      setCustomAlternative(opts.alternative[0]?.value || '');
      setCustomAmount(customCategory === 'transport' ? 10 : customCategory === 'electricity' ? 300 : 1);
    }
  }, [customCategory]);

  return (
    <Layout>
      <div
        className={`transition-all duration-700 pb-12 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              What If? Simulator
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 ml-13">
            See how small changes make a big difference for our planet
          </p>
        </div>

        {/* Scenario Selector */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Choose a Scenario
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {SCENARIOS.map((scenario) => {
              const isSelected = selectedScenario?.id === scenario.id;
              return (
                <button
                  key={scenario.id}
                  onClick={() => handleSelectScenario(scenario)}
                  className={`relative group text-left transition-all duration-300 ${
                    isSelected ? 'scale-105' : 'hover:scale-102'
                  }`}
                >
                  {isSelected && (
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${scenario.color} rounded-xl blur opacity-40`} />
                  )}
                  <div
                    className={`relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border ${
                      isSelected
                        ? 'border-emerald-400 dark:border-emerald-600'
                        : 'border-gray-200/50 dark:border-gray-700/50'
                    } p-4 shadow-lg hover:shadow-xl transition-all duration-300 h-full`}
                  >
                    <div className="text-3xl mb-2">{scenario.emoji}</div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {scenario.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {scenario.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Section */}
        {comparison && (
          <div className="mb-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Comparison Card */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-15 group-hover:opacity-25 transition-opacity duration-500" />
              <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-emerald-500" />
                  Impact Comparison
                </h3>

                <SimulatorCard
                  currentLabel={selectedScenario?.current?.type?.replace(/_/g, ' ') || 'Current'}
                  currentCO2={comparison.currentCO2}
                  alternativeLabel={selectedScenario?.alternative?.type?.replace(/_/g, ' ') || 'Alternative'}
                  alternativeCO2={comparison.alternativeCO2}
                />

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {comparison.currentCO2.toFixed(2)}
                    </p>
                    <p className="text-xs text-red-500/80 mt-1">Current (kg CO₂)</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {comparison.alternativeCO2.toFixed(2)}
                    </p>
                    <p className="text-xs text-emerald-500/80 mt-1">Alternative (kg CO₂)</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {comparison.savingsPercent.toFixed(0)}%
                    </p>
                    <p className="text-xs text-blue-500/80 mt-1">Reduction</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      🌳 {comparison.treesEquivalent}
                    </p>
                    <p className="text-xs text-green-500/80 mt-1">Trees/year equiv.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insight */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500 animate-pulse" />
              <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-xl border-2 border-emerald-400/30 dark:border-emerald-500/20 p-5 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-br from-emerald-400 to-teal-500 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      AI Fun Fact
                    </h4>
                    {loadingInsight ? (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-sm text-gray-500">Getting insight...</span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {aiInsight || "Select a scenario above to see AI-powered insights about your environmental impact! 💡"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Scenario Builder */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-500" />
              Build Your Own Scenario
            </h2>

            <div className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Category
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                >
                  {CUSTOM_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scenario Description */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Instead of...
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  {/* Current Option */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                      Current choice
                    </label>
                    <select
                      value={customCurrent}
                      onChange={(e) => setCustomCurrent(e.target.value)}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {customOptions.current.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                      Amount ({customOptions.unit})
                    </label>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(Math.max(0, Number(e.target.value)))}
                      min="0"
                      step="1"
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Alternative */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                      I could instead
                    </label>
                    <select
                      value={customAlternative}
                      onChange={(e) => setCustomAlternative(e.target.value)}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {customOptions.alternative.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Calculate Button */}
              <button
                onClick={handleCustomCalculate}
                className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Calculator className="w-5 h-5" />
                Calculate Impact
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
