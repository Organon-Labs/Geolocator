import React, { useState, useEffect } from 'react';
import { Shield, EyeOff, Eye, Crosshair, Sparkles } from 'lucide-react';
import { Coordinates } from '../types/osint';
import { toMGRS } from '../utils/geoMath';

interface TacticalHeaderProps {
  coordinates?: Coordinates;
  confidenceScore?: number;
  blindMode: boolean;
  onToggleBlindMode: () => void;
  selectedPresetId: string;
  onSelectPreset: (id: string) => void;
  presets: Array<{ id: string; title: string; region: string }>;
  isAnalyzing: boolean;
}

export const TacticalHeader: React.FC<TacticalHeaderProps> = ({
  coordinates,
  confidenceScore,
  blindMode,
  onToggleBlindMode,
  selectedPresetId,
  onSelectPreset,
  presets,
  isAnalyzing,
}) => {
  const [utcTime, setUtcTime] = useState('');
  const [localTime, setLocalTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
      setLocalTime(now.toTimeString().slice(0, 8) + ' LCL');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const mgrs = coordinates ? toMGRS(coordinates.lat, coordinates.lng) : '--- -- ---- ----';

  return (
    <header className="h-14 border-b border-slate-800 bg-[#060a11] px-4 flex items-center justify-between select-none z-30 relative shadow-lg">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <div className="w-8 h-8 rounded bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.25)]">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-wider text-slate-100 uppercase font-mono">
              GEOLENS <span className="text-cyan-400">3D</span>
            </h1>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              v2.5_STRATCOM
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
            <span>NEURAL VISION CHAIN</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">GEMINI_MULTIMODAL_ONLINE</span>
          </div>
        </div>
      </div>

      {/* Center: Presets Dossier Selector */}
      <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded px-2.5 py-1">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Dossier Presets:</span>
        <select
          value={selectedPresetId}
          onChange={(e) => onSelectPreset(e.target.value)}
          className="bg-slate-950 text-cyan-300 text-xs font-mono rounded px-2 py-0.5 border border-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer"
        >
          <option value="custom">-- Custom Imagery Ingested --</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.region})
            </option>
          ))}
        </select>
      </div>

      {/* Right Telemetry Controls */}
      <div className="flex items-center gap-4 text-xs font-mono">
        {/* Blind Mode Toggle */}
        <button
          onClick={onToggleBlindMode}
          title={
            blindMode
              ? 'Blind Geolocation Active: EXIF hardware coordinates stripped'
              : 'Standard Geolocation: EXIF metadata enabled if present'
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-bold transition border ${
            blindMode
              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          {blindMode ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
          <span>BLIND_MODE: {blindMode ? 'ACTIVE' : 'OFF'}</span>
        </button>

        {/* Realtime MGRS & Coordinates Readout */}
        <div className="hidden md:flex flex-col text-right font-mono text-[10px]">
          <div className="text-slate-300 flex items-center gap-1.5 justify-end">
            <Crosshair className="w-3 h-3 text-cyan-400" />
            <span className="text-cyan-400 font-bold">{mgrs}</span>
          </div>
          <div className="text-slate-500 text-[9px]">
            {coordinates
              ? `${coordinates.lat.toFixed(5)}°, ${coordinates.lng.toFixed(5)}° [±${confidenceScore || 0}%]`
              : 'SEARCHING_SIGHTLINE'}
          </div>
        </div>

        {/* Clocks */}
        <div className="hidden sm:flex flex-col text-right border-l border-slate-800 pl-3 text-[10px] text-slate-400 font-mono">
          <span className="text-slate-200 font-bold">{utcTime}</span>
          <span className="text-slate-500">{localTime}</span>
        </div>

        {/* Processing Indicator */}
        {isAnalyzing && (
          <div className="flex items-center gap-2 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 px-2.5 py-1 rounded text-[10px] animate-pulse">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>NEURAL_TRIANGULATING...</span>
          </div>
        )}
      </div>
    </header>
  );
};
