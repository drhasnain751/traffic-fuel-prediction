import React from 'react';
import {
  ArrowRight,
  CloudRain,
  Cpu,
  Fuel,
  Map,
  ShieldCheck,
} from 'lucide-react';
import type { AnalyzedRoute, AppUser, SavedTripRecord } from '../types/routing';
import { formatDuration } from '../services/physicsEngine';

export type PageId = 'overview' | 'optimizer' | 'trends' | 'methodology' | 'admin';

interface OverviewHomeViewProps {
  currentUser: AppUser | null;
  activeRoute: AnalyzedRoute | null;
  detectedRouteCount: number;
  currencySymbol: string;
  vehicleName: string;
  tripHistory: SavedTripRecord[];
  onNavigate: (page: PageId) => void;
  onOpenAuth: () => void;
}

export function OverviewHomeView({
  currentUser,
  activeRoute,
  detectedRouteCount,
  currencySymbol,
  vehicleName,
  tripHistory,
  onNavigate,
  onOpenAuth,
}: OverviewHomeViewProps) {
  const userTrips = currentUser
    ? currentUser.role === 'ADMIN'
      ? tripHistory
      : tripHistory.filter((t) => t.userId === currentUser.id)
    : tripHistory;

  return (
    <div className="space-y-6">
      {/* Hero Summary Banner */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-medium text-slate-500">
            {currentUser
              ? `Signed in as ${currentUser.name} · ${currentUser.role === 'ADMIN' ? 'Administrator' : 'Commuter User'}`
              : 'Open Workspace Preview · Sign in as User or Admin for saved logs & diagnostics'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Smart Traffic, Weather & Fuel Optimization Platform
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Real-time OpenStreetMap OSRM multi-route detection coupled with live Open-Meteo atmospheric telemetry and physics-calibrated vehicle consumption modeling.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {!currentUser && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In / Register
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('optimizer')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Open Route Optimizer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 4-Column Live System KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-semibold text-slate-500">Active Route Corridors</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {detectedRouteCount > 0 ? `${detectedRouteCount} Detected` : 'Loading...'}
          </div>
          <div className="text-xs text-slate-500 mt-1 truncate">
            {activeRoute ? `${activeRoute.distanceKm.toFixed(1)} km · ${activeRoute.summary}` : 'OSRM live routing'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-semibold text-slate-500">Latest Fuel Estimate</div>
          <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
            {activeRoute ? `${activeRoute.fuelRequiredL.toFixed(2)} L` : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            {activeRoute
              ? `${currencySymbol}${activeRoute.totalCost.toFixed(2)} · ${activeRoute.adjustedKmPerL.toFixed(1)} km/L adj.`
              : vehicleName}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-semibold text-slate-500">Route Weather Impact</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 truncate">
            {activeRoute ? activeRoute.weatherSummary.dominantCondition : 'Fetching...'}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            {activeRoute
              ? `${activeRoute.weatherSummary.avgTempC.toFixed(1)}°C · ${
                  activeRoute.totalFuelPenaltyPct >= 0 ? '+' : ''
                }${activeRoute.totalFuelPenaltyPct.toFixed(1)}% fuel delta`
              : 'Open-Meteo live'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-semibold text-slate-500">Logged Trip Analyses</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {userTrips.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {currentUser?.role === 'ADMIN' ? 'System-wide audit records' : 'Saved session route evaluations'}
          </div>
        </div>
      </section>

      {/* System Modules Directory */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">System Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => onNavigate('optimizer')}
            className="text-left bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-5 transition-colors cursor-pointer flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <Map className="w-5 h-5 text-slate-700" />
              <div className="text-base font-bold text-slate-900">Route Optimizer</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                GPS origin detection, custom address search, multi-route Leaflet map, and Economical vs. Fastest route comparison.
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-900">Launch Map →</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('trends')}
            className="text-left bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-5 transition-colors cursor-pointer flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <CloudRain className="w-5 h-5 text-slate-700" />
              <div className="text-base font-bold text-slate-900">Weather & Trends</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                24-hour live Open-Meteo atmospheric forecast showing hourly visibility, wind, and projected fuel penalties.
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-900">View Forecast →</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('methodology')}
            className="text-left bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-5 transition-colors cursor-pointer flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <Cpu className="w-5 h-5 text-slate-700" />
              <div className="text-base font-bold text-slate-900">Physics & Model</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inspect aerodynamic headwind projection, rolling-resistance equations, safety speed rules, and vehicle baselines.
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-900">Inspect Equations →</div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (currentUser?.role === 'ADMIN') {
                onNavigate('admin');
              } else {
                onOpenAuth();
              }
            }}
            className="text-left bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-5 transition-colors cursor-pointer flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <ShieldCheck className="w-5 h-5 text-slate-700" />
              <div className="text-base font-bold text-slate-900">Admin Console</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Live API latency diagnostics, user role management (User / Admin), and exportable system trip audit logs.
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-900">
              {currentUser?.role === 'ADMIN' ? 'Open Admin Panel →' : 'Sign In as Admin →'}
            </div>
          </button>
        </div>
      </section>

      {/* Recent Trip History Table */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Route & Fuel Predictions</h2>
            <p className="text-xs text-slate-500">
              Automatically logged whenever a live route analysis completes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('optimizer')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>Analyze New Trip</span>
          </button>
        </div>

        {userTrips.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No trip calculations saved yet. Open the Route Optimizer to analyze your first trip.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Origin → Destination</th>
                  <th className="py-2.5 px-3 font-semibold">Vehicle</th>
                  <th className="py-2.5 px-3 font-semibold">Weather</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Distance</th>
                  <th className="py-2.5 px-3 font-semibold text-right">ETA</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Fuel</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userTrips.slice(0, 8).map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {trip.originLabel} → {trip.destinationLabel}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{trip.vehicleName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{trip.weatherCondition}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800">
                      {trip.distanceKm.toFixed(1)} km
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                      {formatDuration(trip.durationSec)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700">
                      {trip.fuelL.toFixed(2)} L
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {trip.currencySymbol}
                      {trip.cost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
