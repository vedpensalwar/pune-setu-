"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { TopInfoStrip } from "@/components/layout/top-info-strip";
import { PublicHeader } from "@/components/layout/public-header";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  MapPin,
  ThumbsUp,
  X,
  AlertTriangle,
  List,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  STATUS_LABELS,
  STATUS_VARIANTS,
  PRIORITY_LABELS,
  formatRelativeDate,
} from "@/lib/civic/display";

// Dynamic import for Leaflet (SSR incompatible)
const CivicMap = dynamic(() => import("@/components/community/civic-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-surface-muted">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 mx-auto border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-content-muted">Loading Pune civic map…</p>
      </div>
    </div>
  ),
});

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

const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
const STATUSES = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));
const PRIORITIES = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }));

function MapPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters from URL
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [priority, setPriority] = useState(searchParams.get("priority") || "");
  const [wardId, setWardId] = useState(searchParams.get("wardId") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [showFilters, setShowFilters] = useState(false);

  // Data
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [unlocatedCount, setUnlocatedCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wards, setWards] = useState<{ id: string; name: string; wardNumber: number }[]>([]);

  // Selection
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const previewPanelRef = useRef<HTMLDivElement | null>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Load wards for ward filter
  useEffect(() => {
    fetch("/api/wards")
      .then((r) => r.json())
      .then((data) => {
        if (data.wards) setWards(data.wards);
      })
      .catch(() => {});
  }, []);

  const fetchMarkers = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (wardId) params.set("wardId", wardId);
    if (search.trim()) params.set("search", search.trim());

    try {
      const res = await fetch(`/api/community/map?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error (${res.status})`);
      }
      const data = await res.json();
      if (data.success) {
        setMarkers(data.markers || []);
        setUnlocatedCount(data.unlocatedCount || 0);

        // Keep selection if marker still in results, otherwise clear
        setSelectedMarker((prev) => {
          if (!prev) return null;
          return data.markers?.find((m: MapMarker) => m.id === prev.id) || null;
        });
      } else {
        throw new Error(data.error || "Failed to load markers.");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to load markers.");
      setMarkers([]);
    } finally {
      setLoading(false);
    }
  }, [category, status, priority, wardId, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMarkers();
    return () => abortRef.current?.abort();
  }, [fetchMarkers]);

  // Synchronize URL query params
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (wardId) params.set("wardId", wardId);
    if (search.trim()) params.set("search", search.trim());
    const query = params.toString();
    const currentQuery = typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "";
    if (query !== currentQuery) {
      router.replace(query ? `/map?${query}` : "/map", { scroll: false });
    }
  }, [category, status, priority, wardId, search, router]);

  // Focus management & Esc key for accessible preview panel
  useEffect(() => {
    if (selectedMarker) {
      lastActiveElementRef.current = document.activeElement as HTMLElement;
      previewPanelRef.current?.focus();
    } else if (lastActiveElementRef.current) {
      lastActiveElementRef.current.focus();
    }
  }, [selectedMarker]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedMarker) {
        setSelectedMarker(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMarker]);

  const hasActiveFilters = !!(category || status || priority || wardId || search);
  const activeFilterCount = [category, status, priority, wardId].filter(Boolean).length;

  const clearFilters = () => {
    setCategory("");
    setStatus("");
    setPriority("");
    setWardId("");
    setSearch("");
  };

  const getFeedUrl = () => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (wardId) params.set("wardId", wardId);
    if (search.trim()) params.set("search", search.trim());
    const q = params.toString();
    return q ? `/community?${q}` : "/community";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-content-primary">
      <TopInfoStrip />
      <PublicHeader />

      <main className="flex-1 flex flex-col relative">
        {/* Compact Single-Row Toolbar */}
        <div className="border-b border-border bg-surface z-20">
          <Container size="full" className="py-2.5 !px-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <MapPin className="w-4 h-4 text-brand" />
                  <h1 className="text-sm font-bold text-content-primary">Civic Map</h1>
                </div>

                <div className="w-px h-5 bg-border hidden sm:block shrink-0" />

                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-content-muted pointer-events-none" />
                  <input
                    type="search"
                    placeholder="Search locations or title…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 rounded-base border border-border bg-surface text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-focus-ring transition-colors"
                    aria-label="Search map locations"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-content-muted hover:text-content-primary"
                      aria-label="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Desktop Compact Dropdowns */}
                <div className="hidden lg:flex items-center gap-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-8 rounded-base border border-border bg-surface px-2 text-xs text-content-primary focus:outline-none focus:border-brand"
                    aria-label="Filter by Category"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-8 rounded-base border border-border bg-surface px-2 text-xs text-content-primary focus:outline-none focus:border-brand"
                    aria-label="Filter by Status"
                  >
                    <option value="">All Statuses</option>
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={wardId}
                    onChange={(e) => setWardId(e.target.value)}
                    className="h-8 rounded-base border border-border bg-surface px-2 text-xs text-content-primary focus:outline-none focus:border-brand"
                    aria-label="Filter by Prabhag Ward"
                  >
                    <option value="">All Wards</option>
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.wardNumber}. {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mobile Filter Toggle */}
                <Button
                  variant={showFilters ? "primary" : "outline"}
                  size="sm"
                  leftIcon={<SlidersHorizontal className="w-3 h-3" />}
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-8 text-xs relative lg:hidden"
                >
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold bg-accent text-accent-contrast rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-content-muted hover:text-accent transition-colors whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* View Toggle & Count */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-content-muted hidden sm:inline">
                  {loading ? "…" : `${markers.length} markers`}
                </span>
                <Link href={getFeedUrl()}>
                  <Button variant="outline" size="sm" leftIcon={<List className="w-3.5 h-3.5" />} className="h-8 text-xs font-semibold">
                    List View
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile Expanded Filters Sheet */}
            {showFilters && (
              <div className="mt-2.5 pt-2.5 border-t border-border-subtle grid grid-cols-2 sm:grid-cols-4 gap-2.5 lg:hidden">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-content-secondary">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-8 rounded-base border border-border bg-surface px-2 text-xs text-content-primary"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-content-secondary">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-8 rounded-base border border-border bg-surface px-2 text-xs text-content-primary"
                  >
                    <option value="">All Statuses</option>
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-content-secondary">Ward</label>
                  <select
                    value={wardId}
                    onChange={(e) => setWardId(e.target.value)}
                    className="w-full h-8 rounded-base border border-border bg-surface px-2 text-xs text-content-primary"
                  >
                    <option value="">All Wards</option>
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>{w.wardNumber}. {w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-content-secondary">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full h-8 rounded-base border border-border bg-surface px-2 text-xs text-content-primary"
                  >
                    <option value="">All Priorities</option>
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </Container>
        </div>

        {/* Map Container & Preview Layout */}
        <div className="flex-1 relative w-full h-[calc(100vh-140px)] min-h-[500px]">
          {error ? (
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="text-center space-y-3 max-w-sm">
                <AlertTriangle className="w-10 h-10 mx-auto text-status-error" />
                <h2 className="text-base font-semibold text-content-primary">Map currently unavailable</h2>
                <p className="text-xs text-content-secondary">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchMarkers}>
                  Retry Query
                </Button>
              </div>
            </div>
          ) : (
            <CivicMap
              markers={markers}
              loading={loading}
              selectedMarker={selectedMarker}
              onMarkerClick={(m) => setSelectedMarker(m)}
            />
          )}

          {/* Unlocated Issues Disclaimer Pill */}
          {unlocatedCount > 0 && (
            <div className="absolute top-3 left-3 z-20 pointer-events-auto">
              <Link
                href={getFeedUrl()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/95 border border-border text-[11px] text-content-secondary hover:text-brand shadow-card backdrop-blur-sm transition-colors"
              >
                <Info className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>
                  <strong>{unlocatedCount}</strong> issues without GPS coordinates are listed in the feed
                </span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Desktop Right-Side 360px Preview Panel (Does not block map interaction) */}
          {selectedMarker && (
            <div
              ref={previewPanelRef}
              tabIndex={-1}
              role="dialog"
              aria-label={`Preview: ${selectedMarker.title}`}
              className="hidden lg:block absolute top-4 right-4 bottom-4 w-[360px] z-30 bg-surface border border-border rounded-base shadow-elevated p-5 overflow-y-auto outline-none animate-in fade-in slide-in-from-right-4 duration-200"
            >
              <PreviewPanelContent marker={selectedMarker} onClose={() => setSelectedMarker(null)} />
            </div>
          )}

          {/* Mobile Bottom Sheet Preview Drawer */}
          {selectedMarker && (
            <div
              role="dialog"
              aria-label={`Preview: ${selectedMarker.title}`}
              className="lg:hidden absolute bottom-3 left-3 right-3 z-30 bg-surface border border-border rounded-base shadow-elevated p-4 animate-in slide-in-from-bottom-4 duration-200 max-h-[70vh] overflow-y-auto"
            >
              <PreviewPanelContent marker={selectedMarker} onClose={() => setSelectedMarker(null)} />
            </div>
          )}
        </div>

        {/* Legal & Jurisdiction Disclaimer Footer */}
        <div className="border-t border-border bg-surface-muted py-2 px-4 text-center text-[11px] text-content-muted">
          <span>
            Map tiles © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline hover:text-content-primary">OpenStreetMap</a> contributors.
            Grievance coordinates are generalized (~100m) for citizen privacy. Official PMC/PCMC municipal boundary polygons are derived from municipal open data configurations.
          </span>
        </div>
      </main>
    </div>
  );
}

function PreviewPanelContent({
  marker,
  onClose,
}: {
  marker: MapMarker;
  onClose: () => void;
}) {
  const statusVariant = STATUS_VARIANTS[marker.status] || "neutral";
  const categoryIcon = CATEGORY_ICONS[marker.category] || "📋";
  const categoryLabel = CATEGORY_LABELS[marker.category] || marker.category;
  const statusLabel = STATUS_LABELS[marker.status] || marker.status;

  return (
    <div className="space-y-4">
      {/* Header & Close */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-border">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-brand bg-brand-surface px-2 py-0.5 rounded border border-brand/15">
              {marker.trackingToken}
            </span>
            <Badge variant={statusVariant} size="sm" dot>
              {statusLabel}
            </Badge>
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-content-secondary font-medium">
            <span aria-hidden="true">{categoryIcon}</span>
            <span>{categoryLabel}</span>
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-content-muted hover:text-content-primary hover:bg-surface-hover transition-colors"
          aria-label="Close preview"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-content-primary leading-snug">
        {marker.title}
      </h3>

      {/* Location */}
      <div className="p-3 rounded-base bg-surface-muted border border-border space-y-1.5 text-xs">
        {marker.landmark && (
          <div className="flex items-center gap-1.5 text-content-primary">
            <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
            <span className="font-medium truncate">{marker.landmark}</span>
          </div>
        )}
        {marker.wardName && (
          <div className="text-content-secondary text-[11px]">
            Jurisdiction: <strong>{marker.wardName}</strong>
          </div>
        )}
        {marker.departmentName && (
          <div className="text-content-secondary text-[11px]">
            Assigned: <strong>{marker.departmentName}</strong>
          </div>
        )}
      </div>

      {/* Meta Stats */}
      <div className="flex items-center justify-between text-xs text-content-muted pt-1">
        <span className="inline-flex items-center gap-1 font-semibold text-content-primary">
          <ThumbsUp className="w-3.5 h-3.5 text-accent" />
          <span>{marker.endorsementsCount} endorsements</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatRelativeDate(marker.submittedAt)}</span>
        </span>
      </div>

      {/* View Full Details CTA */}
      <div className="pt-2">
        <Link
          href={`/track/${marker.trackingToken}`}
          className="flex items-center justify-center gap-1.5 w-full h-11 rounded-base bg-brand text-brand-contrast text-xs font-semibold hover:bg-brand-hover transition-colors shadow-subtle min-h-[44px]"
        >
          <span>View Full Tracking Dossier</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MapPageContent />
    </Suspense>
  );
}
