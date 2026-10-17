// ═══════════════════════════════════════════════════
// ECOTRACK AI — EMISSIONS & POLLUTANT RADAR PAGE
// Interactive City Map showing dynamic carbon emissions and air pollutant hotspots
// Inspired by command-center geospatial UI
// ═══════════════════════════════════════════════════

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  MapPin,
  Flame,
  Wind,
  Factory,
  Car,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Compass,
  Filter,
  Layers,
  ChevronRight,
  Send,
  Loader2,
  SlidersHorizontal,
  Info,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import Layout from '../components/Layout';
import EmissionsMapCanvas from '../components/EmissionsMapCanvas';
import HotspotAuditModal from '../components/HotspotAuditModal';
import VoiceAgentButton from '../components/VoiceAgentButton';
import {
  searchCities,
  reverseGeocode,
  getLiveAirQuality,
  getCityHotspots,
} from '../services/cityPollutionService';
import { sendChatMessage } from '../utils/agentBot';

// Preset popular cities for instant one-click switching
const PRESET_CITIES = [
  { name: 'Lucknow', label: 'Lucknow, UP', lat: 26.8467, lon: 80.9462 },
  { name: 'Delhi NCR', label: 'Delhi NCR', lat: 28.6139, lon: 77.209 },
  { name: 'Mumbai', label: 'Mumbai, MH', lat: 19.076, lon: 72.8777 },
  { name: 'Bengaluru', label: 'Bengaluru, KA', lat: 12.9716, lon: 77.5946 },
  { name: 'London', label: 'London, UK', lat: 51.5074, lon: -0.1278 },
  { name: 'New York', label: 'New York, US', lat: 40.7128, lon: -74.006 },
  { name: 'Tokyo', label: 'Tokyo, JP', lat: 35.6762, lon: 139.6503 },
];

const RADIUS_OPTIONS = [5, 10, 25, 50];

const CATEGORY_FILTERS = [
  'All',
  'Industrial',
  'Traffic Gridlock',
  'Thermal Power',
  'Waste & Landfill',
  'Aviation & Logistics',
];

export default function EmissionsMap() {
  // Current active city state (default to Lucknow as in the screenshot)
  const [selectedCity, setSelectedCity] = useState({
    name: 'Lucknow',
    label: 'Lucknow, Uttar Pradesh',
    lat: 26.8467,
    lon: 80.9462,
  });

  const [radiusKm, setRadiusKm] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  // Data states
  const [liveAqi, setLiveAqi] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [loadingHotspots, setLoadingHotspots] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [auditingHotspot, setAuditingHotspot] = useState(null);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [threatFilter, setThreatFilter] = useState('All');

  // AI Ask bar state
  const [askInput, setAskInput] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState(null);

  const searchDebounceRef = useRef(null);

  // Load live atmospheric data and dynamic hotspots when city or radius changes
  useEffect(() => {
    let isMounted = true;
    setLoadingHotspots(true);

    async function loadData() {
      try {
        // 1. Fetch live air quality for city coordinates
        const aqi = await getLiveAirQuality(selectedCity.lat, selectedCity.lon);
        if (!isMounted) return;
        setLiveAqi(aqi);

        // 2. Fetch dynamic hotspots for this city
        const spots = await getCityHotspots(
          selectedCity.name,
          selectedCity.lat,
          selectedCity.lon,
          radiusKm,
          aqi
        );

        if (!isMounted) return;
        setHotspots(spots);
        if (spots.length > 0) {
          setSelectedHotspot(spots[0]);
        }
      } catch (err) {
        console.error('Error loading emissions map data:', err);
      } finally {
        if (isMounted) setLoadingHotspots(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedCity, radiusKm]);

  // Handle dynamic city search with OpenStreetMap Nominatim
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!val || val.trim().length < 2) {
      setSearchResults([]);
      setSearchDropdownOpen(false);
      return;
    }

    setIsSearching(true);
    setSearchDropdownOpen(true);

    searchDebounceRef.current = setTimeout(async () => {
      const results = await searchCities(val);
      setSearchResults(results);
      setIsSearching(false);
    }, 400);
  };

  const handleSelectCityResult = (cityItem) => {
    setSelectedCity({
      name: cityItem.name,
      label: cityItem.shortLabel || cityItem.displayName,
      lat: cityItem.lat,
      lon: cityItem.lon,
    });
    setSearchQuery('');
    setSearchDropdownOpen(false);
  };

  // Geolocation detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const geoInfo = await reverseGeocode(latitude, longitude);
        setSelectedCity({
          name: geoInfo.name,
          label: geoInfo.shortLabel,
          lat: geoInfo.lat,
          lon: geoInfo.lon,
        });
        setIsSearching(false);
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err);
        setIsSearching(false);
      }
    );
  };

  // Filtered hotspots list
  const filteredHotspots = useMemo(() => {
    return hotspots.filter((spot) => {
      const matchCat =
        categoryFilter === 'All' ||
        spot.category.toLowerCase().includes(categoryFilter.toLowerCase());
      const matchThreat =
        threatFilter === 'All' || spot.threatLevel.toLowerCase() === threatFilter.toLowerCase();
      return matchCat && matchThreat;
    });
  }, [hotspots, categoryFilter, threatFilter]);

  // Handle Ask EcoBot submission
  const handleAskSubmit = async (e, customQuestion = null) => {
    e?.preventDefault();
    if (askLoading) return;

    // If input is empty and no customQuestion provided, use smart city question
    const defaultQuestion = `What are the top carbon mitigation and air quality priorities for ${selectedCity.name}?`;
    const question = customQuestion || (askInput.trim() ? askInput.trim() : defaultQuestion);

    setAskLoading(true);
    setAiAnswer(null);
    setAskInput('');

    try {
      const prompt = `The user is examining the carbon emissions and air pollution hotspot radar for ${
        selectedCity.name
      }.
Current City Stats:
- US AQI: ${liveAqi?.usAqi || 'N/A'} (${liveAqi?.aqiStatus || ''})
- PM2.5: ${liveAqi?.pm25 || 'N/A'} µg/m³
- NO2: ${liveAqi?.no2 || 'N/A'} µg/m³
- Active Plotted Hotspots: ${hotspots.length}

User Question: "${question}"
Provide a concise, expert 2-3 sentence answer explaining environmental impacts or practical solutions for this city.`;

      const response = await sendChatMessage(prompt, [], []);
      setAiAnswer({ question, answer: response });
    } catch (err) {
      console.error('Ask EcoBot error:', err);
      setAiAnswer({
        question,
        answer: 'I was unable to retrieve a response at this time. Please try again.',
      });
    } finally {
      setAskLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        {/* ─── Top Filter & City Control Bar (Matching Screenshot Header) ─── */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-dark-card/90 backdrop-blur-xl border border-primary-100 dark:border-dark-border shadow-sm">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input with Dynamic Geocoding Autocomplete */}
            <div className="relative flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.length >= 2 && setSearchDropdownOpen(true)}
                  placeholder="Search any city worldwide (e.g. Lucknow, Chicago, Berlin)..."
                  className="w-full pl-10 pr-24 py-2.5 text-sm rounded-2xl bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
                <button
                  onClick={handleDetectLocation}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/50 dark:border-emerald-800/50 flex items-center gap-1 transition-all"
                  title="Detect My Location"
                >
                  <MapPin className="w-3 h-3" />
                  <span>GPS</span>
                </button>
              </div>

              {/* Dynamic Autocomplete Dropdown */}
              {searchDropdownOpen && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-2xl overflow-hidden animate-fade-in">
                  <div className="px-3 py-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-dark-surface">
                    Found {searchResults.length} Global Locations
                  </div>
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectCityResult(item)}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center justify-between border-b border-gray-100 dark:border-dark-border/40 last:border-b-0 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.shortLabel}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Preset City Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 mr-1 hidden sm:inline">
                Presets:
              </span>
              {PRESET_CITIES.map((city) => {
                const isActive = selectedCity.name.toLowerCase() === city.name.toLowerCase();
                return (
                  <button
                    key={city.name}
                    onClick={() => {
                      setSelectedCity(city);
                      setSearchQuery('');
                      setSearchDropdownOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/20'
                        : 'bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {city.label}
                  </button>
                );
              })}
            </div>

            {/* Radius Catchment Selector */}
            <div className="flex items-center gap-2 self-start lg:self-auto">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Catchment:
              </span>
              <div className="flex p-0.5 rounded-xl bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
                {RADIUS_OPTIONS.map((rad) => (
                  <button
                    key={rad}
                    onClick={() => setRadiusKm(rad)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      radiusKm === rad
                        ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                    }`}
                  >
                    {rad}km
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Secondary Filter Row: Pollutant Categories & Threat Levels */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-dark-border flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="font-semibold text-gray-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Source:
              </span>
              {CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    categoryFilter === cat
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-700'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Threat Level Filter */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="font-semibold text-gray-400 mr-1">Threat:</span>
              {['All', 'Critical', 'High', 'Moderate'].map((threat) => (
                <button
                  key={threat}
                  onClick={() => setThreatFilter(threat)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
                    threatFilter === threat
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  {threat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Main Map Command Center (Matching Screenshot Aesthetic) ─── */}
        <div className="relative">
          {loadingHotspots && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm rounded-3xl">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex items-center gap-3 text-white">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                <span className="text-sm font-semibold">
                  Synthesizing real-time atmospheric & emission hotspots for {selectedCity.name}...
                </span>
              </div>
            </div>
          )}

          <EmissionsMapCanvas
            centerLat={selectedCity.lat}
            centerLon={selectedCity.lon}
            cityName={selectedCity.label || selectedCity.name}
            radiusKm={radiusKm}
            hotspots={filteredHotspots}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={(spot) => setSelectedHotspot(spot)}
            onInspectHotspot={(spot) => setAuditingHotspot(spot)}
            liveAqi={liveAqi}
          />
        </div>

        {/* ─── Live Atmospheric Summary Row ─── */}
        {liveAqi && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-primary-100 dark:border-dark-border shadow-sm">
              <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Live US AQI
              </div>
              <div
                className="text-2xl font-bold font-display mt-1"
                style={{ color: liveAqi.aqiColor }}
              >
                {liveAqi.usAqi}
              </div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                {liveAqi.aqiStatus}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-primary-100 dark:border-dark-border shadow-sm">
              <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                PM2.5 Smog
              </div>
              <div className="text-2xl font-bold font-display text-gray-800 dark:text-white mt-1">
                {liveAqi.pm25}{' '}
                <span className="text-xs font-normal text-gray-400">µg/m³</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Fine particulates
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-primary-100 dark:border-dark-border shadow-sm">
              <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                PM10 Coarse
              </div>
              <div className="text-2xl font-bold font-display text-gray-800 dark:text-white mt-1">
                {liveAqi.pm10}{' '}
                <span className="text-xs font-normal text-gray-400">µg/m³</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Mineral dust & soot
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-primary-100 dark:border-dark-border shadow-sm">
              <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Nitrogen Dioxide
              </div>
              <div className="text-2xl font-bold font-display text-gray-800 dark:text-white mt-1">
                {liveAqi.no2}{' '}
                <span className="text-xs font-normal text-gray-400">µg/m³</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Vehicular exhaust
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-primary-100 dark:border-dark-border shadow-sm">
              <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Carbon Monoxide
              </div>
              <div className="text-2xl font-bold font-display text-gray-800 dark:text-white mt-1">
                {liveAqi.co}{' '}
                <span className="text-xs font-normal text-gray-400">µg/m³</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Combustion byproduct
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-primary-100 dark:border-dark-border shadow-sm">
              <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Sulphur Dioxide
              </div>
              <div className="text-2xl font-bold font-display text-gray-800 dark:text-white mt-1">
                {liveAqi.so2}{' '}
                <span className="text-xs font-normal text-gray-400">µg/m³</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Industrial coal/oil
              </div>
            </div>
          </div>
        )}

        {/* ─── Hotspot Threat Matrix Table (Directly Matching the Table in the Screenshot) ─── */}
        <div className="rounded-3xl bg-white/90 dark:bg-dark-card/90 border border-primary-100 dark:border-dark-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-primary-100 dark:border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold font-display text-gray-900 dark:text-white text-base">
                Hotspot Threat Directory & Carbon Matrix
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-dark-surface text-emerald-700 dark:text-emerald-300">
              {filteredHotspots.length} Nodes in {radiusKm}km Zone
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50/70 dark:bg-dark-surface/50 border-b border-gray-100 dark:border-dark-border">
                <tr>
                  <th className="px-6 py-3.5">Facility / Hotspot Name</th>
                  <th className="px-4 py-3.5">Distance</th>
                  <th className="px-4 py-3.5">Est. Daily CO₂</th>
                  <th className="px-4 py-3.5">Dominant Pollutant</th>
                  <th className="px-4 py-3.5">Local AQI</th>
                  <th className="px-4 py-3.5">Threat Level</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border/40">
                {filteredHotspots.map((spot) => {
                  const isSelected = selectedHotspot?.id === spot.id;
                  return (
                    <tr
                      key={spot.id}
                      onClick={() => setSelectedHotspot(spot)}
                      className={`cursor-pointer transition-colors duration-150 ${
                        isSelected
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/25'
                          : 'hover:bg-gray-50/60 dark:hover:bg-dark-surface/40'
                      }`}
                    >
                      {/* Name & Category */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {spot.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            {spot.category}
                          </span>
                          <span>•</span>
                          <span className="truncate max-w-xs">{spot.description}</span>
                        </div>
                      </td>

                      {/* Distance */}
                      <td className="px-4 py-4 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        {spot.distanceKm < 1
                          ? `${Math.round(spot.distanceKm * 1000)}m`
                          : `${spot.distanceKm} km`}
                      </td>

                      {/* Daily CO2 */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {spot.estimatedCO2TonsDay}
                        </span>{' '}
                        <span className="text-xs text-gray-400">Tons/day</span>
                      </td>

                      {/* Dominant Pollutant */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-300">
                          {spot.primaryPollutant}
                        </span>
                      </td>

                      {/* Local AQI */}
                      <td className="px-4 py-4 whitespace-nowrap font-bold text-gray-800 dark:text-gray-200">
                        {spot.aqi || 120}
                      </td>

                      {/* Threat Level Badge (Matching Screenshot) */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              spot.threatLevel === 'Critical'
                                ? 'bg-rose-500 animate-pulse'
                                : spot.threatLevel === 'High'
                                ? 'bg-orange-500'
                                : spot.threatLevel === 'Moderate'
                                ? 'bg-amber-400'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <span
                            className={
                              spot.threatLevel === 'Critical'
                                ? 'text-rose-600 dark:text-rose-400'
                                : spot.threatLevel === 'High'
                                ? 'text-orange-600 dark:text-orange-400'
                                : spot.threatLevel === 'Moderate'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }
                          >
                            {spot.threatLevel}
                          </span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHotspot(spot);
                            setAuditingHotspot(spot);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-sm transition-all"
                        >
                          Inspect AI
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Floating Bottom AI Ask Bar (Matching Screenshot Floating Bar) ─── */}
        <div className="relative space-y-2">
          {/* Quick Suggestion Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            <span className="text-gray-400 font-medium mr-1 flex items-center gap-1 shrink-0">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Suggested:
            </span>
            {[
              `⚡ Key Priorities in ${selectedCity.name}`,
              `🏭 Industrial Scrubbers & Stack Standards`,
              `🚗 Traffic Congestion & EV Solutions`,
              `🛡️ Sensitive Health Precautions`,
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleAskSubmit(null, chip)}
                disabled={askLoading}
                className="px-2.5 py-1 rounded-xl bg-white/70 dark:bg-dark-card/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-[11px] whitespace-nowrap transition-all shadow-sm"
              >
                {chip}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleAskSubmit}
            className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-white/90 dark:bg-dark-card/90 backdrop-blur-xl border border-primary-200/80 dark:border-dark-border shadow-xl"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>

            <input
              type="text"
              value={askInput}
              onChange={(e) => setAskInput(e.target.value)}
              placeholder={`Ask anything about carbon mitigation, industrial scrubbers, or air quality in ${selectedCity.name}...`}
              className="flex-1 bg-transparent text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none"
            />

            {/* Launch Voice Agent OS (Matching Screenshot [ 〰️ Voice Agent OS ]) */}
            <VoiceAgentButton
              context={{
                cityName: selectedCity.name,
                liveAqi: liveAqi,
                hotspotsCount: filteredHotspots.length,
              }}
            />

            <button
              type="submit"
              disabled={askLoading}
              className="p-2 sm:px-4 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
            >
              {askLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Analyzing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ask EcoBot</span>
                </>
              )}
            </button>
          </form>

          {/* AI Response Card */}
          {aiAnswer && (
            <div className="mt-3 p-4 sm:p-5 rounded-2xl bg-emerald-50/90 dark:bg-dark-card border border-emerald-300 dark:border-emerald-800/80 shadow-xl animate-fade-in relative">
              <button
                onClick={() => setAiAnswer(null)}
                className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
                title="Dismiss"
              >
                ✕
              </button>
              <div className="flex items-center justify-between mb-2 pr-6">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  EcoBot Environmental Advisory
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 italic truncate max-w-xs">
                  "{aiAnswer.question}"
                </span>
              </div>
              <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                {aiAnswer.answer}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Detailed AI Audit Modal ─── */}
      {auditingHotspot && (
        <HotspotAuditModal
          hotspot={auditingHotspot}
          cityName={selectedCity.label || selectedCity.name}
          liveAqi={liveAqi}
          onClose={() => setAuditingHotspot(null)}
        />
      )}
    </Layout>
  );
}
