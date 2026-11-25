export interface Coordinates {
  lat: number;
  lon: number;
  label: string;
}

export interface GeocodingResult {
  displayName: string;
  shortName: string;
  lat: number;
  lon: number;
  type: string;
}

export type VehicleCategoryId = 'hatchback' | 'sedan' | 'suv' | 'hybrid' | 'truck';

export interface VehicleProfile {
  id: VehicleCategoryId;
  name: string;
  typicalRangeLabel: string;
  defaultKmPerL: number;
  minKmPerL: number;
  maxKmPerL: number;
  dragCoefficientFactor: number;
}

export type EfficiencyUnit = 'km_per_l' | 'l_per_100km';

export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
  defaultPricePerLiter: number;
}

export type WeatherScenario = 'live' | 'heavy_rain_fog' | 'strong_headwind' | 'extreme_heat';

export interface WeatherWaypoint {
  locationLabel: string;
  lat: number;
  lon: number;
  temperatureC: number;
  apparentTempC: number;
  humidityPct: number;
  precipitationMm: number;
  rainMm: number;
  snowfallCm: number;
  weatherCode: number;
  weatherLabel: string;
  windSpeedKmh: number;
  windDirectionDeg: number;
  visibilityM: number;
  observedAt: string;
}

export interface RouteWeatherSummary {
  waypoints: WeatherWaypoint[];
  avgTempC: number;
  maxPrecipitationMm: number;
  totalSnowfallCm: number;
  minVisibilityM: number;
  avgWindSpeedKmh: number;
  avgWindDirectionDeg: number;
  headwindComponentKmh: number;
  routeBearingDeg: number;
  dominantCondition: string;
  dominantCode: number;
  isSimulated: boolean;
  scenario: WeatherScenario;
}

export interface RawOsrmRoute {
  index: number;
  summary: string;
  distanceKm: number;
  baseDurationSec: number;
  coordinates: [number, number][]; // [lat, lon] pairs for Leaflet
  majorRoads: string[];
}

export interface PenaltyFactor {
  id: string;
  label: string;
  measuredValue: string;
  speedAdjustmentPct: number;
  fuelPenaltyPct: number;
  explanation: string;
}

export interface AnalyzedRoute {
  index: number;
  label: string;
  summary: string;
  distanceKm: number;
  baseDurationSec: number;
  adjustedDurationSec: number;
  baseAvgSpeedKmh: number;
  safeSpeedKmh: number;
  speedAdjustmentPct: number;
  baselineKmPerL: number;
  adjustedKmPerL: number;
  totalFuelPenaltyPct: number;
  fuelRequiredL: number;
  totalCost: number;
  costPerKm: number;
  co2Kg: number;
  coordinates: [number, number][];
  majorRoads: string[];
  factors: PenaltyFactor[];
  weatherSummary: RouteWeatherSummary;
  isEconomical: boolean;
  isFastest: boolean;
}

export type UserRole = 'USER' | 'ADMIN';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface SavedTripRecord {
  id: string;
  userId: string;
  userName: string;
  originLabel: string;
  destinationLabel: string;
  routeSummary: string;
  distanceKm: number;
  durationSec: number;
  fuelL: number;
  cost: number;
  currencySymbol: string;
  vehicleName: string;
  weatherCondition: string;
  createdAt: string;
}
