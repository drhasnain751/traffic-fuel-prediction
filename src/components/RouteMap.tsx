import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { AnalyzedRoute, Coordinates } from '../types/routing';
import { formatDuration } from '../services/physicsEngine';

interface RouteMapProps {
  origin: Coordinates | null;
  destination: Coordinates | null;
  routes: AnalyzedRoute[];
  selectedRouteIndex: number;
  onSelectRoute: (index: number) => void;
  mapPickMode: 'origin' | 'destination' | null;
  onMapClickCoordinate: (lat: number, lon: number) => void;
  currencySymbol: string;
}

function createEndpointIcon(letter: 'A' | 'B', bgColor: string) {
  return L.divIcon({
    className: 'custom-route-marker',
    html: `<div style="
      width: 28px;
      height: 28px;
      border-radius: 9999px;
      background: ${bgColor};
      color: #ffffff;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 700;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2.5px solid #ffffff;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.35);
    ">${letter}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function createWeatherIcon(tempC: number) {
  return L.divIcon({
    className: 'custom-weather-marker',
    html: `<div style="
      padding: 3px 7px;
      border-radius: 6px;
      background: #0f172a;
      color: #f8fafc;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      font-size: 11px;
      white-space: nowrap;
      border: 1.5px solid #ffffff;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.28);
    ">${tempC.toFixed(0)}°C</div>`,
    iconSize: [44, 24],
    iconAnchor: [22, 12],
  });
}

function getRouteStrokeColor(route: AnalyzedRoute): string {
  if (route.isEconomical) return '#059669'; // Emerald for Most Economical
  if (route.isFastest) return '#2563eb'; // Blue for Fastest
  return '#64748b'; // Slate for alternative corridors
}

export function RouteMap({
  origin,
  destination,
  routes,
  selectedRouteIndex,
  onSelectRoute,
  mapPickMode,
  onMapClickCoordinate,
  currencySymbol,
}: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const pickModeRef = useRef(mapPickMode);
  const clickCallbackRef = useRef(onMapClickCoordinate);

  pickModeRef.current = mapPickMode;
  clickCallbackRef.current = onMapClickCoordinate;

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [31.5, -97.2],
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = group;

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (pickModeRef.current) {
        clickCallbackRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Update cursor when picking coordinates on map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    container.style.cursor = mapPickMode ? 'crosshair' : '';
  }, [mapPickMode]);

  // Render markers and multi-route polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    const bounds = L.latLngBounds([]);

    // Draw unselected routes first so selected route stays on top
    const orderedRoutes = [...routes].sort((a, b) => {
      if (a.index === selectedRouteIndex) return 1;
      if (b.index === selectedRouteIndex) return -1;
      return 0;
    });

    orderedRoutes.forEach((route) => {
      if (route.coordinates.length < 2) return;
      const isSelected = route.index === selectedRouteIndex;
      const color = getRouteStrokeColor(route);

      const polyline = L.polyline(route.coordinates, {
        color,
        weight: isSelected ? 6 : 4,
        opacity: isSelected ? 0.95 : 0.55,
        dashArray: isSelected ? undefined : '6 6',
      });

      const roleLabel =
        route.isEconomical && route.isFastest
          ? 'Fastest & Most Economical'
          : route.isEconomical
          ? 'Most Economical'
          : route.isFastest
          ? 'Fastest Route'
          : 'Alternative Route';

      polyline.bindTooltip(
        `<div style="font-family: 'DM Sans', sans-serif; font-size: 12px;">
          <strong>${route.label} (${roleLabel})</strong><br/>
          ${route.distanceKm.toFixed(1)} km · ${formatDuration(route.adjustedDurationSec)}<br/>
          ${route.fuelRequiredL.toFixed(2)} L · ${currencySymbol}${route.totalCost.toFixed(2)}
        </div>`,
        { sticky: true }
      );

      polyline.on('click', () => {
        onSelectRoute(route.index);
      });

      polyline.addTo(group);
      route.coordinates.forEach((pt) => bounds.extend(pt));
    });

    // Midpoint weather badge from selected route
    const selectedRoute = routes.find((r) => r.index === selectedRouteIndex) || routes[0];
    if (selectedRoute && selectedRoute.weatherSummary.waypoints.length >= 2) {
      const midWp = selectedRoute.weatherSummary.waypoints[1];
      const weatherMarker = L.marker([midWp.lat, midWp.lon], {
        icon: createWeatherIcon(midWp.temperatureC),
      });
      weatherMarker.bindPopup(
        `<div>
          <div style="font-weight:700; margin-bottom:4px;">Route Midpoint Weather</div>
          <div>Condition: <strong>${midWp.weatherLabel}</strong></div>
          <div>Temp: ${midWp.temperatureC.toFixed(1)}°C · Wind: ${midWp.windSpeedKmh.toFixed(0)} km/h</div>
          <div>Precip: ${midWp.precipitationMm.toFixed(1)} mm · Vis: ${(midWp.visibilityM / 1000).toFixed(1)} km</div>
        </div>`
      );
      weatherMarker.addTo(group);
    }

    if (origin) {
      const markerA = L.marker([origin.lat, origin.lon], {
        icon: createEndpointIcon('A', '#0f172a'),
      });
      markerA.bindPopup(`<strong>Origin</strong><br/>${origin.label}`);
      markerA.addTo(group);
      bounds.extend([origin.lat, origin.lon]);
    }

    if (destination) {
      const markerB = L.marker([destination.lat, destination.lon], {
        icon: createEndpointIcon('B', '#059669'),
      });
      markerB.bindPopup(`<strong>Destination</strong><br/>${destination.label}`);
      markerB.addTo(group);
      bounds.extend([destination.lat, destination.lon]);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
    }
  }, [origin, destination, routes, selectedRouteIndex, currencySymbol, onSelectRoute]);

  return (
    <div className="relative w-full h-[440px] lg:h-[520px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full" />

      {mapPickMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-slate-900 text-white text-xs font-medium px-3.5 py-2 rounded-lg shadow-md">
          Click anywhere on the map to set {mapPickMode === 'origin' ? 'Origin (A)' : 'Destination (B)'}
        </div>
      )}

      {routes.length > 0 && (
        <div className="absolute bottom-3 left-3 z-[500] bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg px-3 py-2 shadow-sm text-xs text-slate-700 flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-600 rounded-full inline-block" />
            <span>Most Economical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-blue-600 rounded-full inline-block" />
            <span>Fastest</span>
          </div>
          {routes.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-slate-500 rounded-full inline-block" />
              <span>Alternative</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
