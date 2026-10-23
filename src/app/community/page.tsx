"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TopInfoStrip } from "@/components/layout/top-info-strip";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MapPin,
  ThumbsUp,
  MessageCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Map as MapIcon,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  STATUS_LABELS,
  STATUS_VARIANTS,
  PRIORITY_LABELS,
  formatRelativeDate,
} from "@/lib/civic/display";
import { ComplaintImage } from "@/components/civic/complaint-image";

interface FeedItem {
  id: string;
  trackingToken: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  landmark?: string | null;
  departmentName?: string;
  wardName?: string;
  wardNumber?: number;
  submittedAt: string;
  deadlineAt?: string | null;
  resolvedAt?: string | null;
  endorsementsCount: number;
  commentsCount: number;
  followersCount: number;
  hasCoordinates: boolean;
  thumbnailUrl?: string | null;
}

interface FeedResponse {
  success: boolean;
  items: FeedItem[];
  total: number;
  page: number;
  totalPages: number;
  error?: string;
}

const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
const STATUSES = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));
const PRIORITIES = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }));

function CommunityFeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State from URL parameters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [priority, setPriority] = useState(searchParams.get("priority") || "");
  const [wardId, setWardId] = useState(searchParams.get("wardId") || "");
  const [departmentId, setDepartmentId] = useState(searchParams.get("departmentId") || "");
  const [sortBy, setSortBy] = useState<"newest" | "most_endorsed">(
    searchParams.get("sortBy") === "most_endorsed" ? "most_endorsed" : "newest"
  );
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Data
  const [items, setItems] = useState<FeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wards, setWards] = useState<{ id: string; name: string; wardNumber: number }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string; code: string }[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load wards & departments for filter dropdowns
  useEffect(() => {
    fetch("/api/wards")
      .then((r) => r.json())
      .then((data) => {
        if (data.wards) setWards(data.wards);
      })
      .catch(() => {});

    fetch("/api/departments")
      .then((r) => r.json())
      .then((data) => {
        if (data.departments) setDepartments(data.departments);
      })
      .catch(() => {});
  }, []);

  // Fetch authoritative feed data
  const fetchFeed = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (wardId) params.set("wardId", wardId);
    if (departmentId) params.set("departmentId", departmentId);
    if (sortBy === "most_endorsed") params.set("sortBy", "most_endorsed");
    params.set("page", String(page));
    params.set("limit", "20"); // 20 per page per Section 5

    try {
      const res = await fetch(`/api/community/feed?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error (${res.status})`);
      }
      const data: FeedResponse = await res.json();
      if (data.success) {
        setItems(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } else {
        throw new Error(data.error || "Failed to load feed.");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to load community feed.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, category, status, priority, wardId, departmentId, sortBy, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFeed();
    return () => abortRef.current?.abort();
  }, [fetchFeed]);

  // Synchronize URL query parameters only when query actually changes
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (wardId) params.set("wardId", wardId);
    if (departmentId) params.set("departmentId", departmentId);
    if (sortBy === "most_endorsed") params.set("sortBy", "most_endorsed");
    if (page > 1) params.set("page", String(page));
    const queryString = params.toString();
    const currentQuery = typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "";
    if (queryString !== currentQuery) {
      router.replace(queryString ? `/community?${queryString}` : "/community", { scroll: false });
    }
  }, [search, category, status, priority, wardId, departmentId, sortBy, page, router]);

  const handleSearchInput = (value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
    }, 300);
  };

  const clearAllFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
    setPriority("");
    setWardId("");
    setDepartmentId("");
    setSortBy("newest");
    setPage(1);
  };

  const hasActiveFilters = !!(search || category || status || priority || wardId || departmentId);
  const activeFilterCount = [category, status, priority, wardId, departmentId].filter(Boolean).length;

  const getMapUrl = () => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (wardId) params.set("wardId", wardId);
    if (departmentId) params.set("departmentId", departmentId);
    if (search.trim()) params.set("search", search.trim());
    const q = params.toString();
    return q ? `/map?${q}` : "/map";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-content-primary">
      <TopInfoStrip />
      <PublicHeader />

      <main className="flex-1">
        {/* 1. Page Title & Intro (Strictly Section 5: 32px, 1-sentence intro, no hero) */}
        <section className="border-b border-border bg-surface py-6 sm:py-8">
          <Container size="lg">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1.5 text-left">
                <h1 className="text-2xl sm:text-[32px] font-bold text-content-primary tracking-tight leading-tight">
                  Civic Issues in Pune
                </h1>
                <p className="text-sm text-content-secondary max-w-2xl leading-relaxed">
                  Discover public civic complaints across Pune&apos;s 15 Prabhag Wards, track verified municipal progress, and endorse community solutions.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Link href={getMapUrl()}>
                  <Button variant="outline" size="sm" leftIcon={<MapIcon className="w-4 h-4" />}>
                    View on Map
                  </Button>
                </Link>
                <Link href="/grievances/new">
                  <Button variant="accent" size="sm" className="font-semibold">
                    Report Issue
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* 2. Single-Row Filter & Search Bar */}
        <section className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border shadow-subtle">
          <Container size="lg" className="py-2.5">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* Search input (wide) */}
              <div className="relative flex-1 min-w-[140px] sm:min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
                <input
                  type="search"
                  placeholder="Search issues by title, location, or token…"
                  value={search}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 rounded-base border border-border bg-surface text-xs sm:text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-focus-ring transition-colors"
                  aria-label="Search civic issues"
                />
                {search && (
                  <button
                    onClick={() => { setSearch(""); setPage(1); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-content-muted hover:text-content-primary"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Desktop Compact Dropdowns (Category, Status, Ward, Department, Priority) */}
              <div className="hidden lg:flex items-center gap-2">
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                  className="h-10 rounded-base border border-border bg-surface px-2.5 text-xs text-content-primary focus:outline-none focus:border-brand"
                  aria-label="Category"
                >
                  <option value="">Category: All</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>

                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  className="h-10 rounded-base border border-border bg-surface px-2.5 text-xs text-content-primary focus:outline-none focus:border-brand"
                  aria-label="Status"
                >
                  <option value="">Status: All</option>
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                <select
                  value={wardId}
                  onChange={(e) => { setWardId(e.target.value); setPage(1); }}
                  className="h-10 rounded-base border border-border bg-surface px-2.5 text-xs text-content-primary focus:outline-none focus:border-brand max-w-[150px] truncate"
                  aria-label="Prabhag Ward"
                >
                  <option value="">Ward: All</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>{w.wardNumber}. {w.name}</option>
                  ))}
                </select>

                <select
                  value={departmentId}
                  onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}
                  className="h-10 rounded-base border border-border bg-surface px-2.5 text-xs text-content-primary focus:outline-none focus:border-brand max-w-[150px] truncate"
                  aria-label="Department"
                >
                  <option value="">Dept: All</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>

                <select
                  value={priority}
                  onChange={(e) => { setPriority(e.target.value); setPage(1); }}
                  className="h-10 rounded-base border border-border bg-surface px-2.5 text-xs text-content-primary focus:outline-none focus:border-brand"
                  aria-label="Priority"
                >
                  <option value="">Priority: All</option>
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Mobile Filter Toggle Button */}
              <Button
                variant={showMobileFilters ? "primary" : "outline"}
                size="sm"
                leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="h-10 text-xs relative lg:hidden"
              >
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 text-[11px] font-bold">({activeFilterCount})</span>
                )}
              </Button>

              {/* Clear filters action */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-content-muted hover:text-accent font-medium px-2 py-1 transition-colors whitespace-nowrap"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Mobile Collapsible Filters Sheet */}
            {showMobileFilters && (
              <div className="mt-3 pt-3 border-t border-border-subtle grid grid-cols-1 sm:grid-cols-2 gap-2.5 lg:hidden animate-in fade-in duration-150">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-content-secondary">Category</label>
                  <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                    className="w-full h-9 rounded-base border border-border bg-surface px-2 text-xs"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-content-secondary">Status</label>
                  <select
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                    className="w-full h-9 rounded-base border border-border bg-surface px-2 text-xs"
                  >
                    <option value="">All Statuses</option>
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-content-secondary">Ward</label>
                  <select
                    value={wardId}
                    onChange={(e) => { setWardId(e.target.value); setPage(1); }}
                    className="w-full h-9 rounded-base border border-border bg-surface px-2 text-xs"
                  >
                    <option value="">All Wards</option>
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>{w.wardNumber}. {w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-content-secondary">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => { setPriority(e.target.value); setPage(1); }}
                    className="w-full h-9 rounded-base border border-border bg-surface px-2 text-xs"
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
        </section>

        {/* 3. Result Count & Sort Selector */}
        <section className="py-4 border-b border-border-subtle bg-surface/50">
          <Container size="lg">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="font-medium text-content-secondary">
                {loading ? (
                  "Loading issues…"
                ) : (
                  <>
                    Showing <strong className="text-content-primary">{total}</strong> {total === 1 ? "issue" : "issues"}
                    {hasActiveFilters && " matching criteria"}
                  </>
                )}
              </span>

              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <span className="text-content-muted hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as "newest" | "most_endorsed");
                    setPage(1);
                  }}
                  className="h-8 rounded-base border border-border bg-surface px-2.5 text-xs text-content-primary focus:outline-none focus:border-brand font-medium"
                  aria-label="Sort issues"
                >
                  <option value="newest">Newest first</option>
                  <option value="most_endorsed">Most endorsed</option>
                </select>
              </div>
            </div>
          </Container>
        </section>

        {/* 4. Horizontal Issue Rows (Strictly Section 5 layout) */}
        <section className="py-6 sm:py-8">
          <Container size="lg">
            {loading ? (
              <FeedRowsSkeleton />
            ) : error ? (
              <div className="p-8 rounded-base border border-status-error/30 bg-status-error/5 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 mx-auto text-status-error" />
                <h2 className="text-base font-bold text-content-primary">Failed to load civic feed</h2>
                <p className="text-xs text-content-secondary max-w-sm mx-auto">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchFeed} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
                  Retry Query
                </Button>
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 rounded-base border border-dashed border-border bg-surface text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center mx-auto text-content-muted">
                  <Search className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-content-primary">No civic issues match your query</h2>
                <p className="text-xs text-content-secondary max-w-md mx-auto">
                  {hasActiveFilters
                    ? "No complaints found with the current combination of search terms and active filters."
                    : "No public civic issues have been submitted to the platform yet."}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearAllFilters}>
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <HorizontalIssueRow key={item.id} item={item} onRefresh={fetchFeed} />
                ))}
              </div>
            )}

            {/* 5. Server-Side Pagination (20 per page) */}
            {!loading && totalPages > 1 && (
              <div className="mt-8 pt-4 border-t border-border flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                  className="min-h-[44px]"
                >
                  Previous
                </Button>
                <span className="text-xs font-semibold text-content-primary px-3">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                  className="min-h-[44px]"
                >
                  Next
                </Button>
              </div>
            )}
          </Container>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

// ── Horizontal Issue Row Component (Section 5) ─────────────────

function HorizontalIssueRow({ item, onRefresh }: { item: FeedItem; onRefresh: () => void }) {
  const router = useRouter();
  const statusVariant = STATUS_VARIANTS[item.status] || "neutral";
  const categoryIcon = CATEGORY_ICONS[item.category] || "📋";
  const categoryLabel = CATEGORY_LABELS[item.category] || item.category;
  const statusLabel = STATUS_LABELS[item.status] || item.status;

  const [endorsing, setEndorsing] = useState(false);
  const [endorsements, setEndorsements] = useState(item.endorsementsCount);
  const [following, setFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  // Check initial follow state if authenticated
  useEffect(() => {
    fetch(`/api/community/engagement?token=${encodeURIComponent(item.trackingToken)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setFollowing(Boolean(data.following));
        }
      })
      .catch(() => {});
  }, [item.trackingToken]);

  const handleEndorseClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEndorsing(true);
    try {
      const res = await fetch(`/api/grievances/${encodeURIComponent(item.trackingToken)}/endorse`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEndorsements(data.totalEndorsements);
      } else if (res.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(`/track/${item.trackingToken}`)}`);
      }
    } catch {
    } finally {
      setEndorsing(false);
    }
  };

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFollowingLoading(true);
    try {
      const res = await fetch(`/api/grievances/${encodeURIComponent(item.trackingToken)}/follow`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFollowing(data.following);
      } else if (res.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(`/track/${item.trackingToken}`)}`);
      }
    } catch {
    } finally {
      setFollowingLoading(false);
    }
  };

  return (
    <div className="p-3.5 sm:p-5 rounded-base border border-border bg-surface hover:border-brand/40 hover:shadow-subtle transition-all duration-150 flex flex-col sm:flex-row items-stretch sm:items-start gap-3.5 sm:gap-4 w-full min-w-0 overflow-hidden">
      {/* Evidence Thumbnail: Displays photograph or polished fallback */}
      <div className="w-full sm:w-24 md:w-28 h-40 sm:h-24 md:h-28 shrink-0 rounded-base overflow-hidden bg-surface-muted">
        <ComplaintImage
          src={item.thumbnailUrl}
          alt={item.title}
          className="w-full h-full"
          imageClassName="w-full h-full object-cover"
        />
      </div>

      {/* Main Content Body */}
      <div className="flex-1 min-w-0 w-full space-y-2 text-left">
        {/* Meta Bar: Token · Category · Ward · Date */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
          <Link
            href={`/track/${item.trackingToken}`}
            className="font-mono font-bold text-brand hover:underline break-all shrink-0"
          >
            {item.trackingToken}
          </Link>
          <span className="text-content-muted">·</span>
          <span className="inline-flex items-center gap-1 font-medium text-content-secondary shrink-0">
            <span>{categoryIcon}</span>
            <span>{categoryLabel}</span>
          </span>
          {item.wardName && (
            <>
              <span className="text-content-muted">·</span>
              <span className="text-content-secondary break-words">
                Ward {item.wardNumber ? `${item.wardNumber}: ` : ""}{item.wardName}
              </span>
            </>
          )}
          <span className="text-content-muted">·</span>
          <span className="text-content-muted shrink-0">
            {formatRelativeDate(item.submittedAt)}
          </span>
        </div>

        {/* Title (18px / 600 weight, wraps correctly) */}
        <Link href={`/track/${item.trackingToken}`} className="block group">
          <h2 className="text-base sm:text-lg font-semibold text-content-primary leading-snug group-hover:text-brand transition-colors break-words">
            {item.title}
          </h2>
        </Link>

        {/* 2-Line Excerpt */}
        <p className="text-xs sm:text-sm text-content-secondary leading-relaxed line-clamp-2 break-words">
          {item.description}
        </p>

        {/* Bottom Actions Row: Status Pill + Endorsements + Follow */}
        <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-t border-border-subtle w-full min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            <Badge variant={statusVariant} size="sm" dot className="shrink-0">
              {statusLabel}
            </Badge>

            {/* Endorsements Button */}
            <button
              type="button"
              onClick={handleEndorseClick}
              disabled={endorsing}
              className="inline-flex items-center gap-1 text-xs font-semibold text-content-primary hover:text-accent transition-colors p-1 rounded min-h-[36px] shrink-0"
              aria-label={`Endorse issue. Current count: ${endorsements}`}
            >
              <ThumbsUp className="w-3.5 h-3.5 text-accent" />
              <span>{endorsements} endorsements</span>
            </button>

            {/* Comments Count */}
            {item.commentsCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-content-muted shrink-0">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{item.commentsCount}</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t border-border-subtle sm:border-t-0">
            {/* Follow Button */}
            <button
              type="button"
              onClick={handleFollowClick}
              disabled={followingLoading}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors min-h-[36px] ${
                following
                  ? "bg-brand text-brand-contrast"
                  : "bg-surface-muted text-content-secondary hover:text-content-primary border border-border"
              }`}
              aria-label={following ? "Following issue" : "Follow updates"}
            >
              <Bell className="w-3 h-3" />
              <span>{following ? "Following" : "Follow"}</span>
            </button>

            <Link href={`/track/${item.trackingToken}`}>
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />} className="text-xs h-8">
                Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Skeletons ──────────────────────────────────────────────────

function FeedRowsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 sm:p-5 rounded-base border border-border bg-surface space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="pt-2 flex items-center gap-4">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CommunityFeedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CommunityFeedContent />
    </Suspense>
  );
}
