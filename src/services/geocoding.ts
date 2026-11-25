import type { Coordinates, GeocodingResult } from '../types/routing';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

function buildShortName(item: any): string {
  const addr = item.address || {};
  const primary =
    addr.road ||
    addr.neighbourhood ||
    addr.suburb ||
    addr.city ||
    addr.town ||
    addr.village ||
    item.name;
  const city = addr.city || addr.town || addr.village || addr.county;
  const region = addr.state || addr.country;

  const parts = [primary, city !== primary ? city : null, region].filter(Boolean);
  if (parts.length > 0) {
    return parts.slice(0, 3).join(', ');
  }
  return (item.display_name || '').split(',').slice(0, 3).join(',').trim();
}

export async function searchAddresses(
  query: string,
  signal?: AbortSignal
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    format: 'json',
    addressdetails: '1',
    limit: '6',
    q: trimmed,
  });

  const res = await fetch(`${NOMINATIM_BASE}/search?${params.toString()}`, {
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Address lookup failed (${res.status})`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  return data.map((item: any) => ({
    displayName: item.display_name,
    shortName: buildShortName(item),
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    type: item.type || 'location',
  }));
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const params = new URLSearchParams({
      format: 'json',
      lat: lat.toFixed(6),
      lon: lon.toFixed(6),
      zoom: '14',
      addressdetails: '1',
    });

    const res = await fetch(`${NOMINATIM_BASE}/reverse?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }

    const data = await res.json();
    if (data && data.display_name) {
      return buildShortName(data);
    }
  } catch {
    // Fallback to raw coordinates if reverse lookup fails
  }
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

export function detectCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const label = await reverseGeocode(lat, lon);
        resolve({ lat, lon, label });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(
              new Error(
                'Location access was denied. Enable browser location permissions or search an address manually.'
              )
            );
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Current GPS position is unavailable. Please enter an origin address.'));
            break;
          case error.TIMEOUT:
            reject(new Error('GPS location request timed out. Please try again or enter an address.'));
            break;
          default:
            reject(new Error('Unable to detect current location.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}
