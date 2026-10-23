"use client";

import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Pune center coordinates
const PUNE_CENTER: [number, number] = [18.5204, 73.8567];
const DEFAULT_ZOOM = 12;

// Status-based marker colors
const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "#235A83",
  ASSIGNED: "#235A83",
  IN_PROGRESS: "#946200",
  RESOLVED: "#18794E",
  REJECTED: "#B42332",
  ESCALATED: "#B42332",
  SLA_BREACHED: "#B42332",
};

const STATUS_ICONS: Record<string, string> = {
  SUBMITTED: "●",
  ASSIGNED: "◈",
  IN_PROGRESS: "⚙",
  RESOLVED: "✓",
  REJECTED: "✕",
  ESCALATED: "▲",
  SLA_BREACHED: "!",
  REOPENED: "↻",
};

function createMarkerIcon(status: string, isSelected: boolean): L.DivIcon {
  const color = STATUS_COLORS[status] || "#235A83";
  const symbol = STATUS_ICONS[status] || "●";
  const size = isSelected ? 26 : 20;
  const border = isSelected ? 3 : 2;
  const isSquare = status === "RESOLVED";

  return L.divIcon({
    className: "punesetu-marker",
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      color: #ffffff;
      border: ${border}px solid #ffffff;
      border-radius: ${isSquare ? "4px" : "50%"};
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${isSelected ? "13px" : "10px"};
      font-weight: 700;
      line-height: 1;
      ${isSelected ? "outline: 3px solid #E8772E; outline-offset: 2px; transform: scale(1.2); z-index: 1000;" : ""}
    " aria-label="Status: ${status}">
      <span>${symbol}</span>
    </div>`,
    iconSize: [size + border * 2, size + border * 2],
    iconAnchor: [(size + border * 2) / 2, (size + border * 2) / 2],
  });
}

function createClusterIcon(count: number): L.DivIcon {
  const size = count > 99 ? 44 : count > 9 ? 38 : 32;
  return L.divIcon({
    className: "punesetu-cluster-marker",
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: #173B57;
      color: #FFFFFF;
      border: 3px solid #E8772E;
      border-radius: 50%;
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${size > 38 ? "13px" : "11px"};
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.15s ease-out;
    " role="button" aria-label="Cluster of ${count} complaints. Click to zoom in." title="${count} complaints in this area — click to zoom in">
      <span>${count}</span>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface MapMarker {
  id: string;
  trackingToken: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  latitude: number;
  longitude: number;
  landmark?: string | null;
  wardName?: string;
  departmentName?: string;
  submittedAt: string;
  endorsementsCount: number;
}

interface CivicMapProps {
  markers: MapMarker[];
  loading: boolean;
  selectedMarker: MapMarker | null;
  onMarkerClick: (marker: MapMarker) => void;
}

interface MarkerClusterItem {
  id: string;
  isCluster: boolean;
  latitude: number;
  longitude: number;
  count: number;
  markers: MapMarker[];
  bounds: L.LatLngBounds;
}

// Sub-component to handle map ref operations
function MapUpdater({ selectedMarker }: { selectedMarker: MapMarker | null }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate map dimensions immediately and after render
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (selectedMarker) {
      map.flyTo([selectedMarker.latitude, selectedMarker.longitude], Math.max(map.getZoom(), 14), {
        duration: 0.5,
      });
    }
  }, [selectedMarker, map]);

  return null;
}

// Sub-component for zoom-adaptive clustering
function ClusteredMarkers({
  markers,
  selectedMarker,
  onMarkerClick,
}: {
  markers: MapMarker[];
  selectedMarker: MapMarker | null;
  onMarkerClick: (marker: MapMarker) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());

  useEffect(() => {
    const handleZoomOrMove = () => {
      setZoom(map.getZoom());
    };
    map.on("zoomend", handleZoomOrMove);
    map.on("moveend", handleZoomOrMove);
    return () => {
      map.off("zoomend", handleZoomOrMove);
      map.off("moveend", handleZoomOrMove);
    };
  }, [map]);

  const clusters = useMemo(() => {
    // If zoom is very high (>= 15), don't cluster: show all individual markers
    if (zoom >= 15 || markers.length <= 1) {
      return markers.map((m) => ({
        id: m.id,
        isCluster: false,
        latitude: m.latitude,
        longitude: m.longitude,
        count: 1,
        markers: [m],
        bounds: L.latLngBounds([[m.latitude, m.longitude], [m.latitude, m.longitude]]),
      }));
    }

    const clusterRadiusPx = 45;
    const result: MarkerClusterItem[] = [];
    const visited = new Set<string>();

    for (let i = 0; i < markers.length; i++) {
      const m1 = markers[i];
      if (visited.has(m1.id)) continue;

      const p1 = map.project([m1.latitude, m1.longitude], zoom);
      const clusterMembers: MapMarker[] = [m1];
      visited.add(m1.id);

      for (let j = i + 1; j < markers.length; j++) {
        const m2 = markers[j];
        if (visited.has(m2.id)) continue;

        const p2 = map.project([m2.latitude, m2.longitude], zoom);
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

        if (dist <= clusterRadiusPx) {
          clusterMembers.push(m2);
          visited.add(m2.id);
        }
      }

      if (clusterMembers.length === 1) {
        result.push({
          id: m1.id,
          isCluster: false,
          latitude: m1.latitude,
          longitude: m1.longitude,
          count: 1,
          markers: [m1],
          bounds: L.latLngBounds([[m1.latitude, m1.longitude], [m1.latitude, m1.longitude]]),
        });
      } else {
        const avgLat = clusterMembers.reduce((sum, m) => sum + m.latitude, 0) / clusterMembers.length;
        const avgLng = clusterMembers.reduce((sum, m) => sum + m.longitude, 0) / clusterMembers.length;
        const bounds = L.latLngBounds(clusterMembers.map((m) => [m.latitude, m.longitude] as [number, number]));

        result.push({
          id: `cluster_${clusterMembers.map((m) => m.id).join("_")}`,
          isCluster: true,
          latitude: avgLat,
          longitude: avgLng,
          count: clusterMembers.length,
          markers: clusterMembers,
          bounds,
        });
      }
    }

    return result;
  }, [markers, zoom, map]);

  return (
    <>
      {clusters.map((c) => {
        if (c.isCluster) {
          return (
            <Marker
              key={c.id}
              position={[c.latitude, c.longitude]}
              icon={createClusterIcon(c.count)}
              eventHandlers={{
                click: () => {
                  map.fitBounds(c.bounds, { padding: [50, 50], maxZoom: 16 });
                },
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-sm text-brand">{c.count} Complaints Clustered</p>
                  <p className="text-gray-500">Click to zoom into this neighbourhood.</p>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5 max-h-32 overflow-y-auto">
                    {c.markers.slice(0, 5).map((m) => (
                      <li key={m.id} className="text-[11px] truncate">
                        {m.title}
                      </li>
                    ))}
                    {c.markers.length > 5 && (
                      <li className="text-[10px] text-gray-400">+{c.markers.length - 5} more…</li>
                    )}
                  </ul>
                </div>
              </Popup>
            </Marker>
          );
        }

        const marker = c.markers[0];
        const isSelected = selectedMarker?.id === marker.id;

        return (
          <Marker
            key={marker.id}
            position={[marker.latitude, marker.longitude]}
            icon={createMarkerIcon(marker.status, isSelected)}
            eventHandlers={{
              click: () => onMarkerClick(marker),
            }}
          >
            <Popup>
              <div className="text-xs space-y-1" style={{ minWidth: "150px" }}>
                <p className="font-semibold text-sm leading-tight">{marker.title}</p>
                {marker.landmark && <p className="text-gray-500">{marker.landmark}</p>}
                <p>
                  <span className="font-medium">{marker.status.replace(/_/g, " ")}</span>
                  {" · "}
                  {marker.endorsementsCount} endorsements
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function CivicMap({ markers, loading, selectedMarker, onMarkerClick }: CivicMapProps) {
  return (
    <div className="w-full h-full min-h-[500px] relative">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 bg-surface rounded-base px-4 py-2 shadow-card border border-border">
            <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-content-secondary">Loading markers…</span>
          </div>
        </div>
      )}

      <MapContainer
        center={PUNE_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ width: "100%", height: "100%", minHeight: "500px" }}
        className="w-full h-full min-h-[500px]"
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater selectedMarker={selectedMarker} />

        <ClusteredMarkers
          markers={markers}
          selectedMarker={selectedMarker}
          onMarkerClick={onMarkerClick}
        />
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-20 bg-surface border border-border rounded-base shadow-card p-3 hidden md:block">
        <p className="text-[10px] font-bold text-content-secondary uppercase tracking-wider mb-2">Status</p>
        <div className="space-y-1.5">
          {[
            { label: "Submitted / Assigned", color: STATUS_COLORS.SUBMITTED },
            { label: "In Progress / Reopened", color: STATUS_COLORS.IN_PROGRESS },
            { label: "Resolved", color: STATUS_COLORS.RESOLVED },
            { label: "Escalated / Breached", color: STATUS_COLORS.ESCALATED },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 border border-white"
                style={{ backgroundColor: item.color, boxShadow: "0 0 0 1px rgba(0,0,0,0.1)" }}
              />
              <span className="text-[10px] text-content-secondary">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state on map */}
      {!loading && markers.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="bg-surface border border-border rounded-base shadow-card p-6 text-center pointer-events-auto">
            <p className="text-sm font-semibold text-content-primary mb-1">No markers to display</p>
            <p className="text-xs text-content-secondary">
              No grievances with location data match your filters.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
