"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { PUNE_BOUNDS } from "@/lib/civic/validation";

// Default Pune Municipal Corporation Bhavan center
const DEFAULT_CENTER: [number, number] = [18.5204, 73.8567];
const DEFAULT_ZOOM = 13;

function createLocationPinIcon(): L.DivIcon {
  return L.divIcon({
    className: "punesetu-location-pin",
    html: `<div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -100%);
      pointer-events: auto;
      cursor: grab;
    ">
      <div style="
        background: #173B57;
        color: #ffffff;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 9999px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        white-space: nowrap;
        margin-bottom: 2px;
        border: 1px solid rgba(255,255,255,0.4);
      ">
        Issue Location
      </div>
      <div style="
        width: 28px;
        height: 28px;
        background: #D96A24;
        border: 3px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: #ffffff;
          border-radius: 50%;
        "></div>
      </div>
    </div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  });
}

interface LocationPickerMapProps {
  latitude: number | null;
  longitude: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
  onError?: (msg: string) => void;
}

// Subcomponent to capture map click events
function MapClickHandler({
  onLocationSelect,
  onError,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
  onError?: (msg: string) => void;
}) {
  useMapEvents({
    click(e) {
      const lat = Number(e.latlng.lat.toFixed(6));
      const lng = Number(e.latlng.lng.toFixed(6));

      // Validate bounds
      if (
        lat < PUNE_BOUNDS.MIN_LAT ||
        lat > PUNE_BOUNDS.MAX_LAT ||
        lng < PUNE_BOUNDS.MIN_LNG ||
        lng > PUNE_BOUNDS.MAX_LNG
      ) {
        if (onError) {
          onError(
            `Selected point (${lat}, ${lng}) is outside Pune municipal limits (${PUNE_BOUNDS.MIN_LAT} to ${PUNE_BOUNDS.MAX_LAT}°N). Please place the pin within Pune.`
          );
        }
        return;
      }

      onLocationSelect(lat, lng);
    },
  });

  return null;
}

// Subcomponent to adjust view and ensure map size
function MapController({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const map = useMap();
  const prevCoordRef = useRef<string>("");

  useEffect(() => {
    // Invalidate size on mount
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      const key = `${latitude},${longitude}`;
      if (prevCoordRef.current !== key) {
        prevCoordRef.current = key;
        map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), {
          duration: 0.6,
        });
      }
    }
  }, [latitude, longitude, map]);

  return null;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onLocationSelect,
  onError,
}: LocationPickerMapProps) {
  const pinIcon = useMemo(() => createLocationPinIcon(), []);

  const hasCoords = latitude !== null && longitude !== null;
  const position: [number, number] = hasCoords
    ? [latitude, longitude]
    : DEFAULT_CENTER;

  const markerEventHandlers = useMemo(
    () => ({
      dragend(e: L.DragEndEvent) {
        const marker = e.target;
        if (marker) {
          const latLng = marker.getLatLng();
          const lat = Number(latLng.lat.toFixed(6));
          const lng = Number(latLng.lng.toFixed(6));

          if (
            lat < PUNE_BOUNDS.MIN_LAT ||
            lat > PUNE_BOUNDS.MAX_LAT ||
            lng < PUNE_BOUNDS.MIN_LNG ||
            lng > PUNE_BOUNDS.MAX_LNG
          ) {
            if (onError) {
              onError(
                `Dragged position (${lat}, ${lng}) is outside Pune boundaries. Please keep pin inside Pune.`
              );
            }
            return;
          }

          onLocationSelect(lat, lng);
        }
      },
    }),
    [onLocationSelect, onError]
  );

  return (
    <div className="w-full h-full min-h-[280px] sm:min-h-[320px] relative select-none">
      <MapContainer
        center={position}
        zoom={hasCoords ? 15 : DEFAULT_ZOOM}
        style={{ width: "100%", height: "100%", minHeight: "280px" }}
        className="w-full h-full min-h-[280px] sm:min-h-[320px]"
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onLocationSelect={onLocationSelect} onError={onError} />
        <MapController latitude={latitude} longitude={longitude} />

        {hasCoords && (
          <Marker
            position={position}
            icon={pinIcon}
            draggable={true}
            eventHandlers={markerEventHandlers}
          />
        )}
      </MapContainer>
    </div>
  );
}
