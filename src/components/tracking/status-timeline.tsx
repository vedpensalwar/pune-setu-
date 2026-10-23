"use client";

import React from "react";
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GrievanceStatus } from "@/lib/civic/types";

interface TimelineItem {
  id: string;
  previousStatus: GrievanceStatus;
  newStatus: GrievanceStatus;
  createdAt: string;
  notes?: string | null;
  changeReason?: string | null;
  changedByName?: string | null;
}

interface StatusTimelineProps {
  timeline: TimelineItem[];
  currentStatus: GrievanceStatus;
}

export function StatusTimeline({ timeline, currentStatus }: StatusTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <Card className="p-6 text-center border-border bg-surface text-content-muted text-xs">
        No formal milestone transitions recorded yet. Initial grievance status is SUBMITTED.
      </Card>
    );
  }

  const getStatusBadgeVariant = (status: GrievanceStatus): "success" | "warning" | "error" | "brand" | "neutral" => {
    switch (status) {
      case "RESOLVED":
        return "success";
      case "REJECTED":
        return "neutral";
      case "ESCALATED":
      case "SLA_BREACHED":
        return "error";
      case "IN_PROGRESS":
      case "ASSIGNED":
        return "brand";
      case "REOPENED":
        return "warning";
      case "SUBMITTED":
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-content-primary uppercase tracking-wider">
          Auditable Status Timeline
        </h3>
        <Badge variant={getStatusBadgeVariant(currentStatus)} size="sm">
          Current: {currentStatus.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="relative border-l-2 border-border pl-6 ml-3 space-y-6">
        {timeline.map((entry, index) => {
          const formattedDate = new Date(entry.createdAt).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          const isLatest = index === timeline.length - 1;

          return (
            <div key={entry.id || index} className="relative">
              {/* Dot */}
              <div
                className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-surface flex items-center justify-center ${
                  isLatest
                    ? "border-brand bg-brand text-white"
                    : "border-border-strong text-content-muted"
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isLatest ? "bg-white" : "bg-content-muted"
                  }`}
                />
              </div>

              {/* Content Card */}
              <div className="p-4 rounded-base bg-surface border border-border shadow-subtle space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-content-primary">
                    <span className="text-content-muted">{entry.previousStatus}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-content-muted" />
                    <span className="text-brand">{entry.newStatus}</span>
                  </div>

                  <span className="text-[11px] font-mono text-content-muted">
                    {formattedDate}
                  </span>
                </div>

                {entry.changeReason && (
                  <p className="text-xs font-semibold text-content-primary">
                    {entry.changeReason}
                  </p>
                )}

                {entry.notes && (
                  <p className="text-xs text-content-secondary leading-relaxed bg-surface-subtle p-2.5 rounded-subtle border border-border-subtle">
                    {entry.notes}
                  </p>
                )}

                {entry.changedByName && (
                  <div className="flex items-center gap-1 text-[11px] text-content-muted pt-1">
                    <UserCheck className="w-3 h-3 text-brand" />
                    <span>Action by: <strong>{entry.changedByName}</strong></span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
