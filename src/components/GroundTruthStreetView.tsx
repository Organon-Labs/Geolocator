import React, { useState } from 'react';
import {
  Globe,
  ExternalLink,
  Compass,
  Maximize2,
  RefreshCw,
  Eye,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { AnalysisResult } from '../types/osint';

interface GroundTruthStreetViewProps {
  analysis: AnalysisResult | null;
  headingOffset: number;
  onHeadingOffsetChange: (offset: number) => void;
  pitchOffset: number;
  onPitchOffsetChange: (pitch: number) => void;
}

export const GroundTruthStreetView: React.FC<GroundTruthStreetViewProps> = ({
  analysis,
  headingOffset,
  onHeadingOffsetChange,
  pitchOffset,
  onPitchOffsetChange,
}) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [useInteractiveView, setUseInteractiveView] = useState(false);

  if (!analysis) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#070b12] text-slate-600 font-mono text-xs p-6 text-center">
        <Globe className="w-10 h-10 mb-3 text-slate-700 animate-pulse" />
        <span className="uppercase tracking-widest text-slate-400 font-bold">STREET VIEW GROUND TRUTH</span>
        <p className="text-[11px] text-slate-600 max-w-xs mt-1">
          Awaiting spatial coordinate lock. Execute neural deduction or select an intelligence dossier preset.
        </p>
      </div>
    );
  }

  const { lat, lng } = analysis.coordinates;
  const effectiveHeading = (analysis.camera_heading + headingOffset + 360) % 360;
  const effectivePitch = Math.max(Math.min(analysis.camera_pitch + pitchOffset, 85), -85);

  // Google Maps Street View Embed URL (Standard embed compatible without requiring client key setup)
  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&layer=c&cbll=${lat},${lng}&cbp=11,${effectiveHeading.toFixed(
    1
  )},0,0,${effectivePitch.toFixed(1)}&output=svembed`;

  // External full Google Street View link
  const externalGsvUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}&heading=${effectiveHeading.toFixed(
    1
  )}&pitch=${effectivePitch.toFixed(1)}&fov=${analysis.camera_fov}`;

  return (
    <div className="h-full w-full flex flex-col bg-[#070b12] text-slate-300 font-mono select-none overflow-hidden">
      {/* Header Bar */}
      <div className="h-10 bg-slate-950 border-b border-slate-800 px-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">
            GROUND TRUTH // 360° STREET VIEW
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            SYNCED
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <a
            href={externalGsvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 border border-cyan-700/50 px-2 py-0.5 rounded transition"
          >
            <span>Launch Official 360°</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Street View Display */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Iframe View */}
        <iframe
          key={`${lat}-${lng}-${effectiveHeading.toFixed(0)}-${effectivePitch.toFixed(0)}`}
          title="Google Street View Ground Truth"
          src={embedUrl}
          className="w-full h-full border-0 filter contrast-[1.05]"
          allowFullScreen
          loading="lazy"
          onLoad={() => setIframeLoaded(true)}
        />

        {/* Tactical Crosshair Sightline Reticle Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-24 h-24 border border-cyan-500/20 rounded-full flex items-center justify-center">
            {/* Center tick marks */}
            <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
            <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 shadow-[0_0_6px_#22d3ee]"></div>
          </div>
        </div>

        {/* Top-Right HUD Info */}
        <div className="absolute top-2 right-2 pointer-events-none bg-slate-950/85 border border-slate-800 backdrop-blur-md px-2.5 py-1.5 rounded text-[10px] space-y-0.5">
          <div className="flex justify-between gap-4 text-slate-400">
            <span>HDG:</span>
            <span className="text-cyan-300 font-bold">{effectiveHeading.toFixed(1)}°</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-400">
            <span>PITCH:</span>
            <span className="text-cyan-300 font-bold">{effectivePitch.toFixed(1)}°</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-400">
            <span>FOV:</span>
            <span className="text-slate-200">{analysis.camera_fov}°</span>
          </div>
        </div>

        {/* Bottom-Left Compass Card */}
        <div className="absolute bottom-3 left-3 pointer-events-none bg-slate-950/90 border border-slate-800 px-2.5 py-1.5 rounded flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <div className="text-[10px]">
            <span className="text-slate-400">ORIENTATION: </span>
            <span className="text-slate-200 font-bold">
              {getCompassDirection(effectiveHeading)} ({effectiveHeading.toFixed(0)}°)
            </span>
          </div>
        </div>
      </div>

      {/* Ground Truth Alignment Toolbar */}
      <div className="h-12 bg-slate-950/95 border-t border-slate-800 px-4 flex items-center justify-between text-[11px]">
        {/* Azimuth Sync Control */}
        <div className="flex items-center gap-3 flex-1 max-w-sm">
          <span className="text-slate-400 text-[10px]">FINE AZIMUTH:</span>
          <input
            type="range"
            min="-20"
            max="20"
            value={headingOffset}
            onChange={(e) => onHeadingOffsetChange(parseInt(e.target.value))}
            className="flex-1 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="text-cyan-400 text-[10px] w-8 text-right">
            {headingOffset > 0 ? `+${headingOffset}` : headingOffset}°
          </span>
        </div>

        {/* Pitch Control */}
        <div className="flex items-center gap-2 text-[10px] border-l border-slate-800 pl-4">
          <span className="text-slate-400">PITCH:</span>
          <button
            onClick={() => onPitchOffsetChange(Math.max(pitchOffset - 2, -20))}
            className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
          >
            ▼
          </button>
          <span className="text-slate-200 w-6 text-center">{pitchOffset}°</span>
          <button
            onClick={() => onPitchOffsetChange(Math.min(pitchOffset + 2, 20))}
            className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
          >
            ▲
          </button>
        </div>
      </div>
    </div>
  );
};

function getCompassDirection(heading: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((heading % 360) / 22.5)) % 16;
  return directions[index] || 'N';
}
