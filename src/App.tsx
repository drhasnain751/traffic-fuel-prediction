import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpDown,
  Crosshair,
  Fuel,
  Loader2,
  LogOut,
  Navigation,
  RefreshCw,
} from 'lucide-react';
import { AddressSearchInput } from './components/AddressSearchInput';
import { AdminPanelView } from './components/AdminPanelView';
import { AuthModal } from './components/AuthModal';
import { CalculationBreakdown } from './components/CalculationBreakdown';
import { OverviewHomeView, type PageId } from './components/OverviewHomeView';
import { PhysicsMethodologyView } from './components/PhysicsMethodologyView';
import { RouteComparisonCards } from './components/RouteComparisonCards';
import { RouteMap } from './components/RouteMap';
import { ToastContainer, type ToastMessage } from './components/UIComponents';
import { WeatherTrendsView } from './components/WeatherTrendsView';
import {
  getSavedSession,
  getSavedTrips,
  recordTripPrediction,
  saveSession,
} from './services/authStore';
import { detectCurrentLocation, reverseGeocode } from './services/geocoding';
import {
  analyzeRoutes,
  CURRENCY_OPTIONS,
  kmPerLToLPer100Km,
  lPer100KmToKmPerL,
  VEHICLE_PROFILES,
} from './services/physicsEngine';
import { extractRouteMidpoint, fetchDrivingRoutes } from './services/routing';
import { fetchRouteWeather } from './services/weather';
import type {
  AppUser,
  Coordinates,
  EfficiencyUnit,
  RawOsrmRoute,
  SavedTripRecord,
  VehicleCategoryId,
  WeatherScenario,
  WeatherWaypoint,
} from './types/routing';

const DEFAULT_ORIGIN: Coordinates = {
  lat: 30.2672,
  lon: -97.7431,
  label: 'Austin, Texas',
};

const DEFAULT_DESTINATION: Coordinates = {
  lat: 32.7767,
  lon: -96.797,
  label: 'Dallas, Texas',
};

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('overview');

  // Auth & trip history state
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getSavedSession());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [tripHistory, setTripHistory] = useState<SavedTripRecord[]>(() => getSavedTrips());

  // Route endpoints
  const [origin, setOrigin] = useState<Coordinates | null>(DEFAULT_ORIGIN);
  const [destination, setDestination] = useState<Coordinates | null>(DEFAULT_DESTINATION);
  const [mapPickMode, setMapPickMode] = useState<'origin' | 'destination' | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Vehicle & Fuel configuration
  const [vehicleId, setVehicleId] = useState<VehicleCategoryId>('sedan');
  const [efficiencyUnit, setEfficiencyUnit] = useState<EfficiencyUnit>('km_per_l');
  const [baselineKmPerL, setBaselineKmPerL] = useState<number>(
    VEHICLE_PROFILES.sedan.defaultKmPerL
  );
  const [currencyCode, setCurrencyCode] = useState<string>('USD');
  const [fuelPricePerL, setFuelPricePerL] = useState<number>(1.55);

  // Live API data state
  const [rawRoutes, setRawRoutes] = useState<RawOsrmRoute[]>([]);
  const [liveWeather, setLiveWeather] = useState<WeatherWaypoint[]>([]);
  const [weatherScenario, setWeatherScenario] = useState<WeatherScenario>('live');
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);

  const [loadingRoutes, setLoadingRoutes] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const lastLoggedRouteKeyRef = useRef<string>('');

  const addToast = useCallback(
    (type: 'success' | 'error' | 'info', title: string, message?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const currentVehicle = VEHICLE_PROFILES[vehicleId];
  const currentCurrency =
    CURRENCY_OPTIONS.find((c) => c.code === currencyCode) || CURRENCY_OPTIONS[0];

  const loadLiveRouteAndWeather = useCallback(
    async (orig: Coordinates, dest: Coordinates) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setLoadingRoutes(true);
      setRouteError(null);

      try {
        const fetchedRoutes = await fetchDrivingRoutes(orig, dest, controller.signal);
        const primary = fetchedRoutes[0];
        const midpoint = extractRouteMidpoint(primary.coordinates);

        let weatherPoints: WeatherWaypoint[] = [];
        try {
          weatherPoints = await fetchRouteWeather(
            [
              { label: 'Origin', lat: orig.lat, lon: orig.lon },
              { label: 'Midpoint', lat: midpoint.lat, lon: midpoint.lon },
              { label: 'Destination', lat: dest.lat, lon: dest.lon },
            ],
            controller.signal
          );
        } catch (weatherErr: any) {
          if (weatherErr?.name === 'AbortError') throw weatherErr;
          addToast(
            'info',
            'Weather Telemetry Unavailable',
            'Using neutral atmospheric defaults while OSRM routing remains live.'
          );
          weatherPoints = [
            {
              locationLabel: 'Origin',
              lat: orig.lat,
              lon: orig.lon,
              temperatureC: 20,
              apparentTempC: 20,
              humidityPct: 50,
              precipitationMm: 0,
              rainMm: 0,
              snowfallCm: 0,
              weatherCode: 0,
              weatherLabel: 'Clear (Fallback)',
              windSpeedKmh: 8,
              windDirectionDeg: 0,
              visibilityM: 10000,
              observedAt: new Date().toISOString(),
            },
          ];
        }

        setRawRoutes(fetchedRoutes);
        setLiveWeather(weatherPoints);
        setSelectedRouteIndex(fetchedRoutes[0]?.index ?? 0);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setRawRoutes([]);
        setRouteError(err?.message || 'Unable to fetch driving routes.');
        addToast('error', 'Route Lookup Failed', err?.message || 'Please check endpoints.');
      } finally {
        setLoadingRoutes(false);
      }
    },
    [addToast]
  );

  // Trigger live route + weather fetch when origin or destination changes
  useEffect(() => {
    if (origin && destination) {
      loadLiveRouteAndWeather(origin, destination);
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [origin, destination, loadLiveRouteAndWeather]);

  // Compute analyzed routes dynamically whenever vehicle/fuel/weather scenario updates
  const analyzedRoutes = useMemo(() => {
    if (!origin || !destination || rawRoutes.length === 0 || liveWeather.length === 0) {
      return [];
    }
    return analyzeRoutes(
      rawRoutes,
      origin,
      destination,
      liveWeather,
      baselineKmPerL,
      fuelPricePerL,
      currentVehicle,
      weatherScenario
    );
  }, [
    rawRoutes,
    origin,
    destination,
    liveWeather,
    baselineKmPerL,
    fuelPricePerL,
    currentVehicle,
    weatherScenario,
  ]);

  const activeRoute =
    analyzedRoutes.find((r) => r.index === selectedRouteIndex) || analyzedRoutes[0] || null;

  // Record a new trip evaluation once per origin/destination fetch
  useEffect(() => {
    if (!origin || !destination || !activeRoute) return;
    const key = `${origin.lat.toFixed(4)},${origin.lon.toFixed(4)}->${destination.lat.toFixed(
      4
    )},${destination.lon.toFixed(4)}`;
    if (lastLoggedRouteKeyRef.current === key) return;
    lastLoggedRouteKeyRef.current = key;

    const updated = recordTripPrediction({
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Guest Evaluator',
      originLabel: origin.label,
      destinationLabel: destination.label,
      routeSummary: activeRoute.summary,
      distanceKm: activeRoute.distanceKm,
      durationSec: activeRoute.adjustedDurationSec,
      fuelL: activeRoute.fuelRequiredL,
      cost: activeRoute.totalCost,
      currencySymbol: currentCurrency.symbol,
      vehicleName: currentVehicle.name,
      weatherCondition: activeRoute.weatherSummary.dominantCondition,
    });
    setTripHistory(updated);
  }, [
    origin,
    destination,
    activeRoute,
    currentUser,
    currentCurrency.symbol,
    currentVehicle.name,
  ]);

  const handleUseGpsOrigin = async () => {
    setGpsLoading(true);
    try {
      const coords = await detectCurrentLocation();
      setOrigin(coords);
      setMapPickMode(null);
      setActivePage('optimizer');
      addToast('success', 'GPS Location Detected', `Origin set to ${coords.label}`);
    } catch (err: any) {
      addToast('error', 'GPS Detection Failed', err?.message || 'Location access denied.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleMapClickCoordinate = useCallback(
    async (lat: number, lon: number) => {
      const mode = mapPickMode;
      if (!mode) return;
      setMapPickMode(null);

      const label = await reverseGeocode(lat, lon);
      const picked: Coordinates = { lat, lon, label };
      if (mode === 'origin') {
        setOrigin(picked);
        addToast('info', 'Origin Updated', label);
      } else {
        setDestination(picked);
        addToast('info', 'Destination Updated', label);
      }
    },
    [mapPickMode, addToast]
  );

  const handleSwapEndpoints = () => {
    if (!origin && !destination) return;
    const prevOrigin = origin;
    setOrigin(destination);
    setDestination(prevOrigin);
  };

  const handleVehicleCategoryChange = (newId: VehicleCategoryId) => {
    setVehicleId(newId);
    setBaselineKmPerL(VEHICLE_PROFILES[newId].defaultKmPerL);
  };

  const handleCurrencyChange = (newCode: string) => {
    setCurrencyCode(newCode);
    const opt = CURRENCY_OPTIONS.find((c) => c.code === newCode);
    if (opt) {
      setFuelPricePerL(opt.defaultPricePerLiter);
    }
  };

  const handleSignOut = () => {
    saveSession(null);
    setCurrentUser(null);
    if (activePage === 'admin') {
      setActivePage('overview');
    }
    addToast('info', 'Signed Out', 'You are now viewing in open guest mode.');
  };

  const displayedEfficiencyValue =
    efficiencyUnit === 'km_per_l'
      ? Number(baselineKmPerL.toFixed(1))
      : Number(kmPerLToLPer100Km(baselineKmPerL).toFixed(1));

  const handleEfficiencyInputChange = (valStr: string) => {
    const parsed = parseFloat(valStr);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    if (efficiencyUnit === 'km_per_l') {
      setBaselineKmPerL(Math.min(40, Math.max(2, parsed)));
    } else {
      setBaselineKmPerL(Math.min(40, Math.max(2, lPer100KmToKmPerL(parsed))));
    }
  };

  const navLinks: Array<{ id: PageId; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'optimizer', label: 'Route Optimizer' },
    { id: 'trends', label: 'Weather & Trends' },
    { id: 'methodology', label: 'Physics Model' },
    ...(currentUser?.role === 'ADMIN' ? [{ id: 'admin' as PageId, label: 'Admin' }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={(user) => {
          setCurrentUser(user);
          addToast(
            'success',
            'Signed In',
            `Welcome, ${user.name} (${user.role === 'ADMIN' ? 'Administrator' : 'User'})`
          );
        }}
      />

      {/* Top Bar Contract: [Brand wordmark] — [4–5 concise single-line nav links] — [1 Primary Action / Account] */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          <a
            href="#overview"
            onClick={(e) => {
              e.preventDefault();
              setActivePage('overview');
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            RouteFuel
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => setActivePage(link.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                  activePage === link.id
                    ? 'text-slate-900 border-slate-900 font-semibold'
                    : 'text-slate-500 border-transparent hover:text-slate-900'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-xs font-medium text-slate-600 whitespace-nowrap">
                  {currentUser.name} · {currentUser.role}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sign In / Sign Up
              </button>
            )}
          </div>
        </div>

        {/* Mobile sub-navigation strip */}
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center gap-4 overflow-x-auto text-xs font-medium"
        >
          {navLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => setActivePage(link.id)}
              className={`py-1 whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                activePage === link.id
                  ? 'text-slate-900 border-slate-900 font-semibold'
                  : 'text-slate-500 border-transparent'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {activePage === 'overview' && (
          <OverviewHomeView
            currentUser={currentUser}
            activeRoute={activeRoute}
            detectedRouteCount={analyzedRoutes.length}
            currencySymbol={currentCurrency.symbol}
            vehicleName={currentVehicle.name}
            tripHistory={tripHistory}
            onNavigate={setActivePage}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {activePage === 'trends' && (
          <WeatherTrendsView defaultLocation={origin || DEFAULT_ORIGIN} />
        )}

        {activePage === 'methodology' && <PhysicsMethodologyView />}

        {activePage === 'admin' && (
          <AdminPanelView
            currentUser={currentUser}
            tripHistory={tripHistory}
            onTripHistoryChanged={setTripHistory}
            onSessionUserUpdated={setCurrentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {activePage === 'optimizer' && (
          <>
            {/* Upper Workspace: Trip & Vehicle Config (4 cols) + Interactive Live Map (8 cols) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Configuration Rail */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h1 className="text-base font-bold text-slate-900">
                        Trip & Vehicle Setup
                      </h1>
                      <p className="text-xs text-slate-500">
                        Live Nominatim geocoding · OSRM multi-route engine
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSwapEndpoints}
                      title="Swap Origin and Destination"
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </div>

                  <AddressSearchInput
                    id="origin-input"
                    label="Origin Address"
                    placeholder="Search city, street, or use GPS..."
                    value={origin}
                    onSelect={setOrigin}
                    onUseGps={handleUseGpsOrigin}
                    gpsLoading={gpsLoading}
                    isPickingOnMap={mapPickMode === 'origin'}
                    onToggleMapPick={() =>
                      setMapPickMode((m) => (m === 'origin' ? null : 'origin'))
                    }
                  />

                  <AddressSearchInput
                    id="destination-input"
                    label="Destination Address"
                    placeholder="Search destination address..."
                    value={destination}
                    onSelect={setDestination}
                    isPickingOnMap={mapPickMode === 'destination'}
                    onToggleMapPick={() =>
                      setMapPickMode((m) => (m === 'destination' ? null : 'destination'))
                    }
                  />

                  {/* Vehicle Category & Efficiency */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="vehicle-select"
                        className="text-xs font-semibold text-slate-700"
                      >
                        Vehicle Category
                      </label>
                      <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                        Typical: {currentVehicle.typicalRangeLabel}
                      </span>
                    </div>

                    <select
                      id="vehicle-select"
                      value={vehicleId}
                      onChange={(e) =>
                        handleVehicleCategoryChange(e.target.value as VehicleCategoryId)
                      }
                      className="block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                    >
                      {Object.values(VEHICLE_PROFILES).map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.typicalRangeLabel})
                        </option>
                      ))}
                    </select>

                    {/* Fine-tune Vehicle Efficiency */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor="efficiency-input"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Vehicle Average ({efficiencyUnit === 'km_per_l' ? 'km/L' : 'L/100km'})
                        </label>
                        <div className="inline-flex p-0.5 bg-slate-100 rounded-md text-[11px]">
                          <button
                            type="button"
                            onClick={() => setEfficiencyUnit('km_per_l')}
                            className={`px-2 py-0.5 rounded font-medium cursor-pointer transition-colors ${
                              efficiencyUnit === 'km_per_l'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            km/L
                          </button>
                          <button
                            type="button"
                            onClick={() => setEfficiencyUnit('l_per_100km')}
                            className={`px-2 py-0.5 rounded font-medium cursor-pointer transition-colors ${
                              efficiencyUnit === 'l_per_100km'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            L/100km
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={currentVehicle.minKmPerL}
                          max={currentVehicle.maxKmPerL}
                          step={0.5}
                          value={baselineKmPerL}
                          onChange={(e) => setBaselineKmPerL(parseFloat(e.target.value))}
                          className="flex-1 accent-slate-900 cursor-pointer"
                        />
                        <input
                          id="efficiency-input"
                          type="number"
                          step="0.1"
                          min="2"
                          max="40"
                          value={displayedEfficiencyValue}
                          onChange={(e) => handleEfficiencyInputChange(e.target.value)}
                          className="w-24 px-2.5 py-2 border border-slate-300 rounded-lg text-sm font-mono tabular-nums text-right bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    {/* Local Fuel Price & Currency */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label
                          htmlFor="currency-select"
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          Currency
                        </label>
                        <select
                          id="currency-select"
                          value={currencyCode}
                          onChange={(e) => handleCurrencyChange(e.target.value)}
                          className="block w-full px-2.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                        >
                          {CURRENCY_OPTIONS.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="fuel-price-input"
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          Fuel Price ({currentCurrency.symbol}/L)
                        </label>
                        <input
                          id="fuel-price-input"
                          type="number"
                          step="0.01"
                          min="0"
                          value={fuelPricePerL}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!Number.isNaN(val) && val >= 0) setFuelPricePerL(val);
                          }}
                          className="block w-full px-2.5 py-2 border border-slate-300 rounded-lg text-sm font-mono tabular-nums text-right bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={gpsLoading}
                    onClick={handleUseGpsOrigin}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {gpsLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Crosshair className="w-3.5 h-3.5" />
                    )}
                    <span>Use Live GPS</span>
                  </button>

                  <button
                    type="button"
                    disabled={!origin || !destination || loadingRoutes}
                    onClick={() => {
                      if (origin && destination) {
                        lastLoggedRouteKeyRef.current = '';
                        loadLiveRouteAndWeather(origin, destination);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {loadingRoutes ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh Routes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right 8 Cols: Live Interactive Map */}
              <div className="lg:col-span-8 flex flex-col gap-3">
                <RouteMap
                  origin={origin}
                  destination={destination}
                  routes={analyzedRoutes}
                  selectedRouteIndex={selectedRouteIndex}
                  onSelectRoute={setSelectedRouteIndex}
                  mapPickMode={mapPickMode}
                  onMapClickCoordinate={handleMapClickCoordinate}
                  currencySymbol={currentCurrency.symbol}
                />

                {/* Compact Selected Route Telemetry Strip */}
                {activeRoute && (
                  <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-slate-400" />
                        <span>Active Route Distance</span>
                      </div>
                      <div className="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                        {activeRoute.distanceKm.toFixed(1)} km
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Fuel className="w-3 h-3 text-slate-400" />
                        <span>Adjusted Fuel Burn</span>
                      </div>
                      <div className="text-base font-bold text-emerald-700 font-mono tabular-nums mt-0.5">
                        {activeRoute.fuelRequiredL.toFixed(2)} L
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-500">Estimated Trip Cost</div>
                      <div className="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                        {currentCurrency.symbol}
                        {activeRoute.totalCost.toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-500">Weather-Safe Speed</div>
                      <div className="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                        {activeRoute.safeSpeedKmh.toFixed(0)} km/h
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Error or Loading State */}
            {routeError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-rose-900">
                <div>
                  <span className="font-semibold">Routing error:</span> {routeError}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (origin && destination) loadLiveRouteAndWeather(origin, destination);
                  }}
                  className="px-3.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-semibold text-rose-800 hover:bg-rose-100 cursor-pointer shrink-0"
                >
                  Retry Request
                </button>
              </div>
            )}

            {loadingRoutes && analyzedRoutes.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 flex items-center justify-center gap-3 text-sm text-slate-600">
                <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
                <span>Querying OSRM driving corridors and Open-Meteo weather telemetry...</span>
              </div>
            )}

            {/* Middle Section: Multi-Route Comparison Cards */}
            {analyzedRoutes.length > 0 && (
              <RouteComparisonCards
                routes={analyzedRoutes}
                selectedRouteIndex={selectedRouteIndex}
                onSelectRoute={setSelectedRouteIndex}
                currencySymbol={currentCurrency.symbol}
              />
            )}

            {/* Lower Section: Active Weather & Transparent Calculation Breakdown */}
            {activeRoute && (
              <CalculationBreakdown
                route={activeRoute}
                fuelPricePerL={fuelPricePerL}
                currencySymbol={currentCurrency.symbol}
                weatherScenario={weatherScenario}
                onChangeWeatherScenario={setWeatherScenario}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
