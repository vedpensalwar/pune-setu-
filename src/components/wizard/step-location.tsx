"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Navigation,
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  Info,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PUNE_BOUNDS } from "@/lib/civic/validation";

const LocationPickerMap = dynamic(() => import("./location-picker-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 flex items-center justify-center bg-surface-muted rounded-base border border-border">
      <div className="text-center space-y-2">
        <Loader2 className="w-6 h-6 mx-auto animate-spin text-brand" />
        <p className="text-xs text-content-muted">Loading interactive location picker…</p>
      </div>
    </div>
  ),
});

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  landmark: string;
  locationDescription: string;
  wardId: string;
  wardName?: string;
  wardNumber?: number;
}

interface StepLocationProps {
  data: LocationData;
  onChange: (data: LocationData) => void;
  onNext: () => void;
  onBack: () => void;
}

interface WardOption {
  id: string;
  name: string;
  wardNumber: number;
  zone: string;
  officeAddress?: string;
}

export function StepLocation({ data, onChange, onNext, onBack }: StepLocationProps) {
  const [wards, setWards] = useState<WardOption[]>([]);
  const [loadingWards, setLoadingWards] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load Pune's 15 Prabhag wards from API
  useEffect(() => {
    fetch("/api/wards")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.wards) {
          setWards(json.wards);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingWards(false));
  }, []);

  // Request browser GPS position
  const handleUseGps = () => {
    setGpsError(null);
    setValidationError(null);

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser. Please enter coordinates or select on map.");
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        // Validate within Pune bounds
        if (
          lat < PUNE_BOUNDS.MIN_LAT ||
          lat > PUNE_BOUNDS.MAX_LAT ||
          lng < PUNE_BOUNDS.MIN_LNG ||
          lng > PUNE_BOUNDS.MAX_LNG
        ) {
          setGpsError(
            `Detected location (${lat}, ${lng}) appears to be outside Pune municipal boundaries (${PUNE_BOUNDS.MIN_LAT} to ${PUNE_BOUNDS.MAX_LAT}°N). You can manually enter the Pune coordinates or adjust the pin below.`
          );
          return;
        }

        onChange({
          ...data,
          latitude: lat,
          longitude: lng,
        });
      },
      (error) => {
        setGpsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError("Location permission was denied. You can select your location on the map or enter nearby landmarks.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError("Location information is currently unavailable from your device. Please enter coordinates manually.");
            break;
          case error.TIMEOUT:
            setGpsError("GPS location request timed out. Please try again or select your ward directly.");
            break;
          default:
            setGpsError("Unable to retrieve GPS coordinates.");
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleNext = () => {
    if (!data.wardId && !data.landmark && (!data.latitude || !data.longitude)) {
      setValidationError("Please select your Prabhag ward or specify a landmark / location.");
      return;
    }
    setValidationError(null);
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="brand" size="sm">
            Step 2 of 5
          </Badge>
          <span className="text-xs text-content-muted">Geotagging &amp; Jurisdiction</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-content-primary">
          Select Problem Location
        </h2>
        <p className="text-xs sm:text-sm text-content-secondary mt-1">
          Pinpoint the issue using GPS, interactive map, or select your Prabhag Ward office.
        </p>
      </div>

      {/* Validation or GPS Error Alert */}
      {(validationError || gpsError) && (
        <div className="p-3.5 rounded-base bg-status-danger/10 border border-status-danger/20 flex items-start gap-2.5 text-xs text-status-danger">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{validationError || gpsError}</span>
        </div>
      )}

      {/* GPS Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-base border border-border bg-surface-subtle">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-full bg-brand/10 text-brand">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-content-primary">Automatic GPS Geolocation</p>
            <p className="text-[11px] text-content-muted">Acquire latitude &amp; longitude directly from your device</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseGps}
          disabled={gpsLoading}
          leftIcon={gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
        >
          {gpsLoading ? "Detecting GPS..." : "Use My Current Location"}
        </Button>
      </div>

      {/* Interactive Pune Map Location Picker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-content-primary uppercase tracking-wide">
            Interactive Pune Municipal Map
          </label>
          <span className="text-[11px] text-content-muted">Click anywhere to place or drag pin</span>
        </div>

        <div className="relative w-full h-72 sm:h-80 rounded-base border border-border overflow-hidden shadow-inner select-none bg-surface-muted">
          <LocationPickerMap
            latitude={data.latitude}
            longitude={data.longitude}
            onLocationSelect={(lat, lng) => {
              setGpsError(null);
              setValidationError(null);
              onChange({
                ...data,
                latitude: lat,
                longitude: lng,
              });
            }}
            onError={(msg) => setGpsError(msg)}
          />

          {/* Coordinates Overlay Indicator */}
          <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none px-3 py-1.5 rounded-subtle bg-surface/90 backdrop-blur-md border border-border text-content-primary text-[11px] shadow-card flex items-center gap-2">
            <span className="text-content-muted font-medium">Coordinates:</span>
            <span className="font-mono font-bold text-brand">
              {data.latitude !== null && data.longitude !== null
                ? `${data.latitude}°N, ${data.longitude}°E`
                : "Not geotagged yet (Click map or use GPS)"}
            </span>
          </div>
        </div>
      </div>

      {/* Ward Selection & Landmark Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Ward Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-content-primary">
            Prabhag Ward Jurisdiction <span className="text-status-danger">*</span>
          </label>
          <select
            value={data.wardId}
            onChange={(e) => {
              const selectedId = e.target.value;
              const found = wards.find((w) => w.id === selectedId);
              onChange({
                ...data,
                wardId: selectedId,
                wardName: found?.name,
                wardNumber: found?.wardNumber,
              });
            }}
            disabled={loadingWards}
            className="w-full h-10 px-3 text-xs rounded-base border border-border bg-surface text-content-primary focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">-- Select Your Ward (15 Prabhags) --</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                Ward {w.wardNumber}: {w.name} ({w.zone})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-content-muted">
            Official PMC administrative zone responsible for field inspection.
          </p>
        </div>

        {/* Nearby Landmark */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-content-primary">
            Prominent Landmark <span className="text-content-muted font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Near Balgandharva Rangmandir, Opposite Pillar 42"
            value={data.landmark}
            onChange={(e) => onChange({ ...data, landmark: e.target.value })}
            maxLength={100}
            className="w-full h-10 px-3 text-xs rounded-base border border-border bg-surface text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <p className="text-[11px] text-content-muted">
            Helps municipal staff identify the spot without relying solely on GPS.
          </p>
        </div>
      </div>

      {/* Detailed Location Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-content-primary">
          Street / Location Remarks <span className="text-content-muted font-normal">(Optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Northbound lane before the flyover start, corner junction"
          value={data.locationDescription}
          onChange={(e) => onChange({ ...data, locationDescription: e.target.value })}
          maxLength={250}
          className="w-full h-10 px-3 text-xs rounded-base border border-border bg-surface text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {/* Privacy Notice */}
      <div className="rounded-base bg-surface-subtle border border-border p-3.5 flex items-start gap-2.5 text-xs text-content-secondary">
        <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
        <p>
          <strong>Privacy by Design:</strong> Exact residential coordinates are automatically masked on public tracking portals to safeguard citizen privacy. Only assigned field engineers can view exact pins.
        </p>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onBack}>
          Back to Evidence
        </Button>
        <Button type="button" variant="primary" onClick={handleNext}>
          Continue to Issue Details
        </Button>
      </div>
    </div>
  );
}
