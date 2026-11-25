import React from 'react';
import { Check, Clock, Fuel, Gauge, Navigation } from 'lucide-react';
import type { AnalyzedRoute } from '../types/routing';
import { formatDuration } from '../services/physicsEngine';

interface RouteComparisonCardsProps {
  routes: AnalyzedRoute[];
  selectedRouteIndex: number;
  onSelectRoute: (index: number) => void;
  currencySymbol: string;
}

export function RouteComparisonCards({
  routes,
  selectedRouteIndex,
  onSelectRoute,
  currencySymbol,
}: RouteComparisonCardsProps) {
  if (routes.length === 0) return null;

  const maxCost = Math.max(...routes.map((r) => r.totalCost));
  const maxFuel = Math.max(...routes.map((r) => r.fuelRequiredL));
  const maxTime = Math.max(...routes.map((r) => r.adjustedDurationSec));

  return (
    <section aria-label="Detected driving routes comparison" className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Detected Driving Routes ({routes.length})
          </h2>
          <p className="text-xs text-slate-500">
            Click any route card or map polyline to inspect its weather-adjusted fuel and speed breakdown.
          </p>
        </div>
        <div className="text-xs text-slate-500 tabular-nums">
          OSRM live corridor geometry · Open-Meteo weather coupled
        </div>
      </div>

      <div
        className={`grid gap-4 ${
          routes.length === 1
            ? 'grid-cols-1'
            : routes.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
        }`}
      >
        {routes.map((route) => {
          const isSelected = route.index === selectedRouteIndex;
          const fuelSaved = maxFuel - route.fuelRequiredL;
          const costSaved = maxCost - route.totalCost;
          const timeSavedMin = Math.round((maxTime - route.adjustedDurationSec) / 60);

          let highlightTag = 'Alternative Corridor';
          let highlightColor = 'text-slate-600';
          if (route.isEconomical && route.isFastest) {
            highlightTag = 'Fastest & Most Economical';
            highlightColor = 'text-emerald-700';
          } else if (route.isEconomical) {
            highlightTag = 'Most Economical Route';
            highlightColor = 'text-emerald-700';
          } else if (route.isFastest) {
            highlightTag = 'Fastest Route';
            highlightColor = 'text-blue-700';
          }

          return (
            <button
              key={route.index}
              type="button"
              onClick={() => onSelectRoute(route.index)}
              className={`text-left w-full rounded-xl border p-5 transition-all cursor-pointer bg-white ${
                isSelected
                  ? 'border-slate-900 ring-1 ring-slate-900 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Top Kicker & Selection Indicator */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={`text-xs font-semibold ${highlightColor}`}>
                    {highlightTag}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5 truncate">
                    {route.label} · {route.summary}
                  </h3>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  <span>{isSelected ? 'Active' : 'Inspect'}</span>
                </span>
              </div>

              {/* Primary KPIs: Fuel & Cost vs Duration */}
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
                <div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-slate-400" />
                    <span>Fuel</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    {route.fuelRequiredL.toFixed(2)} L
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-500">Trip Cost</div>
                  <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    {currencySymbol}
                    {route.totalCost.toFixed(2)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>ETA</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    {formatDuration(route.adjustedDurationSec)}
                  </div>
                </div>
              </div>

              {/* Secondary Engineering Telemetry */}
              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <div className="text-slate-500 flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-slate-400" />
                    <span>Distance</span>
                  </div>
                  <div className="font-mono font-medium text-slate-800 tabular-nums mt-0.5">
                    {route.distanceKm.toFixed(1)} km
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-slate-400" />
                    <span>Safe Speed</span>
                  </div>
                  <div className="font-mono font-medium text-slate-800 tabular-nums mt-0.5">
                    {route.safeSpeedKmh.toFixed(0)} km/h
                  </div>
                </div>

                <div>
                  <div className="text-slate-500">Adj. Avg</div>
                  <div className="font-mono font-medium text-slate-800 tabular-nums mt-0.5">
                    {route.adjustedKmPerL.toFixed(1)} km/L
                  </div>
                </div>
              </div>

              {/* Relative Comparison Delta */}
              {routes.length > 1 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 tabular-nums">
                  {route.isEconomical && fuelSaved > 0.01 ? (
                    <span className="font-semibold text-emerald-700">
                      Saves {fuelSaved.toFixed(2)} L ({currencySymbol}
                      {costSaved.toFixed(2)}) vs highest-burn route
                    </span>
                  ) : (
                    <span>
                      +{(route.fuelRequiredL - Math.min(...routes.map((r) => r.fuelRequiredL))).toFixed(2)} L vs most economical
                    </span>
                  )}
                  <span aria-hidden="true">·</span>
                  {route.isFastest && timeSavedMin > 0 ? (
                    <span className="font-semibold text-blue-700">
                      {timeSavedMin} min faster
                    </span>
                  ) : (
                    <span>
                      +{Math.round((route.adjustedDurationSec - Math.min(...routes.map((r) => r.adjustedDurationSec))) / 60)} min vs fastest
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
