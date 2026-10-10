// ═══════════════════════════════════════════════════
// ECOTRACK AI — LAYOUT SHELL COMPONENT
// ═══════════════════════════════════════════════════

import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  ScanLine,
  Shuffle,
  Trophy,
  Leaf,
  Menu,
  X,
  Search,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useApp } from '../store/AppContext';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tracker', label: 'Tracker', icon: ClipboardList },
  { path: '/simulator', label: 'Simulator', icon: Shuffle },
  { path: '/challenges', label: 'Reduction Goals', icon: Trophy },
];

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/tracker': 'Activity Tracker',
  '/simulator': 'What If Simulator',
  '/challenges': 'Reduction Goals',
};

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { ecoScore, ecoTier } = useApp();

  const currentTitle = PAGE_TITLES[location.pathname] || 'EcoTrack AI';

  return (
    <div className="flex h-screen overflow-hidden dark:bg-dark-bg">
      {/* ─── Mobile Overlay ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col
          bg-white/80 dark:bg-dark-card/90 backdrop-blur-xl
          border-r border-primary-100 dark:border-dark-border
          transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-primary-100 dark:border-dark-border">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-green shadow-lg shadow-primary-500/20">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold font-display text-primary-800 dark:text-primary-300 tracking-tight">
            EcoTrack
          </h1>

          {/* Close button on mobile */}
          <button
            className="ml-auto lg:hidden p-1 rounded-lg hover:bg-primary-100 dark:hover:bg-dark-surface"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-dark-surface hover:text-primary-700 dark:hover:text-primary-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                    ${
                      isActive
                        ? 'gradient-green text-white shadow-md shadow-primary-500/25'
                        : 'bg-primary-100/50 dark:bg-dark-surface text-gray-500 dark:text-gray-400 group-hover:bg-primary-100 dark:group-hover:bg-dark-border group-hover:text-primary-600 dark:group-hover:text-primary-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse-green" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* EcoScore Mini Badge */}
        <div className="px-4 py-4 mx-3 mb-4 rounded-xl bg-primary-50 dark:bg-dark-surface border border-primary-100 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full font-display text-lg font-bold text-white"
                style={{
                  background: `conic-gradient(${ecoTier.color} ${ecoScore * 3.6}deg, rgba(200,200,200,0.15) 0deg)`,
                }}
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-dark-card">
                  <span className="text-sm font-bold font-display" style={{ color: ecoTier.color }}>
                    {ecoScore}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Sustainability Index</p>
              <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                {ecoTier.emoji} {ecoTier.label}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 lg:px-8 py-4 bg-white/70 dark:bg-dark-bg/70 backdrop-blur-xl border-b border-primary-100/50 dark:border-dark-border/50">
          {/* Hamburger */}
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-primary-100 dark:hover:bg-dark-surface transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-primary-700 dark:text-primary-400" />
          </button>

          {/* Page Title */}
          <h2 className="text-xl font-bold font-display text-gray-800 dark:text-white">
            {currentTitle}
          </h2>

          {/* Decorative Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search activities, tips..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl 
                  bg-primary-50 dark:bg-dark-surface 
                  border border-primary-100 dark:border-dark-border
                  text-gray-700 dark:text-gray-300 
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-300 dark:focus:border-primary-600
                  transition-all duration-200"
                readOnly
              />
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
          {children}
        </main>
      </div>

      {/* ─── Mobile Bottom Tab Bar ─── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/90 dark:bg-dark-card/90 backdrop-blur-xl border-t border-primary-100 dark:border-dark-border">
        <div className="flex items-center justify-around px-2 py-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <NavLink
                key={path}
                to={path}
                className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200"
              >
                <div
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'gradient-green text-white shadow-md shadow-primary-500/25'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
