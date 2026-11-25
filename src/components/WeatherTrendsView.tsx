import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AddressSearchInput } from './AddressSearchInput';
import { fetchHourlyWeatherForecast, type HourlyForecastPoint } from '../services/weather';
import type { Coordinates } from '../types/routing';

interface WeatherTrendsViewProps {
  defaultLocation: Coordinates;
}

export function WeatherTrendsView({ defaultLocation }: WeatherTrendsViewProps) {
  const [location, setLocation] = useState<Coordinates>(defaultLocation);
  const [points, setPoints] = useState<HourlyForecastPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchHourlyWeatherForecast(location.lat, location.lon, controller.signal)
      .then((res) => {
        setPoints(res);
      })
      .catch((err: any) => {
        if (err?.name !== 'AbortError') {
          setError(err?.message || 'Unable to load hourly weather forecast.');
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [location]);

  const maxTemp = Math.max(...points.map((p) => p.temperatureC), 35);
  const minTemp = Math.min(...points.map((p) => p.temperatureC), 0);
  const tempRange = Math.max(maxTemp - minTemp, 10);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <h2 className="text-xl font-bold text-slate-900">
            24-Hour Weather & Fuel Sensitivity Forecast
          </h2>
          <p className="text-sm text-slate-600">
            Live Open-Meteo hourly telemetry showing how temperature, precipitation, wind speed, and visibility change projected fuel burn and safe driving speed over the next 24 hours.
          </p>
        </div>

        <div className="w-full lg:w-80">
          <AddressSearchInput
            id="trends-location-input"
            label="Forecast Location"
            placeholder="Search any city or highway..."
            value={location}
            onSelect={setLocation}
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 flex items-center justify-center gap-3 text-sm text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading 24-hour Open-Meteo forecast for {location.label}...</span>
        </div>
      ) : (
        <>
          {/* Bar Chart Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hourly Temperature & Projected Fuel Penalty — {location.label}
                </h3>
                <p className="text-xs text-slate-500">
                  Blue bars show ambient temperature (°C); amber highlights indicate hours with weather-induced fuel penalties.
                </p>
              </div>
              <div className="text-xs font-mono tabular-nums text-slate-500">
                Next {points.length} hours
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-5 text-white">
              <div className="h-44 flex items-end gap-1.5 pt-6 border-b border-slate-800">
                {points.map((pt, idx) => {
                  const pct = Math.max(12, Math.round(((pt.temperatureC - minTemp) / tempRange) * 100));
                  const hasPenalty = pt.estimatedFuelPenaltyPct > 0;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 group"
                      title={`${pt.hourLabel}: ${pt.temperatureC.toFixed(1)}°C | ${pt.weatherLabel} | Fuel delta +${pt.estimatedFuelPenaltyPct}%`}
                    >
                      <span className="text-[10px] font-mono tabular-nums text-slate-400 hidden md:block">
                        {pt.temperatureC.toFixed(0)}°
                      </span>
                      <div
                        className={`w-full rounded-t transition-opacity ${
                          hasPenalty ? 'bg-amber-400/90' : 'bg-blue-500/85'
                        } group-hover:opacity-100 opacity-85`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between text-[10px] font-mono tabular-nums text-slate-400 pt-2">
                {points
                  .filter((_, i) => i % 3 === 0)
                  .map((pt, idx) => (
                    <span key={idx}>{pt.hourLabel}</span>
                  ))}
              </div>
            </div>
          </div>

          {/* Hourly Telemetry Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              Hourly Departure Window Breakdown
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Hour</th>
                    <th className="py-2.5 px-3 font-semibold">Condition</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Temp</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Precip</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Wind</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Visibility</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Speed Adj.</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Fuel Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {points.map((pt, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-mono tabular-nums font-semibold text-slate-900">
                        {pt.hourLabel}
                      </td>
                      <td className="py-2 px-3 text-slate-700">{pt.weatherLabel}</td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-800">
                        {pt.temperatureC.toFixed(1)}°C
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">
                        {pt.precipitationMm.toFixed(1)} mm
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">
                        {pt.windSpeedKmh.toFixed(0)} km/h
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">
                        {(pt.visibilityM / 1000).toFixed(1)} km
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-mono tabular-nums font-medium ${
                          pt.recommendedSpeedFactorPct < 0 ? 'text-amber-700' : 'text-slate-500'
                        }`}
                      >
                        {pt.recommendedSpeedFactorPct === 0
                          ? '0%'
                          : `${pt.recommendedSpeedFactorPct}%`}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-mono tabular-nums font-medium ${
                          pt.estimatedFuelPenaltyPct > 0 ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        +{pt.estimatedFuelPenaltyPct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
