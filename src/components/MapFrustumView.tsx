import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Compass,
  RotateCcw,
  Layers,
  ZoomIn,
  ZoomOut,
  Target,
  Maximize2,
  Navigation,
  MapPin,
} from 'lucide-react';
import { AnalysisResult, OverpassElement } from '../types/osint';
import {
  calculateFrustumPoints,
  calculateSightlineVector,
  calculateUncertaintyCircle,
  toDMS,
} from '../utils/geoMath';

interface MapFrustumViewProps {
  analysis: AnalysisResult | null;
  headingOffset: number;
  onHeadingOffsetChange: (offset: number) => void;
  overpassElements?: OverpassElement[];
  onSelectOsmElement?: (elem: OverpassElement) => void;
}

export const MapFrustumView: React.FC<MapFrustumViewProps> = ({
  analysis,
  headingOffset,
  onHeadingOffsetChange,
  overpassElements = [],
  onSelectOsmElement,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups
  const baseLayersRef = useRef<{ [key: string]: L.TileLayer }>({});
  const frustumLayerRef = useRef<L.Polygon | null>(null);
  const sightlineLayerRef = useRef<L.Polyline | null>(null);
  const uncertaintyLayerRef = useRef<L.Polygon | null>(null);
  const observerMarkerRef = useRef<L.Marker | null>(null);
  const osmMarkersGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeBaseLayer, setActiveBaseLayer] = useState<'esri' | 'osm' | 'carto'>('esri');
  const [frustumDistanceMeters, setFrustumDistanceMeters] = useState<number>(350);
  const [showUncertainty, setShowUncertainty] = useState<boolean>(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = analysis?.coordinates.lat ?? 35.65952;
    const initialLng = analysis?.coordinates.lng ?? 139.70055;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
    });

    // Tile Layers
    const esriLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 }
    );

    const cartoDarkLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 19 }
    );

    const osmLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: 19 }
    );

    esriLayer.addTo(map);

    baseLayersRef.current = {
      esri: esriLayer,
      carto: cartoDarkLayer,
      osm: osmLayer,
    };

    osmMarkersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Base Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(baseLayersRef.current).forEach((layer) => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    });

    const targetLayer = baseLayersRef.current[activeBaseLayer];
    if (targetLayer) {
      targetLayer.addTo(map);
    }
  }, [activeBaseLayer]);

  // Update Geometry & Frustum whenever analysis, heading, or distance changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !analysis) return;

    const { lat, lng } = analysis.coordinates;
    const effectiveHeading = (analysis.camera_heading + headingOffset) % 360;

    // 1. Frustum Polygon
    if (frustumLayerRef.current) {
      map.removeLayer(frustumLayerRef.current);
    }

    const frustumPoints = calculateFrustumPoints(
      lat,
      lng,
      effectiveHeading,
      analysis.camera_fov,
      frustumDistanceMeters
    );

    frustumLayerRef.current = L.polygon(frustumPoints, {
      color: '#22d3ee',
      weight: 1.5,
      opacity: 0.9,
      fillColor: '#06b6d4',
      fillOpacity: 0.18,
      dashArray: '4, 4',
    }).addTo(map);

    // 2. Sightline Center Vector
    if (sightlineLayerRef.current) {
      map.removeLayer(sightlineLayerRef.current);
    }

    const sightlineCoords = calculateSightlineVector(lat, lng, effectiveHeading, frustumDistanceMeters + 50);
    sightlineLayerRef.current = L.polyline(sightlineCoords, {
      color: '#38bdf8',
      weight: 2,
      opacity: 0.8,
      dashArray: '2, 6',
    }).addTo(map);

    // 3. Uncertainty Ellipse
    if (uncertaintyLayerRef.current) {
      map.removeLayer(uncertaintyLayerRef.current);
    }

    if (showUncertainty) {
      const uncertaintyPoints = calculateUncertaintyCircle(lat, lng, analysis.uncertainty_radius_meters);
      uncertaintyLayerRef.current = L.polygon(uncertaintyPoints, {
        color: '#fbbf24',
        weight: 1.5,
        opacity: 0.85,
        fillColor: '#f59e0b',
        fillOpacity: 0.12,
        dashArray: '5, 5',
      }).addTo(map);
    }

    // 4. Tactical Observer Marker with Compass Reticle
    if (observerMarkerRef.current) {
      map.removeLayer(observerMarkerRef.current);
    }

    const reticleSvg = `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <!-- Pulsing radar ring -->
        <div style="position: absolute; width: 36px; height: 36px; border: 1.5px solid #22d3ee; border-radius: 50%; opacity: 0.7; box-shadow: 0 0 10px #22d3ee;"></div>
        <!-- Directional Sightline Arrow -->
        <div style="position: absolute; width: 44px; height: 44px; transform: rotate(${effectiveHeading}deg); display: flex; justify-content: center; align-items: flex-start;">
          <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 12px solid #22d3ee; filter: drop-shadow(0 0 4px #22d3ee);"></div>
        </div>
        <!-- Core Center Point -->
        <div style="width: 10px; height: 10px; background: #06b6d4; border: 2px solid #ffffff; border-radius: 50%; z-index: 10;"></div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: reticleSvg,
      className: 'tactical-observer-icon',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    observerMarkerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    observerMarkerRef.current.bindPopup(`
      <div style="font-family: monospace; font-size: 11px; color: #0f172a; padding: 2px;">
        <strong style="color: #0284c7;">OBSERVER POSITION</strong><br/>
        LAT: ${lat.toFixed(6)}°<br/>
        LNG: ${lng.toFixed(6)}°<br/>
        HEADING: ${effectiveHeading}°<br/>
        FOV: ${analysis.camera_fov}°<br/>
        CONFIDENCE: ${analysis.confidence_score}%
      </div>
    `);

    // Center map smoothly
    map.flyTo([lat, lng], 17, { duration: 1.2 });
  }, [analysis, headingOffset, frustumDistanceMeters, showUncertainty]);

  // Render Overpass Elements
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = osmMarkersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (overpassElements.length === 0) return;

    overpassElements.forEach((elem) => {
      const elemLat = elem.lat || elem.center?.lat;
      const elemLon = elem.lon || elem.center?.lon;
      if (!elemLat || !elemLon) return;

      const name = elem.tags?.name || elem.tags?.['name:en'] || elem.tags?.historic || elem.tags?.amenity || 'OSM Node';
      const category = elem.tags?.historic ? 'Historic' : elem.tags?.railway ? 'Transit' : elem.tags?.tourism ? 'Attraction' : 'Landmark';

      const osmIconHtml = `
        <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid #10b981; color: #34d399; font-family: monospace; font-size: 9px; padding: 2px 5px; border-radius: 4px; white-space: nowrap; box-shadow: 0 0 6px rgba(16,185,129,0.4); display: flex; align-items: center; gap: 4px;">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
          ${name.slice(0, 20)}
        </div>
      `;

      const marker = L.marker([elemLat, elemLon], {
        icon: L.divIcon({
          html: osmIconHtml,
          className: 'osm-element-marker',
          iconSize: [100, 20],
          iconAnchor: [50, 10],
        }),
      });

      marker.bindPopup(`
        <div style="font-family: monospace; font-size: 11px; color: #0f172a;">
          <strong style="color: #059669;">[OSM CONFIRMATION] ${name}</strong><br/>
          Category: ${category}<br/>
          ID: ${elem.type}/${elem.id}<br/>
          Coords: ${elemLat.toFixed(5)}, ${elemLon.toFixed(5)}
        </div>
      `);

      marker.on('click', () => {
        if (onSelectOsmElement) onSelectOsmElement(elem);
      });

      group.addLayer(marker);
    });
  }, [overpassElements, onSelectOsmElement]);

  // Recenter map
  const handleRecenter = () => {
    if (!mapInstanceRef.current || !analysis) return;
    mapInstanceRef.current.flyTo([analysis.coordinates.lat, analysis.coordinates.lng], 18, {
      duration: 0.8,
    });
  };

  const effectiveHeading = analysis ? (analysis.camera_heading + headingOffset) % 360 : 0;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#070b12] overflow-hidden select-none">
      {/* Map Surface */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* Top Left: Map Telemetry HUD */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none flex flex-col gap-1.5 font-mono text-[10px]">
        <div className="bg-slate-950/90 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded shadow-xl flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Navigation className="w-3.5 h-3.5" style={{ transform: `rotate(${effectiveHeading}deg)` }} />
            <span>SIGHTLINE_FRUSTUM_VECTOR</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">
            AZIMUTH: <strong className="text-cyan-300">{effectiveHeading.toFixed(1)}°</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">
            FOV: <strong className="text-cyan-300">{analysis?.camera_fov || 65}°</strong>
          </span>
        </div>

        {analysis && (
          <div className="bg-slate-950/85 border border-slate-800 px-3 py-1 rounded shadow-md text-slate-400">
            <span>DMS: </span>
            <span className="text-slate-200">{toDMS(analysis.coordinates.lat, analysis.coordinates.lng)}</span>
          </div>
        )}
      </div>

      {/* Top Right: Layer Switcher & Map Tools */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <div className="bg-slate-950/90 border border-slate-800 rounded p-1 shadow-2xl flex flex-col gap-1">
          <button
            onClick={() => setActiveBaseLayer('esri')}
            title="Esri Satellite Imagery"
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition flex items-center gap-1.5 ${
              activeBaseLayer === 'esri'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" /> Satellite
          </button>
          <button
            onClick={() => setActiveBaseLayer('carto')}
            title="Dark Carto Vector"
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition flex items-center gap-1.5 ${
              activeBaseLayer === 'carto'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" /> Dark Vector
          </button>
          <button
            onClick={() => setActiveBaseLayer('osm')}
            title="OpenStreetMap Street Layer"
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition flex items-center gap-1.5 ${
              activeBaseLayer === 'osm'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3 h-3" /> OSM Streets
          </button>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 rounded p-1 shadow-xl flex flex-col gap-1">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            title="Zoom In"
            className="p-1.5 text-slate-300 hover:text-cyan-400 rounded hover:bg-slate-800 transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            title="Zoom Out"
            className="p-1.5 text-slate-300 hover:text-cyan-400 rounded hover:bg-slate-800 transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleRecenter}
            title="Recenter on Observer"
            className="p-1.5 text-slate-300 hover:text-cyan-400 rounded hover:bg-slate-800 transition"
          >
            <Target className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowUncertainty(!showUncertainty)}
            title="Toggle Uncertainty Radius"
            className={`p-1.5 rounded transition ${
              showUncertainty ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Center: Interactive Azimuth Fine-Tuning Slider */}
      {analysis && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-[92%] max-w-xl bg-slate-950/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
              <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
                AZIMUTH SIGHTLINE ALIGNMENT
              </span>
              <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800">
                {effectiveHeading.toFixed(1)}°
              </span>
            </div>

            <div className="flex items-center gap-1 font-mono text-[10px]">
              <span className="text-slate-400">OFFSET:</span>
              <span
                className={`font-bold ${
                  headingOffset === 0
                    ? 'text-slate-400'
                    : headingOffset > 0
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {headingOffset > 0 ? `+${headingOffset}` : headingOffset}°
              </span>
              <button
                onClick={() => onHeadingOffsetChange(0)}
                title="Reset Offset to 0°"
                className="ml-1 text-slate-400 hover:text-cyan-300 p-0.5"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Slider input */}
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-mono text-slate-500">-30°</span>
            <input
              type="range"
              min="-30"
              max="30"
              step="1"
              value={headingOffset}
              onChange={(e) => onHeadingOffsetChange(parseInt(e.target.value))}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition"
            />
            <span className="text-[9px] font-mono text-slate-500">+30°</span>
          </div>

          {/* Quick step buttons & Frustum range slider */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
            <div className="flex items-center gap-1 text-slate-400">
              <span>FINE-TUNE:</span>
              <button
                onClick={() => onHeadingOffsetChange(Math.max(headingOffset - 5, -30))}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
              >
                -5°
              </button>
              <button
                onClick={() => onHeadingOffsetChange(Math.max(headingOffset - 1, -30))}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
              >
                -1°
              </button>
              <button
                onClick={() => onHeadingOffsetChange(Math.min(headingOffset + 1, 30))}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
              >
                +1°
              </button>
              <button
                onClick={() => onHeadingOffsetChange(Math.min(headingOffset + 5, 30))}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
              >
                +5°
              </button>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span>RANGE:</span>
              <select
                value={frustumDistanceMeters}
                onChange={(e) => setFrustumDistanceMeters(Number(e.target.value))}
                className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-1.5 py-0.5 cursor-pointer text-[10px]"
              >
                <option value={150}>150m (Close)</option>
                <option value={350}>350m (Standard)</option>
                <option value={600}>600m (Extended)</option>
                <option value={1000}>1000m (Long Range)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
