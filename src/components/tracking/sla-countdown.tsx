"use client";

import React, { useEffect, useState } from "react";
import { Clock, AlertTriangle, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SLAStatusInfo, GrievanceStatus } from "@/lib/civic/types";

interface SLACountdownProps {
  initialSLA: SLAStatusInfo;
  deadlineAt?: string | null;
  status: GrievanceStatus;
}

export function SLACountdown({ initialSLA, deadlineAt, status }: SLACountdownProps) {
  const [liveSLA, setLiveSLA] = useState<SLAStatusInfo>(initialSLA);

  // Recalculate time remaining every 60 seconds locally without hitting database
  useEffect(() => {
    if (!deadlineAt || status === "RESOLVED" || status === "REJECTED") return;

    const interval = setInterval(() => {
      const deadline = new Date(deadlineAt).getTime();
      const now = Date.now();
      const diffMs = deadline - now;

      if (diffMs < 0) {
        const overdueHours = Math.max(1, Math.round(Math.abs(diffMs) / (1000 * 3600)));
        const overdueDays = Math.floor(overdueHours / 24);
        setLiveSLA({
          state: "OVERDUE",
          label: overdueDays > 0 ? `Overdue by ${overdueDays}d` : `Overdue by ${overdueHours}h`,
          badgeVariant: "error",
          isOverdue: true,
          hoursOverdue: overdueHours,
          daysOverdue: overdueDays,
          description: "Advisory SLA inspection window has passed. Queued for escalation review.",
        });
      } else {
        const hoursRemaining = Math.round(diffMs / (1000 * 3600));
        const daysRemaining = Math.floor(hoursRemaining / 24);
        setLiveSLA((prev: SLAStatusInfo) => ({
          ...prev,
          label: hoursRemaining <= 24 ? `Due in ${hoursRemaining}h` : `${daysRemaining} days remaining`,
          hoursRemaining,
          daysRemaining,
        }));
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [deadlineAt, status]);

  const formattedDeadline = deadlineAt
    ? new Date(deadlineAt).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Standard SLA Target (21 Days)";

  return (
    <Card className="p-4 sm:p-5 border-border bg-surface shadow-subtle space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              liveSLA.isOverdue
                ? "bg-status-danger/10 text-status-danger"
                : liveSLA.state === "RESOLVED"
                ? "bg-status-success/10 text-status-success"
                : "bg-brand/10 text-brand"
            }`}
          >
            {liveSLA.isOverdue ? (
              <AlertTriangle className="w-4 h-4" />
            ) : liveSLA.state === "RESOLVED" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-content-muted block">
              Application SLA Target
            </span>
            <span className="text-sm font-bold text-content-primary">
              {formattedDeadline}
            </span>
          </div>
        </div>

        <Badge variant={liveSLA.badgeVariant} size="sm">
          {liveSLA.label}
        </Badge>
      </div>

      <p className="text-xs text-content-secondary leading-relaxed">
        {liveSLA.description}
      </p>

      <div className="pt-2 border-t border-border flex items-start gap-1.5 text-[10px] text-content-muted">
        <Info className="w-3.5 h-3.5 text-content-muted shrink-0 mt-0.5" />
        <span>
          <strong>Operational Policy:</strong> PuneSetu benchmarks standard civic grievances against an application service target of up to 21 calendar days. This is an operational goal and does not substitute statutory legal timelines under Maharashtra Right to Public Services Act.
        </span>
      </div>
    </Card>
  );
}
