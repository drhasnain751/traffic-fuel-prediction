import type { Coordinates, RawOsrmRoute } from '../types/routing';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

function extractMajorRoads(route: any): string[] {
  const names = new Set<string>();
  const legs = Array.isArray(route.legs) ? route.legs : [];
  for (const leg of legs) {
    const steps = Array.isArray(leg.steps) ? leg.steps : [];
    for (const step of steps) {
      const ref = typeof step.ref === 'string' ? step.ref.trim() : '';
      const name = typeof step.name === 'string' ? step.name.trim() : '';
      if (ref) {
        names.add(ref);
      } else if (name && name.length > 2) {
        names.add(name);
      }
      if (names.size >= 4) break;
    }
  }
  return Array.from(names);
}

export async function fetchDrivingRoutes(
  origin: Coordinates,
  destination: Coordinates,
  signal?: AbortSignal
): Promise<RawOsrmRoute[]> {
  const coords = `${origin.lon.toFixed(6)},${origin.lat.toFixed(6)};${destination.lon.toFixed(6)},${destination.lat.toFixed(6)}`;
  const url = `${OSRM_BASE}/${coords}?alternatives=3&overview=full&geometries=geojson&steps=true`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Routing service error (${res.status}). Please verify origin and destination.`);
  }

  const data = await res.json();
  if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
    throw new Error(data.message || 'No drivable route found between these coordinates.');
  }

  return data.routes.map((route: any, idx: number) => {
    const rawCoords: [number, number][] = Array.isArray(route.geometry?.coordinates)
      ? route.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon])
      : [
          [origin.lat, origin.lon],
          [destination.lat, destination.lon],
        ];

    const majorRoads = extractMajorRoads(route);
    const legSummary = route.legs?.[0]?.summary?.trim();
    const summary =
      legSummary && legSummary.length > 0
        ? `via ${legSummary}`
        : majorRoads.length > 0
        ? `via ${majorRoads.slice(0, 2).join(' & ')}`
        : `Corridor ${idx + 1}`;

    return {
      index: idx,
      summary,
      distanceKm: route.distance / 1000,
      baseDurationSec: route.duration,
      coordinates: rawCoords,
      majorRoads,
    };
  });
}

export function extractRouteMidpoint(coords: [number, number][]): { lat: number; lon: number } {
  if (!coords || coords.length === 0) {
    return { lat: 0, lon: 0 };
  }
  const mid = coords[Math.floor(coords.length / 2)];
  return { lat: mid[0], lon: mid[1] };
}

export function computeBearingDeg(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLon = toRad(b.lon - a.lon);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return bearing;
}
