import React, { useState } from 'react';
import {
  Camera,
  Search,
  Upload,
  Terminal,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Sparkles,
  Play,
  RotateCw,
  Info,
} from 'lucide-react';
import { AnalysisResult, ExifMetadata, OverpassElement } from '../types/osint';
import { exportToGeoJSON, exportToKML, exportToMarkdown } from '../utils/geoMath';

interface IntelSidebarProps {
  imageSrc: string | null;
  onImageSelected: (file: File) => void;
  onSelectPresetUrl: (url: string) => void;
  exifData: ExifMetadata | null;
  blindMode: boolean;
  onToggleBlindMode: () => void;
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  headingOffset: number;
  onExecuteOverpass: (ql: string) => Promise<void>;
  isOverpassRunning: boolean;
  overpassElements: OverpassElement[];
}

export const IntelSidebar: React.FC<IntelSidebarProps> = ({
  imageSrc,
  onImageSelected,
  onSelectPresetUrl,
  exifData,
  blindMode,
  onToggleBlindMode,
  analysis,
  isAnalyzing,
  onRunAnalysis,
  headingOffset,
  onExecuteOverpass,
  isOverpassRunning,
  overpassElements,
}) => {
  const [contextHint, setContextHint] = useState('');
  const [copiedMd, setCopiedMd] = useState(false);
  const [showOverpassDetails, setShowOverpassDetails] = useState(true);
  const [showExifDetails, setShowExifDetails] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0]);
    }
  };

  const handleCopyMarkdown = () => {
    if (!analysis) return;
    const md = exportToMarkdown(analysis, headingOffset);
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadGeoJson = () => {
    if (!analysis) return;
    const jsonStr = exportToGeoJSON(analysis, headingOffset);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GeoLens_${analysis.location_name.replace(/[^a-zA-Z0-9]/g, '_')}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadKml = () => {
    if (!analysis) return;
    const kmlStr = exportToKML(analysis, headingOffset);
    const blob = new Blob([kmlStr], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GeoLens_${analysis.location_name.replace(/[^a-zA-Z0-9]/g, '_')}.kml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="w-full md:w-[410px] lg:w-[440px] h-full bg-[#080d17] border-r border-slate-800 flex flex-col select-none text-slate-300 font-sans z-20 overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="h-10 bg-slate-950 px-4 border-b border-slate-800 flex items-center justify-between font-mono text-[11px]">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider">
          <Cpu className="w-3.5 h-3.5" />
          <span>VISUAL INTEL INGESTION</span>
        </div>
        <span className="text-[9px] text-slate-500">STAGE 1-3 PIPELINE</span>
      </div>

      {/* Scrollable Intel Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* Ingest Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg transition overflow-hidden group ${
            imageSrc
              ? 'border-cyan-500/40 bg-slate-950/80'
              : 'border-slate-700/80 hover:border-cyan-500/60 bg-slate-950/40'
          }`}
        >
          {isAnalyzing && (
            <div className="absolute inset-0 z-30 pointer-events-none bg-cyan-950/20 backdrop-blur-[1px]">
              <div className="scanning-line" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-slate-950/90 border border-cyan-500/60 text-cyan-300 font-mono text-xs px-3 py-1.5 rounded shadow-xl flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>DECOMPOSING OSINT MORPHOLOGY...</span>
                </div>
              </div>
            </div>
          )}

          {imageSrc ? (
            <div className="relative">
              <img
                src={imageSrc}
                alt="Source Intelligence"
                className="w-full h-44 object-cover filter contrast-[1.05]"
              />

              <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                <label className="cursor-pointer bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-slate-700 p-1.5 rounded text-[10px] font-mono flex items-center gap-1 shadow-lg">
                  <Upload className="w-3 h-3" />
                  <span>Replace</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              <div className="absolute bottom-2 left-2 bg-slate-950/90 border border-slate-800 px-2 py-0.5 rounded text-[9px] font-mono text-slate-300">
                SOURCE INGESTED // 100% READY
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-6 cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 mb-2 group-hover:text-cyan-400 group-hover:border-cyan-500/50 transition">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
                Ingest Photograph
              </span>
              <p className="text-[11px] text-slate-500 text-center mt-1">
                Drag & drop any JPEG/PNG or click to browse.
              </p>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          )}
        </div>

        {/* EXIF Triage Telemetry */}
        <div className="bg-slate-950/70 border border-slate-800 rounded p-3 text-[11px] font-mono">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              EXIF HARDWARE TRIAGE
            </span>
            <button
              onClick={() => setShowExifDetails(!showExifDetails)}
              className="text-slate-500 hover:text-slate-300 flex items-center text-[10px]"
            >
              {showExifDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span className="text-slate-500 block text-[9px]">HARDWARE GPS</span>
              {blindMode ? (
                <span className="text-amber-400 font-bold">BLIND (STRIPPED)</span>
              ) : exifData?.hasGps ? (
                <span className="text-emerald-400 font-bold">LOCKED IN EXIF</span>
              ) : (
                <span className="text-slate-400">NOT PRESENT</span>
              )}
            </div>

            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span className="text-slate-500 block text-[9px]">35mm EQUIV FOV</span>
              <span className="text-cyan-300 font-bold">
                {exifData?.focalLengthIn35mmMm ? `${exifData.focalLengthIn35mmMm}mm (~65°)` : 'CALCULATED'}
              </span>
            </div>
          </div>

          {showExifDetails && exifData && (
            <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] space-y-1 text-slate-400">
              <div>Camera: <span className="text-slate-200">{exifData.make || 'Generic'} {exifData.model || ''}</span></div>
              {exifData.lens && <div>Lens: <span className="text-slate-200">{exifData.lens}</span></div>}
              {exifData.dateTime && <div>Timestamp: <span className="text-slate-200">{exifData.dateTime}</span></div>}
              {exifData.exposureTime && <div>Exposure: <span className="text-slate-200">{exifData.exposureTime}s @ f/{exifData.fNumber || '2.8'}</span></div>}
            </div>
          )}
        </div>

        {/* Execution Trigger Button */}
        <div className="space-y-2">
          <button
            onClick={onRunAnalysis}
            disabled={!imageSrc || isAnalyzing}
            className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 font-mono font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>TRIANGULATING SIGHTLINE...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-slate-950" />
                <span>EXECUTE NEURAL DEDUCTION</span>
              </>
            )}
          </button>
        </div>

        {/* Neural Analysis Breakdown */}
        {analysis && (
          <div className="space-y-3 font-mono animate-in fade-in duration-300">
            {/* Target Card */}
            <div className="bg-cyan-950/30 border border-cyan-500/40 p-3 rounded-lg shadow-lg">
              <div className="text-[10px] text-cyan-400 uppercase font-bold flex items-center justify-between mb-1">
                <span>TARGET LOCATION LOCK</span>
                <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  {analysis.confidence_score}% CONFIDENCE
                </span>
              </div>
              <h3 className="text-sm font-sans font-bold text-slate-100 leading-snug">
                {analysis.location_name}
              </h3>
              <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                <span>UNCERTAINTY: ±{analysis.uncertainty_radius_meters}m</span>
                <span>HEADING: {((analysis.camera_heading + headingOffset) % 360).toFixed(0)}°</span>
                <span>PITCH: {analysis.camera_pitch}°</span>
              </div>
            </div>

            {/* OCR & Script Signage */}
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] text-cyan-400 uppercase font-bold mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>DETECTED SCRIPT &amp; SIGNAGE</span>
              </div>
              {analysis.detected_text && analysis.detected_text.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {analysis.detected_text.map((txt, i) => (
                    <span
                      key={i}
                      className="bg-slate-900 border border-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px]"
                    >
                      {txt}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-slate-500 italic">No direct script detected.</span>
              )}
            </div>

            {/* Visual Clue Cards */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                MORPHOLOGICAL CLUE DECOMPOSITION
              </div>

              {analysis.clues.map((clue, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border-l-2 border-cyan-500/80 border-y border-r border-slate-800/80 p-2.5 rounded-r"
                >
                  <div className="text-[9px] text-cyan-400 uppercase font-bold mb-1">
                    {clue.category}
                  </div>
                  <p className="text-[11px] font-sans text-slate-300 leading-relaxed">
                    {clue.observation}
                  </p>
                </div>
              ))}
            </div>

            {/* Step-by-Step Reasoning Stages */}
            {analysis.reasoning_stages && analysis.reasoning_stages.length > 0 && (
              <div className="bg-slate-950/80 border border-slate-800 rounded p-3 space-y-2">
                <div className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>NEURAL REASONING TRACE</span>
                </div>
                {analysis.reasoning_stages.map((stg, i) => (
                  <div key={i} className="text-[10px] text-slate-300 border-l border-slate-700 pl-2">
                    <span className="text-slate-400 font-bold block">{stg.stage}</span>
                    <span className="text-[10px] font-sans text-slate-400">{stg.summary}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Overpass QL Generator & Dynamic Execution */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <div className="text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>OVERPASS QL SPATIAL QUERY</span>
                </div>
                <button
                  onClick={() => setShowOverpassDetails(!showOverpassDetails)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  {showOverpassDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {showOverpassDetails && (
                <>
                  <pre className="bg-[#05080f] p-2 rounded border border-slate-800 text-[10px] text-emerald-400 overflow-x-auto whitespace-pre-wrap font-mono">
                    {analysis.overpass_ql}
                  </pre>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => onExecuteOverpass(analysis.overpass_ql)}
                      disabled={isOverpassRunning}
                      className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 text-[10px] rounded font-bold uppercase transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isOverpassRunning ? (
                        <>
                          <RotateCw className="w-3 h-3 animate-spin text-emerald-400" />
                          <span>QUERYING OSM MIRROR...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-emerald-400" />
                          <span>EXECUTE QUERY ON OVERPASS</span>
                        </>
                      )}
                    </button>

                    {overpassElements.length > 0 && (
                      <span className="text-[10px] text-emerald-400 font-bold">
                        {overpassElements.length} NODES PLOTTED
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Export Actions */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                EXPORT INTELLIGENCE DOSSIER
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <button
                  onClick={handleDownloadGeoJson}
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-200 font-bold flex flex-col items-center gap-1 transition cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>GeoJSON</span>
                </button>
                <button
                  onClick={handleDownloadKml}
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-200 font-bold flex flex-col items-center gap-1 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>KML</span>
                </button>
                <button
                  onClick={handleCopyMarkdown}
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-200 font-bold flex flex-col items-center gap-1 transition cursor-pointer"
                >
                  {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                  <span>{copiedMd ? 'Copied!' : 'Copy MD'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
