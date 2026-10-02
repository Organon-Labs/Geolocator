import React, { useState } from 'react';
import {
  Columns,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Map as MapIcon,
  Globe,
  Grid,
} from 'lucide-react';
import { MapFrustumView } from './MapFrustumView';
import { GroundTruthStreetView } from './GroundTruthStreetView';
import { AnalysisResult, OverpassElement } from '../types/osint';

export type ViewLayoutMode = 'split_sat_street' | 'split_photo_street' | 'map_only' | 'tri_view';

interface SplitViewComparatorProps {
  imageSrc: string | null;
  analysis: AnalysisResult | null;
  headingOffset: number;
  onHeadingOffsetChange: (offset: number) => void;
  pitchOffset: number;
  onPitchOffsetChange: (pitch: number) => void;
  overpassElements: OverpassElement[];
  onSelectOsmElement?: (elem: OverpassElement) => void;
}

export const SplitViewComparator: React.FC<SplitViewComparatorProps> = ({
  imageSrc,
  analysis,
  headingOffset,
  onHeadingOffsetChange,
  pitchOffset,
  onPitchOffsetChange,
  overpassElements,
  onSelectOsmElement,
}) => {
  const [layoutMode, setLayoutMode] = useState<ViewLayoutMode>('split_sat_street');

  return (
    <div className="flex-1 h-full flex flex-col bg-[#070b12] overflow-hidden select-none">
      {/* Tactical Sub-Navbar / Layout Selector */}
      <div className="h-10 bg-slate-950/90 border-b border-slate-800 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="text-slate-500 uppercase font-bold mr-2">VERIFICATION LAYOUT:</span>

          <button
            onClick={() => setLayoutMode('split_sat_street')}
            className={`px-2.5 py-1 rounded font-bold uppercase transition flex items-center gap-1.5 ${
              layoutMode === 'split_sat_street'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(34,211,238,0.25)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Columns className="w-3 h-3" />
            <span>Satellite + Street View</span>
          </button>

          <button
            onClick={() => setLayoutMode('split_photo_street')}
            className={`px-2.5 py-1 rounded font-bold uppercase transition flex items-center gap-1.5 ${
              layoutMode === 'split_photo_street'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(34,211,238,0.25)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>Photo + Street View</span>
          </button>

          <button
            onClick={() => setLayoutMode('tri_view')}
            className={`px-2.5 py-1 rounded font-bold uppercase transition flex items-center gap-1.5 ${
              layoutMode === 'tri_view'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(34,211,238,0.25)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Grid className="w-3 h-3" />
            <span>Tri-View Alignment</span>
          </button>

          <button
            onClick={() => setLayoutMode('map_only')}
            className={`px-2.5 py-1 rounded font-bold uppercase transition flex items-center gap-1.5 ${
              layoutMode === 'map_only'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(34,211,238,0.25)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <MapIcon className="w-3 h-3" />
            <span>Satellite Frustum Only</span>
          </button>
        </div>

        {/* Status indicator */}
        <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] text-slate-400">
          <div>
            COORDINATE_LOCK: <span className="text-emerald-400 font-bold">{analysis ? 'ACQUIRED' : 'STANDBY'}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Main Workspace depending on layout mode */}
      <div className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        {/* Layout 1: Split Satellite Frustum + Street View 360 */}
        {layoutMode === 'split_sat_street' && (
          <>
            <div className="flex-1 h-1/2 md:h-full relative border-b md:border-b-0 md:border-r border-slate-800">
              <MapFrustumView
                analysis={analysis}
                headingOffset={headingOffset}
                onHeadingOffsetChange={onHeadingOffsetChange}
                overpassElements={overpassElements}
                onSelectOsmElement={onSelectOsmElement}
              />
            </div>
            <div className="w-full md:w-[48%] lg:w-[45%] h-1/2 md:h-full relative">
              <GroundTruthStreetView
                analysis={analysis}
                headingOffset={headingOffset}
                onHeadingOffsetChange={onHeadingOffsetChange}
                pitchOffset={pitchOffset}
                onPitchOffsetChange={onPitchOffsetChange}
              />
            </div>
          </>
        )}

        {/* Layout 2: Split Photo + Street View 360 */}
        {layoutMode === 'split_photo_street' && (
          <>
            <div className="flex-1 h-1/2 md:h-full relative border-b md:border-b-0 md:border-r border-slate-800 bg-[#04070e] flex flex-col">
              <div className="h-8 bg-slate-950 px-3 flex items-center justify-between text-[10px] font-mono border-b border-slate-800 text-slate-400">
                <span className="text-cyan-400 font-bold uppercase">INGESTED SOURCE PHOTO</span>
                <span>SPECTRAL REFERENCE</span>
              </div>
              <div className="flex-1 p-3 flex items-center justify-center overflow-hidden">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Source Imagery"
                    className="max-h-full max-w-full object-contain rounded shadow-2xl filter contrast-[1.05]"
                  />
                ) : (
                  <div className="text-slate-600 font-mono text-xs">No image ingested</div>
                )}
              </div>
            </div>
            <div className="flex-1 h-1/2 md:h-full relative">
              <GroundTruthStreetView
                analysis={analysis}
                headingOffset={headingOffset}
                onHeadingOffsetChange={onHeadingOffsetChange}
                pitchOffset={pitchOffset}
                onPitchOffsetChange={onPitchOffsetChange}
              />
            </div>
          </>
        )}

        {/* Layout 3: Tri-View (Photo Top/Left, Satellite Center, Street View Right) */}
        {layoutMode === 'tri_view' && (
          <div className="w-full h-full grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            {/* 1. Source Photo */}
            <div className="h-full flex flex-col bg-[#050811]">
              <div className="h-7 bg-slate-950 px-3 flex items-center text-[10px] font-mono text-cyan-400 font-bold border-b border-slate-800">
                1. SOURCE INGEST
              </div>
              <div className="flex-1 p-2 flex items-center justify-center overflow-hidden">
                {imageSrc ? (
                  <img src={imageSrc} alt="Source" className="max-h-full max-w-full object-contain rounded" />
                ) : (
                  <span className="text-slate-600 font-mono text-xs">Awaiting Source</span>
                )}
              </div>
            </div>

            {/* 2. Satellite Frustum */}
            <div className="h-full relative flex flex-col">
              <div className="h-7 bg-slate-950 px-3 flex items-center text-[10px] font-mono text-cyan-400 font-bold border-b border-slate-800 z-10">
                2. SATELLITE SIGHTLINE FRUSTUM
              </div>
              <div className="flex-1 relative">
                <MapFrustumView
                  analysis={analysis}
                  headingOffset={headingOffset}
                  onHeadingOffsetChange={onHeadingOffsetChange}
                  overpassElements={overpassElements}
                  onSelectOsmElement={onSelectOsmElement}
                />
              </div>
            </div>

            {/* 3. Street View 360 Ground Truth */}
            <div className="h-full relative flex flex-col">
              <div className="h-7 bg-slate-950 px-3 flex items-center text-[10px] font-mono text-cyan-400 font-bold border-b border-slate-800 z-10">
                3. GROUND TRUTH 360°
              </div>
              <div className="flex-1 relative">
                <GroundTruthStreetView
                  analysis={analysis}
                  headingOffset={headingOffset}
                  onHeadingOffsetChange={onHeadingOffsetChange}
                  pitchOffset={pitchOffset}
                  onPitchOffsetChange={onPitchOffsetChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* Layout 4: Satellite Frustum Only */}
        {layoutMode === 'map_only' && (
          <div className="w-full h-full relative">
            <MapFrustumView
              analysis={analysis}
              headingOffset={headingOffset}
              onHeadingOffsetChange={onHeadingOffsetChange}
              overpassElements={overpassElements}
              onSelectOsmElement={onSelectOsmElement}
            />
          </div>
        )}
      </div>
    </div>
  );
};
