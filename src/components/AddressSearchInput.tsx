import React, { useEffect, useRef, useState } from 'react';
import { Crosshair, Loader2, MapPin, Search, X } from 'lucide-react';
import { searchAddresses } from '../services/geocoding';
import type { Coordinates, GeocodingResult } from '../types/routing';

interface AddressSearchInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: Coordinates | null;
  onSelect: (coords: Coordinates) => void;
  onUseGps?: () => void;
  gpsLoading?: boolean;
  isPickingOnMap?: boolean;
  onToggleMapPick?: () => void;
}

export function AddressSearchInput({
  id,
  label,
  placeholder,
  value,
  onSelect,
  onUseGps,
  gpsLoading = false,
  isPickingOnMap = false,
  onToggleMapPick,
}: AddressSearchInputProps) {
  const [query, setQuery] = useState(value?.label || '');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextSearchRef = useRef(false);

  useEffect(() => {
    if (value?.label && value.label !== query) {
      skipNextSearchRef.current = true;
      setQuery(value.label);
    }
  }, [value?.label]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const items = await searchAddresses(trimmed, controller.signal);
        setResults(items);
        setIsOpen(true);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setSearchError('Address search unavailable');
        }
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSelectResult = (item: GeocodingResult) => {
    skipNextSearchRef.current = true;
    setQuery(item.shortName);
    setIsOpen(false);
    setResults([]);
    onSelect({
      lat: item.lat,
      lon: item.lon,
      label: item.shortName,
    });
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) {
        handleSelectResult(results[0]);
      } else if (query.trim().length >= 2) {
        setSearching(true);
        try {
          const items = await searchAddresses(query.trim());
          if (items.length > 0) {
            handleSelectResult(items[0]);
          } else {
            setSearchError('No matching address found');
            setIsOpen(true);
          }
        } catch {
          setSearchError('Unable to geocode address');
        } finally {
          setSearching(false);
        }
      }
    }
  };

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-slate-700">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {onUseGps && (
            <button
              type="button"
              onClick={onUseGps}
              disabled={gpsLoading}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {gpsLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Crosshair className="w-3.5 h-3.5" />
              )}
              <span>{gpsLoading ? 'Locating...' : 'Use GPS'}</span>
            </button>
          )}
          {onToggleMapPick && (
            <button
              type="button"
              onClick={onToggleMapPick}
              className={`inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer px-2 py-0.5 rounded transition-colors ${
                isPickingOnMap
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>{isPickingOnMap ? 'Click map...' : 'Pick pin'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          {searching ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          id={id}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="block w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-shadow"
        />

        {query && (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={() => {
              skipNextSearchRef.current = true;
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {value && (
        <div className="text-[11px] font-mono text-slate-500 tabular-nums">
          {value.lat.toFixed(4)}, {value.lon.toFixed(4)}
        </div>
      )}

      {isOpen && (results.length > 0 || searchError) && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
          {searchError ? (
            <div className="px-3 py-2.5 text-xs text-rose-700">{searchError}</div>
          ) : (
            results.map((item, idx) => (
              <button
                key={`${item.lat}-${item.lon}-${idx}`}
                type="button"
                onClick={() => handleSelectResult(item)}
                className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="text-sm font-medium text-slate-900 truncate">
                  {item.shortName}
                </div>
                <div className="text-xs text-slate-500 truncate mt-0.5">
                  {item.displayName}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
