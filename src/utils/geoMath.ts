import { Coordinates, AnalysisResult } from '../types/osint';

const EARTH_RADIUS_METERS = 6378137;

/**
 * Calculates a point at a given distance (meters) and bearing (degrees clockwise from North)
 * from a starting coordinate using haversine spherical trigonometry.
 */
export function destinationPoint(
  lat: number,
  lng: number,
  bearingDeg: number,
  distanceMeters: number
): [number, number] {
  const δ = distanceMeters / EARTH_RADIUS_METERS;
  const θ = (bearingDeg * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;

  const sinφ2 = Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ);
  const φ2 = Math.asin(sinφ2);

  const y = Math.sin(θ) * Math.sin(δ) * Math.cos(φ1);
  const x = Math.cos(δ) - Math.sin(φ1) * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);

  const lat2 = (φ2 * 180) / Math.PI;
  const lng2 = (((λ2 * 180) / Math.PI + 540) % 360) - 180;

  return [lat2, lng2];
}

/**
 * Generates polygon coordinates for the camera frustum on the ground plane.
 */
export function calculateFrustumPoints(
  lat: number,
  lng: number,
  headingDeg: number,
  fovDeg: number,
  distanceMeters: number = 350,
  stepDeg: number = 3
): [number, number][] {
  const normalizedHeading = (headingDeg % 360 + 360) % 360;
  const halfFov = fovDeg / 2;
  const points: [number, number][] = [[lat, lng]];

  const startAngle = normalizedHeading - halfFov;
  const endAngle = normalizedHeading + halfFov;

  for (let angle = startAngle; angle <= endAngle; angle += stepDeg) {
    const pt = destinationPoint(lat, lng, angle, distanceMeters);
    points.push(pt);
  }

  // Ensure last angle is included
  const lastPt = destinationPoint(lat, lng, endAngle, distanceMeters);
  points.push(lastPt);

  // Close back to observer
  points.push([lat, lng]);

  return points;
}

/**
 * Calculates a central sightline vector line from the observer
 */
export function calculateSightlineVector(
  lat: number,
  lng: number,
  headingDeg: number,
  distanceMeters: number = 400
): [number, number][] {
  const target = destinationPoint(lat, lng, headingDeg, distanceMeters);
  return [[lat, lng], target];
}

/**
 * Generates an uncertainty circle/ellipse polygon
 */
export function calculateUncertaintyCircle(
  lat: number,
  lng: number,
  radiusMeters: number,
  numPoints: number = 36
): [number, number][] {
  const points: [number, number][] = [];
  const safeRadius = Math.max(radiusMeters, 5);

  for (let i = 0; i <= numPoints; i++) {
    const bearing = (i * 360) / numPoints;
    points.push(destinationPoint(lat, lng, bearing, safeRadius));
  }

  return points;
}

/**
 * Computes camera Horizontal FOV from 35mm equivalent focal length
 * Standard 35mm film sensor width is 36mm
 */
export function calculateFovFromFocalLength(focalLength35mmMm: number): number {
  if (!focalLength35mmMm || focalLength35mmMm <= 0) return 65; // standard wide-normal
  const sensorWidth = 36.0;
  const fovRad = 2 * Math.atan(sensorWidth / (2 * focalLength35mmMm));
  return Math.round(((fovRad * 180) / Math.PI) * 10) / 10;
}

/**
 * Formats coordinates into Degrees Minutes Seconds (DMS)
 */
export function toDMS(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';

  const formatCoord = (degDecimal: number, dir: string) => {
    const absDeg = Math.abs(degDecimal);
    const d = Math.floor(absDeg);
    const m = Math.floor((absDeg - d) * 60);
    const s = ((absDeg - d - m / 60) * 3600).toFixed(1);
    return `${d}°${m}'${s}"${dir}`;
  };

  return `${formatCoord(lat, latDir)} ${formatCoord(lng, lngDir)}`;
}

/**
 * Approximates MGRS / UTM grid reference string
 */
export function toMGRS(lat: number, lng: number): string {
  // UTM zone
  const zoneNumber = Math.floor((lng + 180) / 6) + 1;
  const latBands = 'CDEFGHJKLMNPQRSTUVWX';
  const bandIndex = Math.min(Math.max(Math.floor((lat + 80) / 8), 0), 19);
  const zoneLetter = latBands[bandIndex] || 'N';

  // Simplified 100km square designation & 10m precision pseudo-grid for tactical display
  const absLat = Math.abs(lat);
  const absLng = Math.abs(lng);
  const eastingSample = Math.floor((absLng * 10000) % 100000);
  const northingSample = Math.floor((absLat * 10000) % 100000);

  const colLetter = String.fromCharCode(65 + (Math.floor(absLng) % 24));
  const rowLetter = String.fromCharCode(65 + (Math.floor(absLat) % 20));

  const eStr = eastingSample.toString().padStart(4, '0').slice(0, 4);
  const nStr = northingSample.toString().padStart(4, '0').slice(0, 4);

  return `${zoneNumber}${zoneLetter} ${colLetter}${rowLetter} ${eStr} ${nStr}`;
}

/**
 * Export Intelligence Dossier as GeoJSON
 */
export function exportToGeoJSON(analysis: AnalysisResult, headingOffset: number = 0): string {
  const effectiveHeading = (analysis.camera_heading + headingOffset) % 360;
  const frustumPoints = calculateFrustumPoints(
    analysis.coordinates.lat,
    analysis.coordinates.lng,
    effectiveHeading,
    analysis.camera_fov,
    300
  );
  const uncertaintyCircle = calculateUncertaintyCircle(
    analysis.coordinates.lat,
    analysis.coordinates.lng,
    analysis.uncertainty_radius_meters
  );
  const sightline = calculateSightlineVector(
    analysis.coordinates.lat,
    analysis.coordinates.lng,
    effectiveHeading,
    350
  );

  const geoJson = {
    type: 'FeatureCollection',
    name: `GeoLens3D_${analysis.location_name.replace(/[^a-zA-Z0-9]/g, '_')}`,
    crs: {
      type: 'name',
      properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
    },
    features: [
      {
        type: 'Feature',
        properties: {
          role: 'Observer Assessed Position',
          location: analysis.location_name,
          confidence: `${analysis.confidence_score}%`,
          uncertainty_m: analysis.uncertainty_radius_meters,
          heading_deg: effectiveHeading,
          pitch_deg: analysis.camera_pitch,
          fov_deg: analysis.camera_fov,
          detected_text: analysis.detected_text.join(', '),
        },
        geometry: {
          type: 'Point',
          coordinates: [analysis.coordinates.lng, analysis.coordinates.lat],
        },
      },
      {
        type: 'Feature',
        properties: {
          role: 'Camera Sightline Vector',
          heading_deg: effectiveHeading,
        },
        geometry: {
          type: 'LineString',
          coordinates: sightline.map(([lat, lng]) => [lng, lat]),
        },
      },
      {
        type: 'Feature',
        properties: {
          role: 'Camera Frustum Field of View',
          fov: analysis.camera_fov,
          heading: effectiveHeading,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [frustumPoints.map(([lat, lng]) => [lng, lat])],
        },
      },
      {
        type: 'Feature',
        properties: {
          role: 'Confidence Uncertainty Boundary',
          radius_meters: analysis.uncertainty_radius_meters,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [uncertaintyCircle.map(([lat, lng]) => [lng, lat])],
        },
      },
    ],
  };

  return JSON.stringify(geoJson, null, 2);
}

/**
 * Export Intelligence Dossier as KML (Google Earth / ArcGIS)
 */
export function exportToKML(analysis: AnalysisResult, headingOffset: number = 0): string {
  const effectiveHeading = (analysis.camera_heading + headingOffset) % 360;
  const frustumPoints = calculateFrustumPoints(
    analysis.coordinates.lat,
    analysis.coordinates.lng,
    effectiveHeading,
    analysis.camera_fov,
    300
  );

  const frustumCoords = frustumPoints.map(([lat, lng]) => `${lng},${lat},0`).join(' ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>GeoLens 3D OSINT: ${analysis.location_name}</name>
    <description>Military-Grade Geospatial Sightline &amp; Ground Truth Verification</description>
    <Style id="observerPoint">
      <IconStyle>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/target.png</href>
        </Icon>
      </IconStyle>
    </Style>
    <Style id="frustumPoly">
      <LineStyle>
        <color>ffeedd22</color>
        <width>2</width>
      </LineStyle>
      <PolyStyle>
        <color>40eedd22</color>
      </PolyStyle>
    </Style>
    <Placemark>
      <name>Observer Coordinates (${analysis.confidence_score}% Conf)</name>
      <description>${analysis.location_name}&#10;Heading: ${effectiveHeading}°&#10;FOV: ${analysis.camera_fov}°</description>
      <styleUrl>#observerPoint</styleUrl>
      <Point>
        <coordinates>${analysis.coordinates.lng},${analysis.coordinates.lat},0</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>Camera 3D Sightline Frustum</name>
      <styleUrl>#frustumPoly</styleUrl>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${frustumCoords}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;
}

/**
 * Export Intelligence Dossier as Markdown
 */
export function exportToMarkdown(analysis: AnalysisResult, headingOffset: number = 0): string {
  const effectiveHeading = (analysis.camera_heading + headingOffset) % 360;
  const dms = toDMS(analysis.coordinates.lat, analysis.coordinates.lng);
  const mgrs = toMGRS(analysis.coordinates.lat, analysis.coordinates.lng);

  return `# GEOLENS 3D // TACTICAL OSINT INTELLIGENCE REPORT
**CLASSIFICATION:** RESTRICTED // OSINT VERIFIED
**TIMESTAMP:** ${new Date().toISOString()}
**SYSTEM ENGINE:** GeoLens v2.5_STRATCOM Neural Triangulation

---

## 1. TARGET SUMMARY
- **Assessed Location:** ${analysis.location_name}
- **Confidence Rating:** ${analysis.confidence_score}%
- **Uncertainty Radius:** ±${analysis.uncertainty_radius_meters} meters
- **Camera Azimuth (Heading):** ${effectiveHeading}° (${headingOffset !== 0 ? `Adjusted by ${headingOffset > 0 ? '+' : ''}${headingOffset}°` : 'Unadjusted'})
- **Camera Pitch:** ${analysis.camera_pitch}°
- **Horizontal FOV:** ${analysis.camera_fov}°

## 2. GEOSPATIAL COORDINATE TELEMETRY
- **Decimal Degrees (WGS84):** ${analysis.coordinates.lat.toFixed(6)}, ${analysis.coordinates.lng.toFixed(6)}
- **Degrees Minutes Seconds (DMS):** ${dms}
- **Military Grid Reference System (MGRS):** ${mgrs}
- **Google Maps Ground Truth:** [Open in Street View](https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${analysis.coordinates.lat},${analysis.coordinates.lng}&heading=${effectiveHeading}&pitch=${analysis.camera_pitch})

## 3. MULTIMODAL VISION DECOMPOSITION
### Detected Script & Signage:
${analysis.detected_text.length > 0 ? analysis.detected_text.map(t => `- \`${t}\``).join('\n') : '- *No distinct textual signs isolated.*'}

### Analytical Clues:
${analysis.clues.map(c => `#### [${c.category.toUpperCase()}]
> ${c.observation}
`).join('\n')}

${analysis.reasoning_stages ? `### Multi-Stage Reasoning Trace:
${analysis.reasoning_stages.map(s => `- **${s.stage}:** ${s.summary}`).join('\n')}
` : ''}

## 4. OPENSTREETMAP SPATIAL CONFIRMATION (OVERPASS QL)
\`\`\`overpassql
${analysis.overpass_ql}
\`\`\`

---
*Report generated by GeoLens 3D Neural Computer Vision Suite.*
`;
}
