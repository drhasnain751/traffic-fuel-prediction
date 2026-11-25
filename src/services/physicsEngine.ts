import type {
  AnalyzedRoute,
  Coordinates,
  CurrencyOption,
  PenaltyFactor,
  RawOsrmRoute,
  RouteWeatherSummary,
  VehicleCategoryId,
  VehicleProfile,
  WeatherScenario,
  WeatherWaypoint,
} from '../types/routing';
import { computeBearingDeg } from './routing';
import { applyWeatherScenario } from './weather';

export const VEHICLE_PROFILES: Record<VehicleCategoryId, VehicleProfile> = {
  hatchback: {
    id: 'hatchback',
    name: 'Economy Hatchback',
    typicalRangeLabel: '16–18 km/L',
    defaultKmPerL: 17.0,
    minKmPerL: 11.0,
    maxKmPerL: 24.0,
    dragCoefficientFactor: 0.92,
  },
  sedan: {
    id: 'sedan',
    name: 'Sedan',
    typicalRangeLabel: '12–15 km/L',
    defaultKmPerL: 13.5,
    minKmPerL: 8.5,
    maxKmPerL: 19.0,
    dragCoefficientFactor: 1.0,
  },
  suv: {
    id: 'suv',
    name: 'SUV / Crossover',
    typicalRangeLabel: '8–11 km/L',
    defaultKmPerL: 9.5,
    minKmPerL: 6.0,
    maxKmPerL: 14.5,
    dragCoefficientFactor: 1.24,
  },
  hybrid: {
    id: 'hybrid',
    name: 'Hybrid Sedan',
    typicalRangeLabel: '20–24 km/L',
    defaultKmPerL: 22.0,
    minKmPerL: 15.0,
    maxKmPerL: 30.0,
    dragCoefficientFactor: 0.88,
  },
  truck: {
    id: 'truck',
    name: 'Light Truck / Van',
    typicalRangeLabel: '7–9 km/L',
    defaultKmPerL: 7.8,
    minKmPerL: 4.5,
    maxKmPerL: 12.0,
    dragCoefficientFactor: 1.38,
  },
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'USD', symbol: '$', label: 'USD ($/L)', defaultPricePerLiter: 1.55 },
  { code: 'EUR', symbol: '€', label: 'EUR (€/L)', defaultPricePerLiter: 1.78 },
  { code: 'GBP', symbol: '£', label: 'GBP (£/L)', defaultPricePerLiter: 1.48 },
  { code: 'PKR', symbol: '₨', label: 'PKR (₨/L)', defaultPricePerLiter: 256.0 },
  { code: 'INR', symbol: '₹', label: 'INR (₹/L)', defaultPricePerLiter: 104.0 },
];

export function kmPerLToLPer100Km(kmPerL: number): number {
  if (kmPerL <= 0) return 0;
  return 100 / kmPerL;
}

export function lPer100KmToKmPerL(lPer100Km: number): number {
  if (lPer100Km <= 0) return 0;
  return 100 / lPer100Km;
}

function computeHeadwindComponent(
  windSpeedKmh: number,
  windFromDeg: number,
  routeBearingDeg: number
): number {
  // Meteorological wind direction is where wind originates FROM.
  // If windFromDeg === routeBearingDeg, wind blows directly against the direction of travel (full headwind).
  const angleRad = ((windFromDeg - routeBearingDeg) * Math.PI) / 180;
  return windSpeedKmh * Math.cos(angleRad);
}

function summarizeWeather(
  waypoints: WeatherWaypoint[],
  routeBearingDeg: number,
  scenario: WeatherScenario
): RouteWeatherSummary {
  const count = Math.max(waypoints.length, 1);
  const avgTempC = waypoints.reduce((sum, w) => sum + w.temperatureC, 0) / count;
  const maxPrecipitationMm = Math.max(...waypoints.map((w) => w.precipitationMm), 0);
  const totalSnowfallCm = waypoints.reduce((sum, w) => sum + w.snowfallCm, 0) / count;
  const minVisibilityM = Math.min(...waypoints.map((w) => w.visibilityM));
  const avgWindSpeedKmh = waypoints.reduce((sum, w) => sum + w.windSpeedKmh, 0) / count;

  // Pick midpoint (or worst) waypoint for dominant label & wind angle
  const midWp = waypoints[Math.floor(waypoints.length / 2)] || waypoints[0];
  const worstWp =
    waypoints.reduce((worst, curr) => {
      const currSeverity = curr.precipitationMm * 10 + (10000 - curr.visibilityM) / 500 + curr.snowfallCm * 20;
      const worstSeverity = worst.precipitationMm * 10 + (10000 - worst.visibilityM) / 500 + worst.snowfallCm * 20;
      return currSeverity > worstSeverity ? curr : worst;
    }, midWp);

  const avgWindDirectionDeg = midWp?.windDirectionDeg ?? 0;
  const headwindComponentKmh = computeHeadwindComponent(
    avgWindSpeedKmh,
    avgWindDirectionDeg,
    routeBearingDeg
  );

  return {
    waypoints,
    avgTempC,
    maxPrecipitationMm,
    totalSnowfallCm,
    minVisibilityM,
    avgWindSpeedKmh,
    avgWindDirectionDeg,
    headwindComponentKmh,
    routeBearingDeg,
    dominantCondition: worstWp?.weatherLabel || 'Clear Sky',
    dominantCode: worstWp?.weatherCode ?? 0,
    isSimulated: scenario !== 'live',
    scenario,
  };
}

function computeFactorsForRoute(
  baseAvgSpeedKmh: number,
  weather: RouteWeatherSummary,
  vehicle: VehicleProfile
): PenaltyFactor[] {
  const factors: PenaltyFactor[] = [];

  // 1. Road Speed / Duty Cycle Profile (from actual OSRM average route speed)
  let dutyFuelPct = 0;
  let dutyExplanation = 'Optimal steady highway cruising band (60–95 km/h); minimal drivetrain or drag penalty.';
  if (baseAvgSpeedKmh < 35) {
    dutyFuelPct = 8;
    dutyExplanation = 'Frequent urban acceleration/braking and idle losses below 35 km/h.';
  } else if (baseAvgSpeedKmh < 60) {
    dutyFuelPct = 3;
    dutyExplanation = 'Mixed arterial/suburban flow with moderate intersection stops.';
  } else if (baseAvgSpeedKmh > 100) {
    dutyFuelPct = Number((5 * vehicle.dragCoefficientFactor).toFixed(1));
    dutyExplanation = 'Sustained high-speed cruising increases aerodynamic drag (scales with v²).';
  }
  factors.push({
    id: 'duty_cycle',
    label: 'Route Speed & Duty Cycle',
    measuredValue: `${baseAvgSpeedKmh.toFixed(1)} km/h avg`,
    speedAdjustmentPct: 0,
    fuelPenaltyPct: dutyFuelPct,
    explanation: dutyExplanation,
  });

  // 2. Precipitation / Surface Rolling Resistance & Wet Road Speed Reduction
  const precip = weather.maxPrecipitationMm;
  const snow = weather.totalSnowfallCm;
  const code = weather.dominantCode;
  let precipFuelPct = 0;
  let precipSpeedPct = 0;
  let precipDesc = 'Dry road surface; baseline tire rolling resistance.';

  if (snow > 0.1 || (code >= 71 && code <= 77) || code === 85 || code === 86) {
    precipFuelPct = 15;
    precipSpeedPct = -25;
    precipDesc = 'Snow/slush accumulation increases rolling resistance (+15%) and forces -25% safe speed reduction.';
  } else if (precip >= 5 || code === 65 || code === 82 || code >= 95) {
    precipFuelPct = 12;
    precipSpeedPct = -20;
    precipDesc = 'Heavy rain / standing water increases hydrodynamic drag (+12%) and reduces safe speed by 20%.';
  } else if (precip >= 1.0 || code === 63 || code === 81) {
    precipFuelPct = 8;
    precipSpeedPct = -14;
    precipDesc = 'Moderate rainfall increases rolling resistance (+8%) and wet-braking safety margin (-14% speed).';
  } else if (precip > 0 || (code >= 51 && code <= 61) || code === 80) {
    precipFuelPct = 4;
    precipSpeedPct = -7;
    precipDesc = 'Light rain/drizzle slightly increases tire drag (+4%) and lowers cruising speed by 7%.';
  }

  factors.push({
    id: 'precipitation',
    label: 'Surface & Precipitation',
    measuredValue:
      snow > 0
        ? `${snow.toFixed(1)} cm snow`
        : precip > 0
        ? `${precip.toFixed(1)} mm/h`
        : weather.dominantCondition,
    speedAdjustmentPct: precipSpeedPct,
    fuelPenaltyPct: precipFuelPct,
    explanation: precipDesc,
  });

  // 3. Visibility Safety Adjustment (Fog / Mist / Storm)
  const visM = weather.minVisibilityM;
  let visSpeedPct = 0;
  let visDesc = 'Clear sightlines (> 5 km); no visibility speed restriction.';
  if (visM < 500 || code === 45 || code === 48) {
    visSpeedPct = -22;
    visDesc = 'Dense fog / low visibility (< 500 m) mandates a -22% safe speed limit for stopping distance.';
  } else if (visM < 2000) {
    visSpeedPct = -12;
    visDesc = 'Reduced visibility (< 2 km) requires a -12% precautionary speed reduction.';
  } else if (visM < 5000) {
    visSpeedPct = -5;
    visDesc = 'Hazy visibility (< 5 km) prompts a minor -5% cruising adjustment.';
  }

  factors.push({
    id: 'visibility',
    label: 'Visibility & Sightline',
    measuredValue: visM >= 1000 ? `${(visM / 1000).toFixed(1)} km` : `${Math.round(visM)} m`,
    speedAdjustmentPct: visSpeedPct,
    fuelPenaltyPct: 0,
    explanation: visDesc,
  });

  // 4. Aerodynamic Wind Vector (Headwind / Tailwind)
  const headwind = weather.headwindComponentKmh;
  let windFuelPct = 0;
  let windSpeedPct = 0;
  let windDesc = 'Calm cross/light wind; negligible aerodynamic drag delta.';

  if (headwind >= 30) {
    windFuelPct = Number((10 * vehicle.dragCoefficientFactor).toFixed(1));
    windSpeedPct = -6;
    windDesc = `Strong direct headwind (+${headwind.toFixed(0)} km/h) raises aerodynamic drag and reduces safe stability speed.`;
  } else if (headwind >= 15) {
    windFuelPct = Number((5 * vehicle.dragCoefficientFactor).toFixed(1));
    windSpeedPct = 0;
    windDesc = `Moderate headwind (+${headwind.toFixed(0)} km/h) increases frontal air resistance scaled by vehicle drag profile.`;
  } else if (headwind >= 5) {
    windFuelPct = Number((2 * vehicle.dragCoefficientFactor).toFixed(1));
    windSpeedPct = 0;
    windDesc = `Light headwind (+${headwind.toFixed(0)} km/h) introduces minor aerodynamic drag.`;
  } else if (headwind <= -15) {
    windFuelPct = -2.5;
    windSpeedPct = 0;
    windDesc = `Favorable tailwind (${Math.abs(headwind).toFixed(0)} km/h) slightly reduces aerodynamic drag.`;
  }

  factors.push({
    id: 'aerodynamics',
    label: 'Wind & Aerodynamic Drag',
    measuredValue:
      headwind >= 0
        ? `+${headwind.toFixed(0)} km/h headwind`
        : `${Math.abs(headwind).toFixed(0)} km/h tailwind`,
    speedAdjustmentPct: windSpeedPct,
    fuelPenaltyPct: windFuelPct,
    explanation: windDesc,
  });

  // 5. Ambient Temperature & HVAC / Air Density Load
  const temp = weather.avgTempC;
  let tempFuelPct = 0;
  let tempDesc = 'Mild ambient temperature (10–25°C); optimal engine thermal efficiency and minimal HVAC draw.';
  if (temp >= 34) {
    tempFuelPct = 7;
    tempDesc = 'Extreme heat (≥ 34°C) drives continuous max-capacity AC compressor load (+7% fuel burn).';
  } else if (temp >= 27) {
    tempFuelPct = 3.5;
    tempDesc = 'Warm ambient weather (27–33°C) adds moderate cabin AC compressor load (+3.5%).';
  } else if (temp <= 0) {
    tempFuelPct = 8;
    tempDesc = 'Freezing air (≤ 0°C) increases air density, drivetrain oil viscosity, and cabin heating demand (+8%).';
  } else if (temp < 10) {
    tempFuelPct = 3;
    tempDesc = 'Cool conditions (1–9°C) increase warm-up enrichment and air density slightly (+3%).';
  }

  factors.push({
    id: 'thermal_hvac',
    label: 'Temperature & HVAC Load',
    measuredValue: `${temp.toFixed(1)} °C`,
    speedAdjustmentPct: 0,
    fuelPenaltyPct: tempFuelPct,
    explanation: tempDesc,
  });

  return factors;
}

export function analyzeRoutes(
  rawRoutes: RawOsrmRoute[],
  origin: Coordinates,
  destination: Coordinates,
  liveWeatherWaypoints: WeatherWaypoint[],
  baselineKmPerL: number,
  fuelPricePerL: number,
  vehicle: VehicleProfile,
  scenario: WeatherScenario = 'live'
): AnalyzedRoute[] {
  const routeBearingDeg = computeBearingDeg(origin, destination);
  const effectiveWaypoints = applyWeatherScenario(
    liveWeatherWaypoints,
    scenario,
    routeBearingDeg
  );
  const weatherSummary = summarizeWeather(effectiveWaypoints, routeBearingDeg, scenario);

  const safeBaseline = Math.max(2.0, baselineKmPerL);
  const safePrice = Math.max(0, fuelPricePerL);

  const analyzed: AnalyzedRoute[] = rawRoutes.map((route): AnalyzedRoute => {
    const baseHours = Math.max(route.baseDurationSec / 3600, 0.01);
    const baseAvgSpeedKmh = route.distanceKm / baseHours;

    const factors = computeFactorsForRoute(baseAvgSpeedKmh, weatherSummary, vehicle);

    // Combine speed reductions (capped at -35% so routes remain realistic)
    const rawSpeedPct = factors.reduce((acc, f) => acc + f.speedAdjustmentPct, 0);
    const speedAdjustmentPct = Math.max(-35, Math.min(0, rawSpeedPct));
    const speedMultiplier = 1 + speedAdjustmentPct / 100;

    const safeSpeedKmh = Math.max(10, baseAvgSpeedKmh * speedMultiplier);
    const adjustedDurationSec = route.baseDurationSec / speedMultiplier;

    // Combine fuel burn penalties
    const totalFuelPenaltyPct = Number(
      factors.reduce((acc, f) => acc + f.fuelPenaltyPct, 0).toFixed(1)
    );
    const adjustedKmPerL = Math.max(
      2.0,
      safeBaseline / (1 + totalFuelPenaltyPct / 100)
    );

    const fuelRequiredL = route.distanceKm / adjustedKmPerL;
    const totalCost = fuelRequiredL * safePrice;
    const costPerKm = route.distanceKm > 0 ? totalCost / route.distanceKm : 0;
    const co2Kg = fuelRequiredL * 2.31; // EPA standard ~2.31 kg CO2 per liter gasoline

    return {
      index: route.index,
      label: `Route ${route.index + 1}`,
      summary: route.summary,
      distanceKm: route.distanceKm,
      baseDurationSec: route.baseDurationSec,
      adjustedDurationSec,
      baseAvgSpeedKmh,
      safeSpeedKmh,
      speedAdjustmentPct,
      baselineKmPerL: safeBaseline,
      adjustedKmPerL,
      totalFuelPenaltyPct,
      fuelRequiredL,
      totalCost,
      costPerKm,
      co2Kg,
      coordinates: route.coordinates,
      majorRoads: route.majorRoads,
      factors,
      weatherSummary,
      isEconomical: false,
      isFastest: false,
    };
  });

  if (analyzed.length > 0) {
    let minFuelIdx = 0;
    let minTimeIdx = 0;

    analyzed.forEach((r, idx) => {
      if (r.fuelRequiredL < analyzed[minFuelIdx].fuelRequiredL) {
        minFuelIdx = idx;
      }
      if (r.adjustedDurationSec < analyzed[minTimeIdx].adjustedDurationSec) {
        minTimeIdx = idx;
      }
    });

    analyzed[minFuelIdx].isEconomical = true;
    analyzed[minTimeIdx].isFastest = true;
  }

  return analyzed;
}

export function formatDuration(seconds: number): string {
  const totalMins = Math.max(1, Math.round(seconds / 60));
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs === 0) return `${mins} min`;
  return `${hrs}h ${mins}m`;
}
