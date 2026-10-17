// ═══════════════════════════════════════════════════
// ECOTRACK AI — EMISSIONS & POLLUTANT MAP CANVAS
// Leaflet-powered interactive command center with multi-layer tiles,
// custom pill markers, catchment radius, live coordinate HUD & re-center
// ═══════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  Compass,
  Maximize2,
  Navigation,
  Flame,
  AlertTriangle,
  Factory,
  Car,
  Wind,
  Plus,
  Minus,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

const TILE_LAYERS = {
  gmap: {
    name: 'G-MAP',
    layers: [
      {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        },
      },
    ],
  },
  sat: {
    name: 'SAT',
    layers: [
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        options: {
          maxZoom: 19,
          maxNativeZoom: 18,
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS',
        },
      },
    ],
  },
  dark: {
    name: 'DARK',
    layers: [
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        options: {
          maxZoom: 19,
          maxNativeZoom: 16,
          attribution: 'Tiles &copy; Esri',
        },
      },
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        options: {
          maxZoom: 19,
          maxNativeZoom: 16,
          attribution: '',
        },
      },
    ],
  },
};

export default function EmissionsMapCanvas({
  centerLat,
  centerLon,
  cityName,
  radiusKm = 10,
  hotspots = [],
  selectedHotspot,
  onSelectHotspot,
  onInspectHotspot,
  liveAqi,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const activeTileLayersRef = useRef([]);
  const circleLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [activeLayer, setActiveLayer] = useState('dark');
  const [currentCoords, setCurrentCoords] = useState({
    lat: centerLat,
    lon: centerLon,
  });
  const [showRadius, setShowRadius] = useState(true);

  // Helper to attach layers for the active preset
  const applyTileLayers = (map, layerKey) => {
    // Remove existing tile layers
    activeTileLayersRef.current.forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    activeTileLayersRef.current = [];

    const config = TILE_LAYERS[layerKey] || TILE_LAYERS.dark;
    const newLayers = config.layers.map((l) => {
      return L.tileLayer(l.url, l.options).addTo(map);
    });

    activeTileLayersRef.current = newLayers;
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy any existing instance before initializing
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLon],
      zoom: radiusKm <= 5 ? 13 : radiusKm <= 15 ? 12 : 11,
      zoomControl: false,
      attributionControl: false,
    });

    // Add Tile Layers
    applyTileLayers(map, activeLayer);

    // Feature Groups
    circleLayerRef.current = L.featureGroup().addTo(map);
    markersLayerRef.current = L.featureGroup().addTo(map);

    // Track mouse move / pan coordinates for HUD
    map.on('move', () => {
      const c = map.getCenter();
      setCurrentCoords({
        lat: parseFloat(c.lat.toFixed(4)),
        lon: parseFloat(c.lng.toFixed(4)),
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Layer change (G-MAP / SAT / DARK)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    applyTileLayers(map, activeLayer);
  }, [activeLayer]);

  // Update Center when city changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo([centerLat, centerLon], radiusKm <= 5 ? 13 : radiusKm <= 15 ? 12 : 11, {
      duration: 1.2,
      easeLinearity: 0.25,
    });

    setCurrentCoords({ lat: centerLat, lon: centerLon });
  }, [centerLat, centerLon, radiusKm]);

  // Update Catchment Circle
  useEffect(() => {
    const circleGroup = circleLayerRef.current;
    if (!circleGroup) return;

    circleGroup.clearLayers();

    if (showRadius) {
      // Catchment radius circle
      const circle = L.circle([centerLat, centerLon], {
        radius: radiusKm * 1000,
        color: '#10b981',
        weight: 1.5,
        opacity: 0.7,
        fillColor: '#10b981',
        fillOpacity: 0.08,
        dashArray: '4, 8',
      });

      // City Center Core Dot
      const centerDot = L.circleMarker([centerLat, centerLon], {
        radius: 6,
        color: '#ffffff',
        weight: 2,
        fillColor: '#10b981',
        fillOpacity: 1,
      });

      circleGroup.addLayer(circle);
      circleGroup.addLayer(centerDot);
    }
  }, [centerLat, centerLon, radiusKm, showRadius]);

  // Render Custom Markers matching screenshot pill aesthetic
  useEffect(() => {
    const markersGroup = markersLayerRef.current;
    const map = mapInstanceRef.current;
    if (!markersGroup || !map) return;

    markersGroup.clearLayers();

    hotspots.forEach((spot) => {
      const isSelected = selectedHotspot?.id === spot.id;

      // Color coding by threat level
      let badgeBg = 'bg-amber-500';
      let borderGlow = 'border-amber-400';
      let pulseRing = '';

      if (spot.threatLevel === 'Critical') {
        badgeBg = 'bg-rose-600';
        borderGlow = 'border-rose-500';
        pulseRing = 'ring-4 ring-rose-500/40 animate-pulse';
      } else if (spot.threatLevel === 'High') {
        badgeBg = 'bg-orange-500';
        borderGlow = 'border-orange-400';
        pulseRing = 'ring-2 ring-orange-500/30';
      } else if (spot.threatLevel === 'Moderate') {
        badgeBg = 'bg-amber-500';
        borderGlow = 'border-amber-400';
      } else {
        badgeBg = 'bg-emerald-600';
        borderGlow = 'border-emerald-500';
      }

      // Pill label text (e.g. 450T CO2 or AQI 310)
      const valueTag = spot.estimatedCO2TonsDay
        ? `${spot.estimatedCO2TonsDay}t CO₂`
        : `AQI ${spot.aqi || 120}`;

      const iconHtml = `
        <div class="group relative cursor-pointer transform transition-transform duration-200 hover:scale-110 ${
          isSelected ? 'scale-110 z-50' : 'z-20'
        }">
          <div class="flex items-center shadow-2xl rounded-full bg-slate-900/90 text-white border ${borderGlow} ${pulseRing} backdrop-blur-md overflow-hidden text-xs font-sans">
            <!-- Badge / Threat Value -->
            <div class="${badgeBg} text-white font-bold px-2 py-1 flex items-center gap-1 text-[11px] whitespace-nowrap">
              <span>★</span>
              <span>${valueTag}</span>
            </div>
            <!-- Name Label -->
            <div class="px-2.5 py-1 font-medium text-slate-100 max-w-[130px] truncate text-[11px] tracking-tight">
              ${spot.name}
            </div>
          </div>
          <!-- Pointer arrow -->
          <div class="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-6 border-t-slate-900 mx-auto -mt-[1px]"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-hotspot-pin',
        html: iconHtml,
        iconSize: [160, 32],
        iconAnchor: [80, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([spot.lat, spot.lon], { icon: customIcon });

      // Rich customized popup
      const popupHtml = `
        <div style="font-family: inherit; min-width: 240px; padding: 4px;" class="text-slate-800">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${
              spot.threatLevel === 'Critical' ? '#e11d48' : '#ea580c'
            };">
              ● ${spot.threatLevel} Threat
            </span>
            <span style="font-size: 11px; background: #f1f5f9; padding: 2px 6px; border-radius: 9999px; color: #475569; font-weight: 600;">
              ${spot.category}
            </span>
          </div>
          <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0; line-height: 1.3;">
            ${spot.name}
          </h4>
          <p style="font-size: 12px; color: #64748b; margin: 0 0 10px 0; line-height: 1.4;">
            ${spot.description}
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; margin-bottom: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div>
              <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Est. Daily CO₂</div>
              <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${spot.estimatedCO2TonsDay} Tons</div>
            </div>
            <div>
              <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Primary Pollutant</div>
              <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${spot.primaryPollutant}</div>
            </div>
            <div>
              <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Distance</div>
              <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${spot.distanceKm} km</div>
            </div>
            <div>
              <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Est. Local AQI</div>
              <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${spot.aqi || 120}</div>
            </div>
          </div>
          <button id="inspect-btn-${spot.id}" style="width: 100%; background: #059669; color: white; border: none; border-radius: 6px; padding: 7px 12px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <span>🔍 Inspect AI Advisory</span>
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-leaflet-popup',
        maxWidth: 290,
      });

      marker.on('click', () => {
        onSelectHotspot(spot);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`inspect-btn-${spot.id}`);
        if (btn) {
          btn.onclick = () => {
            onInspectHotspot(spot);
          };
        }
      });

      markersGroup.addLayer(marker);

      // If this spot is currently selected, open popup
      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [hotspots, selectedHotspot]);

  // Fly to selected hotspot if selection changed from outside
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedHotspot) return;

    map.flyTo([selectedHotspot.lat, selectedHotspot.lon], 14, {
      duration: 1.0,
      easeLinearity: 0.25,
    });
  }, [selectedHotspot]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    mapInstanceRef.current?.flyTo(
      [centerLat, centerLon],
      radiusKm <= 5 ? 13 : radiusKm <= 15 ? 12 : 11,
      { duration: 1.0 }
    );
  };

  return (
    <div className="relative w-full h-[520px] md:h-[580px] lg:h-[620px] rounded-3xl overflow-hidden border border-emerald-900/20 dark:border-slate-800 shadow-2xl bg-slate-950">
      {/* ─── Leaflet Container ─── */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* ─── Floating Top-Left Badges (Matching Screenshot) ─── */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
        {/* Main Catchment Pill */}
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-emerald-500/30 text-emerald-300 backdrop-blur-md shadow-xl text-xs font-semibold tracking-wide transition-all">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
          <span>{radiusKm}km Catchment</span>
          <span className="text-slate-500">•</span>
          <span className="text-white font-medium truncate max-w-[240px] sm:max-w-md">
            {cityName} Emissions & Pollutant Hotspot Map
          </span>
        </div>

        {/* Verified Count Pill */}
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/85 border border-slate-700/60 text-slate-300 backdrop-blur-md shadow-lg text-xs font-medium w-fit">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>
            <strong className="text-white font-bold">{hotspots.length}</strong> Verified Hotspots Plotted
          </span>
        </div>
      </div>

      {/* ─── Floating Top-Right Actions ─── */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Live AQI Badge */}
        {liveAqi && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xl backdrop-blur-md border border-white/10"
            style={{
              backgroundColor: `${liveAqi.aqiColor}25`,
              color: liveAqi.aqiColor,
              borderColor: `${liveAqi.aqiColor}50`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: liveAqi.aqiColor }}
            />
            <span>Live US AQI: {liveAqi.usAqi} ({liveAqi.aqiStatus})</span>
          </div>
        )}

        {/* Re-Center Button (Matching Screenshot) */}
        <button
          onClick={handleRecenter}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-900 border border-slate-700/80 text-emerald-400 hover:text-emerald-300 backdrop-blur-md shadow-xl text-xs font-bold tracking-wider uppercase transition-all"
          title="Re-Center Map to City Core"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RE-CENTER</span>
        </button>

        {/* Catchment Ring Toggle */}
        <button
          onClick={() => setShowRadius((v) => !v)}
          className={`p-2 rounded-xl backdrop-blur-md shadow-xl border text-xs transition-all ${
            showRadius
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900/85 border-slate-700/80 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Catchment Radius Overlay"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* ─── Bottom-Left Controls: Style Switcher & Coordinates HUD ─── */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-3">
        {/* Tile Layer Switcher: [G-MAP | SAT | DARK] (Matching Screenshot) */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-2xl text-[11px] font-bold">
          {Object.entries(TILE_LAYERS).map(([key, config]) => {
            const isActive = activeLayer === key;
            return (
              <button
                key={key}
                onClick={() => setActiveLayer(key)}
                className={`px-3 py-1 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {config.name}
              </button>
            );
          })}
        </div>

        {/* Coordinates Readout HUD (Matching Screenshot) */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 text-emerald-400 backdrop-blur-md shadow-xl text-[11px] font-mono font-semibold">
          <span className="text-slate-400">LAT:</span>
          <span>{currentCoords.lat.toFixed(4)}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">LON:</span>
          <span>{currentCoords.lon.toFixed(4)}</span>
        </div>

        {/* Radius Scale indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 font-mono">
          <div className="w-8 h-1 bg-emerald-400/80 rounded-full" />
          <span>Scale ~{radiusKm}km</span>
        </div>
      </div>

      {/* ─── Bottom-Right Zoom Controls (Matching Screenshot) ─── */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white backdrop-blur-md shadow-xl transition-all"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white backdrop-blur-md shadow-xl transition-all"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
