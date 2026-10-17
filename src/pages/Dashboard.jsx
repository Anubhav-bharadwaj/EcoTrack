import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingDown, Activity, Flame, Award, Sparkles, Leaf, Zap, Radar, ArrowRight } from 'lucide-react';
import { useApp } from '../store/AppContext';
import {
  calculateCO2,
  calculateEcoScore,
  getEcoTier,
  getEquivalent,
  getCategoryBreakdown,
  getWeeklyData,
} from '../utils/carbonCalculator';
import { getRecommendations } from '../utils/agentBot';
import Layout from '../components/Layout';
import EcoScoreGauge from '../components/EcoScoreGauge';
import CategoryChart from '../components/CategoryChart';
import TrendChart from '../components/TrendChart';
import GlobalImpact from '../components/GlobalImpact';

export default function Dashboard() {
  const { state } = useApp();
  const [aiTip, setAiTip] = useState('');
  const [loadingTip, setLoadingTip] = useState(false);
  const [visibleSections, setVisibleSections] = useState([]);

  // Staggered fade-in animation
  useEffect(() => {
    const sections = ['header', 'hero', 'charts', 'insight', 'impact'];
    sections.forEach((section, i) => {
      setTimeout(() => {
        setVisibleSections((prev) => [...prev, section]);
      }, 150 * (i + 1));
    });
  }, []);

  const sectionClass = (name) =>
    `transition-all duration-700 ease-out ${
      visibleSections.includes(name)
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-6'
    }`;

  // Compute stats from activities
  const stats = useMemo(() => {
    const activities = state.activities || [];
    const now = new Date();
    const thisMonth = activities.filter((a) => {
      const d = new Date(a.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const totalCO2 = thisMonth.reduce((sum, a) => sum + (a.co2 || 0), 0);
    const activityCount = activities.length;

    // Calculate streak (consecutive days with activities)
    let streak = 0;
    if (activities.length > 0) {
      const sorted = [...activities].sort((a, b) => new Date(b.date) - new Date(a.date));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let checkDate = new Date(today);

      for (let i = 0; i < 365; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasActivity = sorted.some((a) => a.date && a.date.startsWith(dateStr));
        if (hasActivity) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Best category (lowest emission)
    const catTotals = {};
    thisMonth.forEach((a) => {
      const cat = a.category || 'other';
      catTotals[cat] = (catTotals[cat] || 0) + (a.co2 || 0);
    });
    const bestCategory =
      Object.keys(catTotals).length > 0
        ? Object.entries(catTotals).sort((a, b) => a[1] - b[1])[0][0]
        : 'transport';

    const ecoScore = calculateEcoScore ? calculateEcoScore(activities) : 72;
    const tier = getEcoTier ? getEcoTier(ecoScore) : { label: 'Eco Warrior', color: 'emerald' };

    return { totalCO2, activityCount, streak, bestCategory, ecoScore, tier };
  }, [state.activities]);

  const CATEGORY_COLORS = {
    transport: { name: 'Transport', color: '#3b82f6' },
    electricity: { name: 'Electricity', color: '#f59e0b' },
    food: { name: 'Food', color: '#10b981' },
    shopping: { name: 'Shopping', color: '#8b5cf6' },
  };

  const categoryBreakdown = useMemo(() => {
    const breakdown = getCategoryBreakdown
      ? getCategoryBreakdown(state.activities || [])
      : { transport: 0, electricity: 0, food: 0, shopping: 0 };
    return Object.entries(breakdown).map(([key, value]) => ({
      name: CATEGORY_COLORS[key]?.name || key,
      value,
      color: CATEGORY_COLORS[key]?.color || '#6b7280',
    }));
  }, [state.activities]);

  const weeklyData = useMemo(
    () => (getWeeklyData ? getWeeklyData(state.activities || []) : []),
    [state.activities]
  );

  // Fetch AI recommendation on mount
  useEffect(() => {
    setLoadingTip(true);
    getRecommendations(state.activities)
      .then((rec) => {
        setAiTip(rec);
      })
      .catch(() => {})
      .finally(() => setLoadingTip(false));
  }, [state.activities]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formatCO2 = (val) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}t`;
    return `${val.toFixed(1)}kg`;
  };

  const categoryLabels = {
    transport: 'Transport',
    electricity: 'Electricity',
    food: 'Food',
    shopping: 'Shopping',
    other: 'Other',
  };

  const statCards = [
    {
      label: 'CO₂ This Month',
      value: formatCO2(stats.totalCO2),
      icon: TrendingDown,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Activities Logged',
      value: stats.activityCount,
      icon: Activity,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Current Streak',
      value: `${stats.streak} day${stats.streak !== 1 ? 's' : ''}`,
      icon: Flame,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      label: 'Best Category',
      value: categoryLabels[stats.bestCategory] || stats.bestCategory,
      icon: Award,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        {/* Welcome Header */}
        <div className={sectionClass('header')}>
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-green-500 to-teal-400 bg-clip-text text-transparent leading-tight mb-2">
              Welcome back! 🌍
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">{today}</p>
          </div>
        </div>

        {/* Hero Row */}
        <div className={`${sectionClass('hero')} grid grid-cols-1 lg:grid-cols-2 gap-6`}>
          {/* Left: EcoScore Gauge */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 flex flex-col items-center justify-center shadow-xl">
              <EcoScoreGauge score={stats.ecoScore} />
              <div className="mt-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-500" />
                <span className="text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  {stats.tier?.label || 'Eco Warrior'}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Your environmental impact score
              </p>
            </div>
          </div>

          {/* Right: Stat Cards */}
          <div className="grid grid-cols-2 gap-4">
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="group relative"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-5 h-full flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className={`${card.bg} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {card.value}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {card.label}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Charts Row */}
        <div className={`${sectionClass('charts')} grid grid-cols-1 lg:grid-cols-2 gap-6`}>
          {/* Category Donut Chart */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Category Breakdown
              </h3>
              <CategoryChart data={categoryBreakdown} />
            </div>
          </div>

          {/* Weekly Trend Chart */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                Weekly Trend
              </h3>
              <TrendChart data={weeklyData} />
            </div>
          </div>
        </div>

        {/* AI Insight Card */}
        <div className={sectionClass('insight')}>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse" />
            <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl border-2 border-emerald-400/40 dark:border-emerald-500/30 p-6 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-emerald-400 to-teal-500 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/25">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    AI Sustainability Insight
                    <Zap className="w-4 h-4 text-emerald-500" />
                  </h3>
                  {loadingTip ? (
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Getting personalized recommendation...
                      </span>
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {aiTip}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Emissions Radar Live Map Banner */}
        <div className={sectionClass('insight')}>
          <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 p-6 sm:p-8 shadow-xl text-white">
            <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Live Geospatial Intelligence
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                  City Emissions & Pollutant Radar
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Explore real-time carbon hotspots, industrial clusters, and air pollutant matrices (PM2.5, NO₂, CO) for any city worldwide with custom satellite and dark overlays.
                </p>
              </div>

              <Link
                to="/map"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all duration-200 group-hover:scale-105 shrink-0"
              >
                <Radar className="w-4 h-4 text-slate-950" />
                <span>Launch Emissions Radar</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Global Impact Section */}
        <div className={sectionClass('impact')}>
          <GlobalImpact
            totalCO2Reduced={stats.totalCO2}
            challengesCompleted={(state.challenges || []).filter(c => c.completed).length}
            activitiesLogged={stats.activityCount}
            treesEquivalent={Math.round((stats.totalCO2 / 21) * 10) / 10}
          />
        </div>
      </div>
    </Layout>
  );
}
