import React from 'react';
import { CURRENCY_OPTIONS, VEHICLE_PROFILES } from '../services/physicsEngine';

export function PhysicsMethodologyView() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-slate-900">
          Physics-Informed Fuel & Weather-Coupled Routing Architecture
        </h2>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed max-w-3xl">
          Every metric in the route optimizer is computed client-side from live OpenStreetMap OSRM driving geometries and Open-Meteo atmospheric observations without static lookup tables or synthetic route stubs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h3 className="text-base font-bold text-slate-900">
            01. Real-World Fuel Consumption Formula
          </h3>
          <div className="p-3.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs leading-relaxed">
            <div>Adjusted_km_per_L = Baseline_km_per_L / (1 + Σ Fuel_Penalties)</div>
            <div className="mt-1">Fuel_Required_L = Route_Distance_km / Adjusted_km_per_L</div>
            <div className="mt-1">Trip_Cost = Fuel_Required_L × Fuel_Price_per_L</div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            For a standard 300 km highway trip in a Sedan averaging 13.5 km/L under clear conditions, base consumption evaluates to 22.22 L. Adverse rain, headwinds, or heavy AC load increase the penalty denominator and dynamically raise required liters and cost.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h3 className="text-base font-bold text-slate-900">
            02. Vector Headwind & Safety Speed Coupling
          </h3>
          <div className="p-3.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs leading-relaxed">
            <div>Headwind_kmh = WindSpeed × cos(WindFromDeg − RouteBearingDeg)</div>
            <div className="mt-1">Safe_Speed = Base_Avg_Speed × (1 + Σ Speed_Adjustments)</div>
            <div className="mt-1">Adjusted_ETA = Base_OSRM_Duration / Speed_Multiplier</div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Weather is sampled across Origin, Route Midpoint, and Destination via Open-Meteo. Visibility drops below 2 km or heavy precipitation apply a safety speed reduction (up to −35%), recalculating realistic ETA alongside aerodynamic drag.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          03. Calibrated Vehicle Category Baselines
        </h3>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Category</th>
                <th className="py-2.5 px-4 font-semibold">Typical Real-World Range</th>
                <th className="py-2.5 px-4 font-semibold text-right">Default Efficiency</th>
                <th className="py-2.5 px-4 font-semibold text-right">Equivalent L/100km</th>
                <th className="py-2.5 px-4 font-semibold text-right">Aero Drag Multiplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.values(VEHICLE_PROFILES).map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{v.name}</td>
                  <td className="py-2.5 px-4 text-slate-600">{v.typicalRangeLabel}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800">
                    {v.defaultKmPerL.toFixed(1)} km/L
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                    {(100 / v.defaultKmPerL).toFixed(2)} L/100km
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800">
                    {v.dragCoefficientFactor.toFixed(2)}×
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-slate-500 pt-1">
          Supported currencies: {CURRENCY_OPTIONS.map((c) => `${c.code} (${c.symbol})`).join(' · ')} · External APIs: OpenStreetMap Nominatim, Project OSRM, Open-Meteo Forecast.
        </div>
      </div>
    </div>
  );
}
