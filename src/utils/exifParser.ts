import ExifReader from 'exifreader';
import { ExifMetadata } from '../types/osint';
import { calculateFovFromFocalLength } from './geoMath';

export async function parseImageExif(fileOrBlob: Blob | File): Promise<{
  metadata: ExifMetadata;
  estimatedFov: number;
}> {
  try {
    const arrayBuffer = await fileOrBlob.arrayBuffer();
    const tags: any = ExifReader.load(arrayBuffer, { expanded: true });

    let hasGps = false;
    let latitude: number | undefined;
    let longitude: number | undefined;
    let altitudeMeters: number | undefined;

    if (tags.gps && tags.gps.Latitude !== undefined && tags.gps.Longitude !== undefined) {
      latitude = tags.gps.Latitude;
      longitude = tags.gps.Longitude;
      hasGps = true;
      if (tags.gps.Altitude !== undefined) {
        altitudeMeters = tags.gps.Altitude;
      }
    }

    const exif = tags.exif || {};
    const fileTags = tags.file || {};
    const tiffTags = tags.tiff || {};

    const make = exif.Make?.description || tiffTags.Make?.description;
    const model = exif.Model?.description || tiffTags.Model?.description;
    const lens = exif.LensModel?.description || exif.Lens?.description;
    const iso = exif.ISOSpeedRatings?.description?.toString();
    const exposureTime = exif.ExposureTime?.description;
    const fNumber = exif.FNumber?.description;
    const dateTime = exif.DateTimeOriginal?.description || tiffTags.DateTime?.description;

    let focalLengthMm: number | undefined;
    if (exif.FocalLength?.value) {
      const val = exif.FocalLength.value;
      if (Array.isArray(val) && val.length === 2 && val[1] !== 0) {
        focalLengthMm = Math.round((val[0] / val[1]) * 10) / 10;
      } else if (typeof val === 'number') {
        focalLengthMm = val;
      }
    }

    let focalLengthIn35mmMm: number | undefined;
    if (exif.FocalLengthIn35mmFilm?.value) {
      focalLengthIn35mmMm = Number(exif.FocalLengthIn35mmFilm.value);
    } else if (focalLengthMm) {
      // Approximate 35mm equivalent assuming typical 1.5x APS-C or 1.0x full-frame
      focalLengthIn35mmMm = Math.round(focalLengthMm * 1.5);
    }

    const imageWidth = fileTags['Image Width']?.value || exif.PixelXDimension?.value;
    const imageHeight = fileTags['Image Height']?.value || exif.PixelYDimension?.value;

    const estimatedFov = focalLengthIn35mmMm
      ? calculateFovFromFocalLength(focalLengthIn35mmMm)
      : 65; // default wide-angle

    return {
      metadata: {
        hasGps,
        make,
        model,
        lens,
        focalLengthMm,
        focalLengthIn35mmMm,
        iso,
        exposureTime,
        fNumber,
        dateTime,
        latitude,
        longitude,
        altitudeMeters,
        imageWidth: typeof imageWidth === 'number' ? imageWidth : undefined,
        imageHeight: typeof imageHeight === 'number' ? imageHeight : undefined,
      },
      estimatedFov,
    };
  } catch (err) {
    console.warn('ExifReader notice: Image does not contain standard EXIF headers or was stripped.', err);
    return {
      metadata: { hasGps: false },
      estimatedFov: 65,
    };
  }
}
