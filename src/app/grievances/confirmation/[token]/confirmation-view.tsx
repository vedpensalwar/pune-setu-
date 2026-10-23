"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Check,
  Printer,
  Calendar,
  MapPin,
  Clock,
  Building2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QRCode } from "@/components/ui/qr-code";

interface ConfirmationViewProps {
  grievance: {
    trackingToken: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    landmark?: string | null;
    wardName?: string;
    wardNumber?: number;
    departmentName?: string;
    submittedAt: string;
    deadlineAt?: string | null;
    evidenceCount?: number;
  };
}

export function ConfirmationView({ grievance }: ConfirmationViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(grievance.trackingToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const trackingUrl = typeof window !== "undefined"
    ? `${window.location.origin}/grievances/confirmation/${grievance.trackingToken}`
    : `https://punesetu.gov.in/grievances/confirmation/${grievance.trackingToken}`;

  const formattedSubmitted = new Date(grievance.submittedAt).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedDeadline = grievance.deadlineAt
    ? new Date(grievance.deadlineAt).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Standard SLA Target (3 Days)";

  return (
    <div className="space-y-6">
      {/* 1. Interactive Screen-only Success Notification */}
      <div className="print:hidden space-y-4">
        <div className="p-6 rounded-base border border-status-success/30 bg-status-success/10 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-status-success/20 text-status-success flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <Badge variant="success" size="sm">
              Official Grievance Registered
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary">
              Submission Confirmed
            </h1>
            <p className="text-xs sm:text-sm text-content-secondary max-w-lg mx-auto">
              Your report has been securely registered in the PuneSetu municipal database and queued for Prabhag Ward engineer review.
            </p>
          </div>

          {/* Prominent Copyable Token Bar */}
          <div className="pt-2 max-w-md mx-auto">
            <div className="p-3 rounded-base bg-surface border border-border shadow-sm flex items-center justify-between gap-3">
              <div className="text-left min-w-0">
                <span className="text-[10px] uppercase font-bold text-content-muted tracking-wider block">
                  Public Tracking Token
                </span>
                <span className="font-mono text-base sm:text-lg font-extrabold text-brand truncate block">
                  {grievance.trackingToken}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                leftIcon={copied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print Official Receipt
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/citizen/dashboard">
              <Button variant="ghost" size="sm">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/grievances/new">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                File Another Grievance
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Formal Civic Acknowledgment Receipt (Visible on screen and optimized for Print) */}
      <Card className="p-6 sm:p-8 border-border bg-surface shadow-elevated print:border-none print:shadow-none print:p-0 print:m-0 space-y-6">
        {/* Receipt Municipal Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-base bg-brand text-white flex items-center justify-center font-bold text-xl shrink-0 print:border print:border-black">
              पु
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-content-muted print:text-black">
                Pune Municipal Corporation (PMC)
              </p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-content-primary print:text-black">
                PuneSetu (पुणे सेतू)
              </h2>
              <p className="text-[11px] text-content-secondary print:text-black">
                Official Citizen Grievance Redressal Slip
              </p>
            </div>
          </div>

          {/* QR Code & Token Reference */}
          <div className="flex items-center gap-4 self-start sm:self-center">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-content-muted block print:text-black">
                Token Code
              </span>
              <span className="font-mono text-sm sm:text-base font-extrabold text-brand print:text-black block">
                {grievance.trackingToken}
              </span>
              <span className="text-[10px] text-content-muted print:text-black block">
                Status: {grievance.status}
              </span>
            </div>
            <QRCode value={trackingUrl} size={64} />
          </div>
        </div>

        {/* Complaint Core Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-content-muted font-medium print:text-black">Complaint Subject:</span>
            <p className="text-sm font-bold text-content-primary print:text-black">
              {grievance.title}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-content-muted font-medium print:text-black">Category &amp; Department:</span>
            <p className="font-bold text-content-primary print:text-black">
              {grievance.category.replace(/_/g, " ")} • {grievance.departmentName || "Municipal Maintenance"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-content-muted font-medium print:text-black">Prabhag Ward Jurisdiction:</span>
            <p className="font-bold text-content-primary print:text-black">
              {grievance.wardName ? `Ward ${grievance.wardNumber || ""}: ${grievance.wardName}` : "Central PMC Desk"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-content-muted font-medium print:text-black">Landmark / Location:</span>
            <p className="font-bold text-content-primary print:text-black">
              {grievance.landmark || "Coordinates recorded on file"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-content-muted font-medium print:text-black">Registered Timestamp:</span>
            <p className="font-mono font-medium text-content-primary print:text-black">
              {formattedSubmitted}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-content-muted font-medium print:text-black">Advisory SLA Inspection Target:</span>
            <p className="font-mono font-medium text-brand print:text-black">
              {formattedDeadline}
            </p>
          </div>
        </div>

        {/* Full Complaint Narrative */}
        <div className="space-y-1.5 pt-4 border-t border-border print:border-slate-300">
          <span className="text-xs font-bold text-content-muted uppercase tracking-wider print:text-black">
            Registered Citizen Description:
          </span>
          <p className="text-xs text-content-secondary leading-relaxed bg-surface-subtle p-3 rounded-subtle border border-border print:bg-white print:border-none print:p-0 print:text-black">
            {grievance.description}
          </p>
        </div>

        {/* Legal & Administrative Disclaimer */}
        <div className="pt-4 border-t border-border print:border-slate-300 text-[10px] text-content-muted leading-relaxed space-y-1 print:text-black">
          <p>
            <strong>Official Acknowledgment:</strong> This computer-generated receipt acknowledges the submission of a civic maintenance request under PuneSetu. Target timelines are advisory operational goals and do not constitute statutory legal deadlines.
          </p>
          <p>
            For real-time case updates, scan the QR code above or visit <strong>punesetu.gov.in</strong> and enter your public tracking token. For municipal emergencies, dial <strong>112</strong>.
          </p>
        </div>
      </Card>
    </div>
  );
}
