"use client";

import React, { useState } from "react";
import { AlertTriangle, Send, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CitizenEscalateModalProps {
  trackingToken: string;
  isOpen: boolean;
  onClose: () => void;
  onEscalationSuccess: () => void;
}

export function CitizenEscalateModal({
  trackingToken,
  isOpen,
  onClose,
  onEscalationSuccess,
}: CitizenEscalateModalProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setErrorMsg("Escalation reason must be at least 10 characters long.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/grievances/${trackingToken}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim(),
          details: details.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit escalation request.");
      }

      onEscalationSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while submitting escalation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6 border-border bg-surface shadow-elevated space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2 text-status-danger">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-base font-bold text-content-primary">
              Request Supervisor Escalation
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-content-muted hover:text-content-primary p-1 rounded-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-content-secondary leading-relaxed">
          If your grievance has exceeded its operational deadline or requires urgent administrative intervention by the Prabhag Ward Executive Engineer, you may submit a formal escalation request.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="escalate-reason" className="text-xs font-semibold text-content-primary block">
              Reason for Escalation * (Minimum 10 characters):
            </label>
            <input
              id="escalate-reason"
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Resolution delayed past SLA target, hazard severity increasing"
              className="w-full text-xs p-2.5 rounded-base border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="escalate-details" className="text-xs font-semibold text-content-primary block">
              Additional Ground Observations (Optional):
            </label>
            <textarea
              id="escalate-details"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any recent changes on-site or emergency context..."
              maxLength={1000}
              className="w-full text-xs p-3 rounded-base border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-base bg-status-danger/10 border border-status-danger/30 text-xs text-status-danger flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Submit Escalation
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
