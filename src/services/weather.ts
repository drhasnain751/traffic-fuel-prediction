import type { WeatherScenario, WeatherWaypoint } from '../types/routing';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

export function describeWmoCode(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code === 1) return 'Mainly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Dense Fog';
  if (code >= 51 && code <= 55) return 'Light Drizzle';
  if (code === 56 || code === 57) return 'Freezing Drizzle';
  if (code === 61) return 'Light Rain';
  if (code === 63) return 'Moderate Rain';
  if (code === 65) return 'Heavy Rain';
  if (code === 66 || code === 67) return 'Freezing Rain';
  if (code >= 71 && code <= 75) return 'Snowfall';
  if (code === 77) return 'Snow Grains';
  if (code === 80) return 'Light Rain Showers';
  if (code === 81) return 'Moderate Rain Showers';
  if (code === 82) return 'Violent Rain Showers';
  if (code === 85 || code === 86) return 'Snow Showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Variable Conditions';
}

function resolveCurrentVisibility(payload: any): number {
  const hourlyTimes: string[] = payload?.hourly?.time || [];
  const hourlyVis: number[] = payload?.hourly?.visibility || [];
  const currentTime: string = payload?.current?.time || '';
  const hourPrefix = currentTime.slice(0, 13);

  if (hourPrefix && hourlyTimes.length > 0 && hourlyVis.length === hourlyTimes.length) {
    const idx = hourlyTimes.findIndex((t) => t.startsWith(hourPrefix));
    if (idx !== -1 && typeof hourlyVis[idx] === 'number') {
      return hourlyVis[idx];
    }
  }

  if (typeof hourlyVis[0] === 'number') {
    return hourlyVis[0];
  }
  return 10000;
}

export async function fetchRouteWeather(
  points: Array<{ label: string; lat: number; lon: number }>,
  signal?: AbortSignal
): Promise<WeatherWaypoint[]> {
  if (points.length === 0) return [];

  const lats = points.map((p) => p.lat.toFixed(4)).join(',');
  const lons = points.map((p) => p.lon.toFixed(4)).join(',');

  const params = new URLSearchParams({
    latitude: lats,
    longitude: lons,
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,snowfall,weather_code,wind_speed_10m,wind_direction_10m',
    hourly: 'visibility',
    forecast_days: '1',
    timezone: 'auto',
  });

  const res = await fetch(`${OPEN_METEO_BASE}?${params.toString()}`, { signal });
  if (!res.ok) {
    throw new Error(`Weather API request failed (${res.status})`);
  }

  const raw = await res.json();
  const entries = Array.isArray(raw) ? raw : [raw];

  return points.map((pt, idx) => {
    const item = entries[idx] || entries[0];
    const curr = item?.current || {};
    const code = Number(curr.weather_code ?? 0);

    return {
      locationLabel: pt.label,
      lat: pt.lat,
      lon: pt.lon,
      temperatureC: Number(curr.temperature_2m ?? 20),
      apparentTempC: Number(curr.apparent_temperature ?? curr.temperature_2m ?? 20),
      humidityPct: Number(curr.relative_humidity_2m ?? 50),
      precipitationMm: Number(curr.precipitation ?? 0),
      rainMm: Number(curr.rain ?? 0),
      snowfallCm: Number(curr.snowfall ?? 0),
      weatherCode: code,
      weatherLabel: describeWmoCode(code),
      windSpeedKmh: Number(curr.wind_speed_10m ?? 0),
      windDirectionDeg: Number(curr.wind_direction_10m ?? 0),
      visibilityM: resolveCurrentVisibility(item),
      observedAt: String(curr.time || new Date().toISOString()),
    };
  });
}

export function applyWeatherScenario(
  liveWaypoints: WeatherWaypoint[],
  scenario: WeatherScenario,
  routeBearingDeg: number
): WeatherWaypoint[] {
  if (scenario === 'live') {
    return liveWaypoints;
  }

  return liveWaypoints.map((wp) => {
    if (scenario === 'heavy_rain_fog') {
      return {
        ...wp,
        temperatureC: 11.5,
        apparentTempC: 9.0,
        humidityPct: 96,
        precipitationMm: 8.4,
        rainMm: 8.4,
        snowfallCm: 0,
        weatherCode: 65,
        weatherLabel: 'Heavy Rain & Fog',
        windSpeedKmh: 28,
        windDirectionDeg: routeBearingDeg, // Blowing directly from destination toward origin (headwind)
        visibilityM: 420,
      };
    }

    if (scenario === 'strong_headwind') {
      return {
        ...wp,
        temperatureC: 16.0,
        apparentTempC: 12.5,
        humidityPct: 58,
        precipitationMm: 0,
        rainMm: 0,
        snowfallCm: 0,
        weatherCode: 2,
        weatherLabel: 'Gale Headwind',
        windSpeedKmh: 48,
        windDirectionDeg: routeBearingDeg, // Direct headwind along route bearing
        visibilityM: 9500,
      };
    }

    // extreme_heat
    return {
      ...wp,
      temperatureC: 39.5,
      apparentTempC: 43.0,
      humidityPct: 24,
      precipitationMm: 0,
      rainMm: 0,
      snowfallCm: 0,
      weatherCode: 0,
      weatherLabel: 'Extreme Heat',
      windSpeedKmh: 12,
      windDirectionDeg: routeBearingDeg,
      visibilityM: 10000,
    };
  });
}
