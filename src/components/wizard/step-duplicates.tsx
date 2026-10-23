"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  ArrowRight,
  Loader2,
  ShieldAlert,
  Info,
  MapPin,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface DuplicateMatch {
  trackingToken: string;
  title: string;
  category: string;
  landmark: string | null;
  wardName?: string;
  wardNumber?: number;
  status: string;
  submittedAt: string;
  endorsementsCount: number;
  distanceMeters: number;
}

interface StepDuplicatesProps {
  latitude: number | null;
  longitude: number | null;
  category: string;
  onNext: () => void;
  onBack: () => void;
  onEndorseSuccess: (token: string) => void;
}

export function StepDuplicates({
  latitude,
  longitude,
  category,
  onNext,
  onBack,
  onEndorseSuccess,
}: StepDuplicatesProps) {
  const [loading, setLoading] = useState(Boolean(latitude && longitude));
  const [matches, setMatches] = useState<DuplicateMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [endorsingToken, setEndorsingToken] = useState<string | null>(null);
  const [endorseError, setEndorseError] = useState<string | null>(null);

  useEffect(() => {
    if (!latitude || !longitude) {
      return;
    }

    let isCancelled = false;

    fetch("/api/grievances/duplicates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude,
        longitude,
        category,
        radiusMeters: 500,
      }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject("Failed to query nearby grievances.")))
      .then((data) => {
        if (!isCancelled) {
          setMatches(data?.duplicates || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(typeof err === "string" ? err : "Duplicate detection service could not complete the query.");
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [latitude, longitude, category]);

  const handleEndorse = async (token: string) => {
    setEndorsingToken(token);
    setEndorseError(null);

    try {
      const res = await fetch(`/api/grievances/${token}/endorse`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to endorse this grievance.");
      }

      onEndorseSuccess(token);
    } catch (err: any) {
      setEndorseError(err.message || "Could not complete endorsement.");
      setEndorsingToken(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="brand" size="sm">
            Step 4 of 5
          </Badge>
          <span className="text-xs text-content-muted">Civic Deduplication</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-content-primary">
          Check Similar Active Grievances
        </h2>
        <p className="text-xs sm:text-sm text-content-secondary mt-1">
          We check for open reports within 500 metres in this category. You can endorse an existing report to escalate municipal attention, or file a separate complaint if your problem is distinct.
        </p>
      </div>

      {/* Endorse Error Alert */}
      {endorseError && (
        <div className="p-3.5 rounded-base bg-status-danger/10 border border-status-danger/20 flex items-start gap-2.5 text-xs text-status-danger">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{endorseError}</span>
        </div>
      )}

      {/* Query Error Alert */}
      {error && (
        <div className="p-3.5 rounded-base bg-status-warning/10 border border-status-warning/20 flex items-start gap-2.5 text-xs text-content-primary">
          <AlertCircle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Duplicate Detection Notice</p>
            <p className="text-content-secondary leading-relaxed">
              {error} You can still continue to file your grievance directly.
            </p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="p-12 text-center rounded-base border border-border bg-surface-subtle space-y-3">
          <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
          <div>
            <p className="text-sm font-bold text-content-primary">
              Scanning active reports within 500m...
            </p>
            <p className="text-xs text-content-muted mt-1">
              Calculating geodesic distance across registered Pune grievances.
            </p>
          </div>
        </div>
      )}

      {/* Case 1: Matches Found */}
      {!loading && matches.length > 0 && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-base bg-status-warning/10 border border-status-warning/30 flex items-start gap-3 text-xs">
            <Info className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-content-primary">
                {matches.length} Similar Open {matches.length === 1 ? "Grievance" : "Grievances"} Found Nearby
              </p>
              <p className="text-content-secondary leading-relaxed">
                Another citizen has already flagged a similar civic issue in this area. You can endorse their complaint to increase its community priority score, or proceed to submit your separate report.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {matches.map((item) => (
              <Card key={item.trackingToken} className="p-4 border-border bg-surface shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand">
                        {item.trackingToken}
                      </span>
                      <Badge variant="neutral" size="sm">
                        {item.distanceMeters}m away
                      </Badge>
                      <Badge variant="brand" size="sm">
                        {item.status}
                      </Badge>
                      {item.wardName && (
                        <span className="text-[11px] text-content-muted">
                          • Ward {item.wardNumber || ""}: {item.wardName}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-content-primary truncate">
                      {item.title}
                    </h4>

                    {item.landmark && (
                      <div className="flex items-center gap-1.5 text-xs text-content-secondary">
                        <MapPin className="w-3.5 h-3.5 text-content-muted shrink-0" />
                        <span>Landmark: {item.landmark}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-content-muted pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Reported {new Date(item.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3 text-brand" />
                        {item.endorsementsCount} Endorsements
                      </span>
                    </div>
                  </div>

                  <div className="sm:self-center shrink-0">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleEndorse(item.trackingToken)}
                      disabled={endorsingToken === item.trackingToken}
                      leftIcon={
                        endorsingToken === item.trackingToken ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ThumbsUp className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      {endorsingToken === item.trackingToken ? "Endorsing..." : "Endorse This Report"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Case 2: No Matches Found */}
      {!loading && matches.length === 0 && !error && (
        <div className="p-8 text-center rounded-base border border-status-success/30 bg-status-success/5 space-y-3">
          <div className="w-12 h-12 rounded-full bg-status-success/10 text-status-success flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-content-primary">
              No Duplicate Complaints Found Nearby
            </h3>
            <p className="text-xs text-content-secondary mt-1 max-w-md mx-auto">
              No active grievances were found within 500 metres under this category. You are the first citizen to report this issue in this vicinity.
            </p>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onBack}>
          Back to Details
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onNext}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {matches.length > 0 ? "Continue with Separate Complaint" : "Continue to Review & Submit"}
        </Button>
      </div>
    </div>
  );
}
