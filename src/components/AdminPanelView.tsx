import React, { useState } from 'react';
import { Activity, Download, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';
import {
  clearSavedTrips,
  listAllUsers,
  updateUserRole,
} from '../services/authStore';
import { formatDuration } from '../services/physicsEngine';
import type { AppUser, SavedTripRecord, UserRole } from '../types/routing';

interface AdminPanelViewProps {
  currentUser: AppUser | null;
  tripHistory: SavedTripRecord[];
  onTripHistoryChanged: (trips: SavedTripRecord[]) => void;
  onSessionUserUpdated: (user: AppUser) => void;
  onOpenAuth: () => void;
}

interface EndpointHealth {
  name: string;
  endpoint: string;
  status: 'Idle' | 'Checking' | 'Operational' | 'Error';
  latencyMs: number | null;
  detail: string;
}

const INITIAL_ENDPOINTS: EndpointHealth[] = [
  {
    name: 'OpenStreetMap Nominatim',
    endpoint: 'https://nominatim.openstreetmap.org/search?format=json&q=Austin&limit=1',
    status: 'Idle',
    latencyMs: null,
    detail: 'Address geocoding & reverse lookup',
  },
  {
    name: 'Project OSRM Driving API',
    endpoint:
      'https://router.project-osrm.org/route/v1/driving/-97.7431,30.2672;-96.7970,32.7767?overview=false',
    status: 'Idle',
    latencyMs: null,
    detail: 'Multi-route road geometry & travel duration',
  },
  {
    name: 'Open-Meteo Forecast API',
    endpoint:
      'https://api.open-meteo.com/v1/forecast?latitude=30.2672&longitude=-97.7431&current=temperature_2m',
    status: 'Idle',
    latencyMs: null,
    detail: 'Live temperature, precipitation, wind & visibility',
  },
];

export function AdminPanelView({
  currentUser,
  tripHistory,
  onTripHistoryChanged,
  onSessionUserUpdated,
  onOpenAuth,
}: AdminPanelViewProps) {
  const [users, setUsers] = useState<AppUser[]>(() => listAllUsers());
  const [endpoints, setEndpoints] = useState<EndpointHealth[]>(INITIAL_ENDPOINTS);
  const [checkingAll, setCheckingAll] = useState(false);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
        <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Administrator Access Required</h2>
        <p className="text-sm text-slate-600">
          Sign in with an Admin account (such as <span className="font-mono">admin@traffic.gov</span>) to access API health diagnostics, user role management, and system-wide trip audit logs.
        </p>
        <button
          type="button"
          onClick={onOpenAuth}
          className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Sign In as Admin
        </button>
      </div>
    );
  }

  const runHealthChecks = async () => {
    setCheckingAll(true);
    setEndpoints((prev) => prev.map((e) => ({ ...e, status: 'Checking', latencyMs: null })));

    const results = await Promise.all(
      INITIAL_ENDPOINTS.map(async (ep) => {
        const started = performance.now();
        try {
          const res = await fetch(ep.endpoint);
          const latency = Math.round(performance.now() - started);
          return {
            ...ep,
            status: res.ok ? ('Operational' as const) : ('Error' as const),
            latencyMs: latency,
          };
        } catch {
          return {
            ...ep,
            status: 'Error' as const,
            latencyMs: Math.round(performance.now() - started),
          };
        }
      })
    );

    setEndpoints(results);
    setCheckingAll(false);
  };

  const handleRoleToggle = (userId: string, nextRole: UserRole) => {
    const updated = updateUserRole(userId, nextRole);
    setUsers(updated);
    const updatedSelf = updated.find((u) => u.id === currentUser.id);
    if (updatedSelf) {
      onSessionUserUpdated(updatedSelf);
    }
  };

  const handleExportCsv = () => {
    if (tripHistory.length === 0) return;
    const header = [
      'Timestamp',
      'User',
      'Origin',
      'Destination',
      'Route',
      'Vehicle',
      'Weather',
      'Distance_km',
      'Duration_sec',
      'Fuel_L',
      'Cost',
    ];
    const rows = tripHistory.map((t) => [
      t.createdAt,
      t.userName,
      `"${t.originLabel.replace(/"/g, '""')}"`,
      `"${t.destinationLabel.replace(/"/g, '""')}"`,
      `"${t.routeSummary.replace(/"/g, '""')}"`,
      `"${t.vehicleName}"`,
      `"${t.weatherCondition}"`,
      t.distanceKm.toFixed(2),
      Math.round(t.durationSec),
      t.fuelL.toFixed(2),
      `${t.currencySymbol}${t.cost.toFixed(2)}`,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `routefuel-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Admin & System Console</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Verify live external data feeds, manage User/Admin roles, and export trip prediction records.
          </p>
        </div>
        <button
          type="button"
          onClick={runHealthChecks}
          disabled={checkingAll}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checkingAll ? 'animate-spin' : ''}`} />
          <span>{checkingAll ? 'Testing Endpoints...' : 'Run Live API Health Check'}</span>
        </button>
      </div>

      {/* External API Health Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-600" />
          <h3 className="text-base font-bold text-slate-900">External Data Source Diagnostics</h3>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Service</th>
                <th className="py-2.5 px-3 font-semibold">Purpose</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Response Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {endpoints.map((ep) => (
                <tr key={ep.name} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{ep.name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{ep.detail}</td>
                  <td
                    className={`py-2.5 px-3 font-semibold ${
                      ep.status === 'Operational'
                        ? 'text-emerald-700'
                        : ep.status === 'Error'
                        ? 'text-rose-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {ep.status}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800">
                    {ep.latencyMs !== null ? `${ep.latencyMs} ms` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User & Role Management */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <h3 className="text-base font-bold text-slate-900">Registered Accounts & Roles</h3>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Name</th>
                <th className="py-2.5 px-3 font-semibold">Email</th>
                <th className="py-2.5 px-3 font-semibold">Current Role</th>
                <th className="py-2.5 px-3 font-semibold text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{u.name}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{u.email}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{u.role}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        handleRoleToggle(u.id, u.role === 'ADMIN' ? 'USER' : 'ADMIN')
                      }
                      className="px-3 py-1 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Switch to {u.role === 'ADMIN' ? 'USER' : 'ADMIN'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Trip Audit Log */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              System Trip & Fuel Audit Log ({tripHistory.length})
            </h3>
            <p className="text-xs text-slate-500">
              All route optimization runs persisted locally across User and Admin sessions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={tripHistory.length === 0}
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
            <button
              type="button"
              disabled={tripHistory.length === 0}
              onClick={() => onTripHistoryChanged(clearSavedTrips())}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Logs</span>
            </button>
          </div>
        </div>

        {tripHistory.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No trip calculations recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">User</th>
                  <th className="py-2.5 px-3 font-semibold">Trip</th>
                  <th className="py-2.5 px-3 font-semibold">Vehicle</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Distance</th>
                  <th className="py-2.5 px-3 font-semibold text-right">ETA</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Fuel</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tripHistory.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{t.userName}</td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {t.originLabel} → {t.destinationLabel}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{t.vehicleName}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {t.distanceKm.toFixed(1)} km
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {formatDuration(t.durationSec)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700">
                      {t.fuelL.toFixed(2)} L
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                      {t.currencySymbol}
                      {t.cost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
