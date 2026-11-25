import React from 'react';
import { CloudRain, Compass, Eye, Thermometer, Wind } from 'lucide-react';
import type { AnalyzedRoute, WeatherScenario } from '../types/routing';
import { formatDuration } from '../services/physicsEngine';

interface CalculationBreakdownProps {
  route: AnalyzedRoute;
  fuelPricePerL: number;
  currencySymbol: string;
  weatherScenario: WeatherScenario;
  onChangeWeatherScenario: (scenario: WeatherScenario) => void;
}

const SCENARIOS: Array<{ id: WeatherScenario; label: string }> = [
  { id: 'live', label: 'Live Open-Meteo' },
  { id: 'heavy_rain_fog', label: 'Test: Rain & Fog' },
  { id: 'strong_headwind', label: 'Test: Headwind' },
  { id: 'extreme_heat', label: 'Test: Extreme Heat' },
];

export function CalculationBreakdown({
  route,
  fuelPricePerL,
  currencySymbol,
  weatherScenario,
  onChangeWeatherScenario,
}: CalculationBreakdownProps) {
  const { weatherSummary } = route;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 5 Cols: Active Weather Telemetry Panel */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Active Route Weather Model
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {weatherSummary.isSimulated
                  ? 'Sensitivity override active — test parameters injected directly into physics engine'
                  : 'Real-time Open-Meteo telemetry sampled across Origin, Midpoint, and Destination'}
              </p>
            </div>
          </div>

          {/* Scenario Sensitivity Switcher */}
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg">
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => onChangeWeatherScenario(sc.id)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  weatherScenario === sc.id
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Weather Metrics */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-slate-500 flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5 text-slate-400" />
              <span>Dominant Condition</span>
            </div>
            <div className="font-semibold text-slate-900 mt-1">
              {weatherSummary.dominantCondition}
            </div>
            <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
              Max precip: {weatherSummary.maxPrecipitationMm.toFixed(1)} mm/h
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-slate-500 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-slate-400" />
              <span>Mean Temperature</span>
            </div>
            <div className="font-semibold text-slate-900 font-mono tabular-nums mt-1">
              {weatherSummary.avgTempC.toFixed(1)} °C
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {weatherSummary.avgTempC >= 27
                ? 'AC compressor load active'
                : weatherSummary.avgTempC <= 5
                ? 'Cold air density factor'
                : 'Optimal thermal band'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-slate-500 flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-slate-400" />
              <span>Wind Vector</span>
            </div>
            <div className="font-semibold text-slate-900 font-mono tabular-nums mt-1">
              {weatherSummary.headwindComponentKmh >= 0
                ? `+${weatherSummary.headwindComponentKmh.toFixed(1)} km/h headwind`
                : `${Math.abs(weatherSummary.headwindComponentKmh).toFixed(1)} km/h tailwind`}
            </div>
            <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5 flex items-center gap-1">
              <Compass className="w-3 h-3" />
              <span>
                Bearing {weatherSummary.routeBearingDeg.toFixed(0)}° · Wind {weatherSummary.avgWindSpeedKmh.toFixed(0)} km/h
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-slate-500 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Min Visibility</span>
            </div>
            <div className="font-semibold text-slate-900 font-mono tabular-nums mt-1">
              {weatherSummary.minVisibilityM >= 1000
                ? `${(weatherSummary.minVisibilityM / 1000).toFixed(1)} km`
                : `${Math.round(weatherSummary.minVisibilityM)} m`}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {weatherSummary.minVisibilityM < 2000
                ? 'Visibility speed limit applied'
                : 'Clear highway sightline'}
            </div>
          </div>
        </div>

        {/* Waypoint Telemetry Table */}
        <div className="pt-2">
          <div className="text-xs font-semibold text-slate-700 mb-2">
            Route Weather Waypoints
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 font-semibold">Point</th>
                  <th className="py-2 px-3 font-semibold">Condition</th>
                  <th className="py-2 px-3 font-semibold text-right">Temp</th>
                  <th className="py-2 px-3 font-semibold text-right">Wind</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {weatherSummary.waypoints.map((wp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 font-medium text-slate-900">
                      {wp.locationLabel}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{wp.weatherLabel}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-800">
                      {wp.temperatureC.toFixed(1)}°C
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-800">
                      {wp.windSpeedKmh.toFixed(0)} km/h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right 7 Cols: Transparent Calculation Breakdown */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Transparent Physics & Cost Breakdown — {route.label}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Step-by-step derivation showing how distance, vehicle baseline, and weather adjustments determine fuel and ETA.
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-600 shrink-0">
            CO₂ est: {route.co2Kg.toFixed(1)} kg
          </div>
        </div>

        {/* Exact Formula Equation Strip */}
        <div className="bg-slate-900 text-slate-50 rounded-lg p-4 space-y-2.5">
          <div className="text-[11px] font-medium text-slate-400">
            Applied Fuel & Cost Equation
          </div>
          <div className="font-mono text-xs sm:text-sm tabular-nums leading-relaxed flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-slate-300">
              {route.distanceKm.toFixed(2)} km
            </span>
            <span className="text-slate-500">÷</span>
            <span className="text-emerald-400 font-semibold">
              {route.adjustedKmPerL.toFixed(2)} km/L (adj.)
            </span>
            <span className="text-slate-500">=</span>
            <span className="text-white font-bold">
              {route.fuelRequiredL.toFixed(2)} L
            </span>
            <span className="text-slate-500">×</span>
            <span className="text-slate-300">
              {currencySymbol}
              {fuelPricePerL.toFixed(2)}/L
            </span>
            <span className="text-slate-500">=</span>
            <span className="text-emerald-300 font-bold">
              {currencySymbol}
              {route.totalCost.toFixed(2)}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
            <div>
              <div className="text-slate-400 text-[11px] font-sans">Baseline Avg</div>
              <div className="text-white font-semibold mt-0.5">
                {route.baselineKmPerL.toFixed(2)} km/L
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] font-sans">Net Fuel Penalty</div>
              <div className="text-amber-300 font-semibold mt-0.5">
                {route.totalFuelPenaltyPct >= 0 ? '+' : ''}
                {route.totalFuelPenaltyPct.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] font-sans">Base vs Safe Speed</div>
              <div className="text-white font-semibold mt-0.5">
                {route.baseAvgSpeedKmh.toFixed(0)} → {route.safeSpeedKmh.toFixed(0)} km/h
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] font-sans">Weather ETA Delta</div>
              <div className="text-blue-300 font-semibold mt-0.5">
                {formatDuration(route.baseDurationSec)} → {formatDuration(route.adjustedDurationSec)}
              </div>
            </div>
          </div>
        </div>

        {/* Factor-by-Factor Inspection Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Physics / Weather Factor</th>
                <th className="py-2.5 px-3 font-semibold">Measured Input</th>
                <th className="py-2.5 px-3 font-semibold text-right">Speed Impact</th>
                <th className="py-2.5 px-3 font-semibold text-right">Fuel Burn Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {route.factors.map((factor) => (
                <tr key={factor.id} className="hover:bg-slate-50/70 align-top">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{factor.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {factor.explanation}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                    {factor.measuredValue}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-mono tabular-nums font-medium whitespace-nowrap ${
                      factor.speedAdjustmentPct < 0 ? 'text-amber-700' : 'text-slate-500'
                    }`}
                  >
                    {factor.speedAdjustmentPct === 0
                      ? '0.0%'
                      : `${factor.speedAdjustmentPct.toFixed(1)}%`}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-mono tabular-nums font-medium whitespace-nowrap ${
                      factor.fuelPenaltyPct > 0
                        ? 'text-rose-700'
                        : factor.fuelPenaltyPct < 0
                        ? 'text-emerald-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {factor.fuelPenaltyPct > 0
                      ? `+${factor.fuelPenaltyPct.toFixed(1)}%`
                      : `${factor.fuelPenaltyPct.toFixed(1)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
