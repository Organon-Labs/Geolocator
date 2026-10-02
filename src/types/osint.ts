export interface Coordinates {
  lat: number;
  lng: number;
  altitude?: number;
}

export interface ClueItem {
  category: 'Visible Text & Language' | 'Architectural Style' | 'Infrastructure & Transport' | 'Solar & Environmental Geometry' | string;
  observation: string;
}

export interface ReasoningStage {
  stage: string;
  summary: string;
}

export interface AnalysisResult {
  location_name: string;
  coordinates: Coordinates;
  confidence_score: number;
  uncertainty_radius_meters: number;
  camera_heading: number;
  camera_pitch: number;
  camera_fov: number;
  detected_text: string[];
  clues: ClueItem[];
  reasoning_stages?: ReasoningStage[];
  overpass_ql: string;
  osm_elements?: OverpassElement[];
}

export interface OverpassElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface ExifMetadata {
  hasGps: boolean;
  make?: string;
  model?: string;
  lens?: string;
  focalLengthMm?: number;
  focalLengthIn35mmMm?: number;
  iso?: string;
  exposureTime?: string;
  fNumber?: string;
  dateTime?: string;
  latitude?: number;
  longitude?: number;
  altitudeMeters?: number;
  imageWidth?: number;
  imageHeight?: number;
}

export interface PresetSample {
  id: string;
  title: string;
  region: string;
  description: string;
  imageUrl: string;
  groundTruth: AnalysisResult;
  notes: string;
  antiTrap: string;
}
