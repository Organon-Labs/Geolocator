import { PresetSample } from '../types/osint';

export const PRESET_SAMPLES: PresetSample[] = [
  {
    id: 'forbidden-city',
    title: 'Forbidden City (The Palace Museum)',
    region: 'Beijing, China',
    description: 'Imperial glazed amber tile roofs and vermilion timber walls along the central Beijing meridian.',
    imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80',
    notes: 'Exemplifies structural morphology: Imperial hip-and-gable double eaves with glazed imperial yellow ceramic tiles. Strict North-South cardinal orientation.',
    antiTrap: 'Eliminates "Neon vs Imperial" misclassification (not commercial neon) & rejects numeric PIN code resolution.',
    groundTruth: {
      location_name: 'The Palace Museum (Forbidden City), Dongcheng District, Beijing, China',
      coordinates: { lat: 39.916345, lng: 116.397155 },
      confidence_score: 98,
      uncertainty_radius_meters: 15,
      camera_heading: 5,
      camera_pitch: 4,
      camera_fov: 65,
      detected_text: ['故宫博物院', '午门 (Meridian Gate)', '太和殿'],
      clues: [
        {
          category: 'Architectural Style',
          observation: 'Imperial Chinese Dou-gong bracket sets, hipped-gable double eaves surfaced with glazed yellow ceramic roof tiles, vermilion load-bearing columns.',
        },
        {
          category: 'Visible Text & Language',
          observation: 'Traditional Chinese and Manchu dual vertical script plaques characteristic of Ming & Qing Dynasty court architecture.',
        },
        {
          category: 'Infrastructure & Transport',
          observation: 'Symmetric imperial flagstone courtyards, triple marble bridges spanning the Inner Golden Water River; zero vehicular traffic.',
        },
        {
          category: 'Solar & Environmental Geometry',
          observation: 'Strict 0°/180° meridian axial layout. Shadow projection indicates mid-day sun positioned South of zenith (latitude 39.9°N).',
        },
      ],
      reasoning_stages: [
        {
          stage: 'Stage 1: Clue Decomposition',
          summary: 'Identified authentic imperial glazed earthenware tiles and vermilion woodwork, rejecting false commercial neon associations.',
        },
        {
          stage: 'Stage 2: Spatial Cross-Verification',
          summary: 'OSM Overpass QL targets way["historic"="palace"]["name:en"="Forbidden City"] on Beijing central axis.',
        },
        {
          stage: 'Stage 3: Frustum & Coordinate Synthesis',
          summary: 'Observer position triangulated on the south court of the Meridian Gate looking due North toward Hall of Supreme Harmony.',
        },
      ],
      overpass_ql: 'way["historic"="palace"]["name:en"="Forbidden City"](around:800, 39.9163, 116.3971); out geom;',
    },
  },
  {
    id: 'shibuya-scramble',
    title: 'Shibuya Scramble Crossing',
    region: 'Tokyo, Japan',
    description: 'World-famous multi-directional pedestrian intersection framed by high-density LED curved commercial facades.',
    imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&q=80',
    notes: 'Classic Left-Hand Traffic (LHT) orientation with dense Japanese script signage (Kanji/Katakana) and massive curved LED video screens.',
    antiTrap: 'Guards against raw Unsplash hash (photo-154205184...) being passed to Nominatim as Indian Postal PIN 154205.',
    groundTruth: {
      location_name: 'Shibuya Scramble Crossing, Shibuya City, Tokyo, Japan',
      coordinates: { lat: 35.65952, lng: 139.70055 },
      confidence_score: 96,
      uncertainty_radius_meters: 12,
      camera_heading: 220,
      camera_pitch: -8,
      camera_fov: 72,
      detected_text: ['SHIBUYA 109', 'スターバックスコーヒー', 'TSUTAYA', '大盛堂書店'],
      clues: [
        {
          category: 'Visible Text & Language',
          observation: 'High density of Japanese Kanji, Katakana, and Hiragana retail signage interspersed with multinational tech/retail branding.',
        },
        {
          category: 'Infrastructure & Transport',
          observation: 'Left-Hand Traffic (LHT), iconic 5-way diagonal pedestrian crosswalk striping, elevated track bed of JR Yamanote Line.',
        },
        {
          category: 'Architectural Style',
          observation: 'Post-modern commercial metabolism; curtain wall glass facades engineered with curved, ultra-high-definition LED media displays.',
        },
        {
          category: 'Solar & Environmental Geometry',
          observation: 'Shadow angle across crossing asphalt indicates mid-afternoon sun (~14:30 JST) casting toward Northeast.',
        },
      ],
      reasoning_stages: [
        {
          stage: 'Stage 1: Clue Decomposition',
          summary: 'Decoded prominent Katakana store typography and high-density diagonal zebra street striping.',
        },
        {
          stage: 'Stage 2: Spatial Cross-Verification',
          summary: 'Verified spatial co-occurrence with node["railway"="station"]["name"="渋谷駅"] and surrounding pedestrian plazas.',
        },
        {
          stage: 'Stage 3: Frustum & Coordinate Synthesis',
          summary: 'Observer situated in QFRONT 2F overlooking Hachiko square pointing Southwest (220°).',
        },
      ],
      overpass_ql: 'node["railway"="station"]["name"~"渋谷"](around:250, 35.6595, 139.7005); out body;',
    },
  },
  {
    id: 'monas-jakarta',
    title: 'Monas (National Monument)',
    region: 'Jakarta, Indonesia',
    description: '132m Sukarno-era national obelisk topped with gold-leaf bronze flame in Medan Merdeka park.',
    imageUrl: 'https://images.unsplash.com/photo-1555899434-94d1368aa7af?auto=format&fit=crop&w=1200&q=80',
    notes: 'Cup-and-obelisk marble tower with 50kg gold leaf bronze flame. Expansive tropical Medan Merdeka park landscape.',
    antiTrap: 'Guards against "Color-Averaging Sky Trap" (open blue sky + greenery falsely triggering Eiffel Tower classifier).',
    groundTruth: {
      location_name: 'National Monument (Monas), Merdeka Square, Central Jakarta, Indonesia',
      coordinates: { lat: -6.175392, lng: 106.827153 },
      confidence_score: 97,
      uncertainty_radius_meters: 15,
      camera_heading: 355,
      camera_pitch: 14,
      camera_fov: 68,
      detected_text: ['MONUMEN NASIONAL', 'MEDAN MERDEKA', 'JAKARTA PUSAT'],
      clues: [
        {
          category: 'Architectural Style',
          observation: '132-meter Italian marble clad monolithic obelisk topped with a 14.5-ton bronze flame covered in 50kg of gold leaf, rising from a 45m square cup-shaped goblet platform.',
        },
        {
          category: 'Visible Text & Language',
          observation: 'Bahasa Indonesia administrative and historical marker inscriptions.',
        },
        {
          category: 'Infrastructure & Transport',
          observation: 'Concentric paved park walkways, TransJakarta bus rapid transit perimeter corridors, Left-Hand Traffic (LHT) on Medan Merdeka circular roadways.',
        },
        {
          category: 'Solar & Environmental Geometry',
          observation: 'Equatorial daylight characteristics (-6.17° latitude); tropical palm flora and sharp overhead solar elevation angle.',
        },
      ],
      reasoning_stages: [
        {
          stage: 'Stage 1: Clue Decomposition',
          summary: 'Analyzed unique monolithic cup-and-obelisk silhouette and tropical palms, ruling out European steel structures.',
        },
        {
          stage: 'Stage 2: Spatial Cross-Verification',
          summary: 'Overpass query successfully matches historic monument element node["historic"="monument"]["name"="Monumen Nasional"].',
        },
        {
          stage: 'Stage 3: Frustum & Coordinate Synthesis',
          summary: 'Camera viewpoint placed on South pedestrian plaza of Merdeka Square oriented North (355°) towards monument pinnacle.',
        },
      ],
      overpass_ql: 'node["historic"="monument"]["name"~"Monas"](around:600, -6.1754, 106.8272); out body;',
    },
  },
  {
    id: 'eiffel-tower',
    title: 'Eiffel Tower (Tour Eiffel)',
    region: 'Paris, France',
    description: 'Puddle-iron lattice tower designed by Gustave Eiffel, viewed from the Champ de Mars.',
    imageUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=1200&q=80',
    notes: 'Wrought puddle-iron 4-legged arched lattice tower. Haussmannian zinc-roof residential blocks and Right-Hand Traffic (RHT).',
    antiTrap: 'True positive benchmark for European wrought-iron architecture with temperate European deciduous trees and RHT.',
    groundTruth: {
      location_name: 'Eiffel Tower, Champ de Mars, 7th Arrondissement, Paris, France',
      coordinates: { lat: 48.85837, lng: 2.294481 },
      confidence_score: 99,
      uncertainty_radius_meters: 10,
      camera_heading: 325,
      camera_pitch: 18,
      camera_fov: 62,
      detected_text: ['TOUR EIFFEL', 'CHAMP DE MARS', 'PARIS 7E'],
      clues: [
        {
          category: 'Architectural Style',
          observation: 'Riveted puddle iron 4-legged lattice tower with semicircular decorative arches at base and distinctive dual observation platforms.',
        },
        {
          category: 'Visible Text & Language',
          observation: 'French language signage, scientific surname engravings along the first floor frieze, municipal Paris plaques.',
        },
        {
          category: 'Infrastructure & Transport',
          observation: 'Right-Hand Traffic (RHT) vehicular roadways, gravel park allées framed by horse chestnut trees, Parisian Belle Époque lampposts.',
        },
        {
          category: 'Solar & Environmental Geometry',
          observation: 'Temperate European latitude (48.8°N); sun position generates long diagonal shadows across the lawns of Champ de Mars.',
        },
      ],
      reasoning_stages: [
        {
          stage: 'Stage 1: Clue Decomposition',
          summary: 'Detected open lattice structural steelwork and Parisian urban street furniture.',
        },
        {
          stage: 'Stage 2: Spatial Cross-Verification',
          summary: 'Confirmed via OSM node["tourism"="attraction"]["name"="Tour Eiffel"].',
        },
        {
          stage: 'Stage 3: Frustum & Coordinate Synthesis',
          summary: 'Observer position set in Champ de Mars looking Northwest (325°) directly through the tower arches toward Trocadéro.',
        },
      ],
      overpass_ql: 'node["tourism"="attraction"]["name"~"Tour Eiffel"](around:400, 48.8584, 2.2945); out body;',
    },
  },
];
