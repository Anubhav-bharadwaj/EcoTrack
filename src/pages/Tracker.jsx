import { useState, useMemo, useEffect } from 'react';
import { ClipboardList, Filter, Calendar, Leaf, TrendingDown, Lightbulb, Plus } from 'lucide-react';
import { useApp } from '../store/AppContext';
import Layout from '../components/Layout';
import ActivityForm from '../components/ActivityForm';
import SmartScanner from '../components/SmartScanner';
import ActivityCard from '../components/ActivityCard';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All', emoji: '📊' },
  { key: 'transport', label: 'Transport', emoji: '🚗' },
  { key: 'electricity', label: 'Electricity', emoji: '⚡' },
  { key: 'food', label: 'Food', emoji: '🍽️' },
  { key: 'shopping', label: 'Shopping', emoji: '🛍️' },
];

const QUICK_TIPS = [
  'Unplug chargers when not in use — phantom power adds up!',
  'A plant-based meal saves ~2.5kg CO₂ compared to beef.',
  'Taking the train instead of driving cuts emissions by 70%.',
  'Buying second-hand prevents ~25kg CO₂ per clothing item.',
  'Air-drying clothes instead of using a dryer saves ~2.4kg CO₂ per load.',
  'LED bulbs use 75% less energy than incandescent ones.',
  'A 5-minute shorter shower saves ~10L of water and the energy to heat it.',
];

export default function Tracker() {
  const { state } = useApp();
  const [activeFilter, setActiveFilter] = useState('all');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  const activities = state.activities || [];

  const filteredActivities = useMemo(() => {
    const sorted = [...activities].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    if (activeFilter === 'all') return sorted;
    return sorted.filter((a) => a.category === activeFilter);
  }, [activities, activeFilter]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const todayCO2 = activities
      .filter((a) => a.date && a.date.startsWith(todayStr))
      .reduce((sum, a) => sum + (a.co2 || 0), 0);

    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekCO2 = activities
      .filter((a) => new Date(a.date) >= weekAgo)
      .reduce((sum, a) => sum + (a.co2 || 0), 0);

    return { todayCO2, weekCO2 };
  }, [activities]);

  const randomTip = useMemo(
    () => QUICK_TIPS[Math.floor(Math.random() * QUICK_TIPS.length)],
    []
  );

  return (
    <Layout>
      <div
        className={`transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Activity Tracker
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 ml-13">
            Log your daily activities and track your carbon footprint over time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Activity Form */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-15 group-hover:opacity-25 transition-opacity duration-500" />
              <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" />
                  Log New Activity
                </h2>
                <ActivityForm />
              </div>
            </div>

            {/* Smart AI Scanner */}
            <SmartScanner />

            {/* Activity History */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Recent Activities
                  </h2>
                  <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium px-2.5 py-0.5 rounded-full">
                    {filteredActivities.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Filter className="w-4 h-4 text-gray-400 mr-1" />
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setActiveFilter(opt.key)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeFilter === opt.key
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="hidden sm:inline">{opt.emoji} </span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity List */}
              {filteredActivities.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Leaf className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                    No activities logged yet
                  </h3>
                  <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm mx-auto">
                    Start tracking your carbon footprint by logging your first activity above. Every small action counts! 🌱
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                  {filteredActivities.map((activity, index) => (
                    <div
                      key={activity.id || index}
                      className="transition-all duration-300"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <ActivityCard activity={activity} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-4">
            {/* Today's CO2 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-5 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 w-9 h-9 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Today&apos;s CO₂
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {summaryStats.todayCO2.toFixed(1)}
                  <span className="text-base font-normal text-gray-400 ml-1">kg</span>
                </p>
              </div>
            </div>

            {/* This Week's CO2 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-5 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 w-9 h-9 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    This Week
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {summaryStats.weekCO2.toFixed(1)}
                  <span className="text-base font-normal text-gray-400 ml-1">kg</span>
                </p>
              </div>
            </div>

            {/* Quick Tip */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-amber-100 dark:bg-amber-900/30 w-9 h-9 rounded-lg flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Quick Tip
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  💡 {randomTip}
                </p>
              </div>
            </div>

            {/* Equivalence Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white shadow-lg shadow-emerald-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Leaf className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">Your Impact</span>
              </div>
              <p className="text-2xl font-bold mb-1">
                {summaryStats.weekCO2.toFixed(1)} kg CO₂
              </p>
              <p className="text-sm opacity-80">
                That&apos;s equivalent to{' '}
                {summaryStats.weekCO2 > 0
                  ? `driving ${(summaryStats.weekCO2 / 0.21).toFixed(0)} km in a car`
                  : 'zero emissions — amazing! 🎉'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
