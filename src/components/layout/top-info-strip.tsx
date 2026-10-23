"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, PhoneCall, Shield } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function TopInfoStrip() {
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  const emergencyContacts = [
    { service: "National Integrated Emergency Helpline", number: "112", desc: "All emergencies (Police, Fire, Medical)" },
    { service: "Police Control Room (Pune City)", number: "100 / 020-26126296", desc: "Law enforcement & safety" },
    { service: "Fire Brigade Control Room", number: "101 / 020-26451707", desc: "Fire safety and rescue operations" },
    { service: "Medical Emergency / Ambulance", number: "108", desc: "Government emergency medical response" },
    { service: "PMC Central Disaster Management Cell", number: "020-25501269 / 020-25506800", desc: "Monsoon floods & municipal disaster alerts" },
    { service: "Childline (Support & Protection)", number: "1098", desc: "Child protection and emergency welfare" },
  ];

  return (
    <>
      <div className="bg-surface-muted/90 text-content-secondary text-[11px] py-1.5 border-b border-border transition-colors">
        <Container size="lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-4">
            <div className="flex items-center gap-2 text-center sm:text-left flex-wrap justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
                Pune Civic Network
              </span>
              <span className="text-content-secondary">
                15 Administrative Prabhag Wards • Independent Civic Redressal Platform (Neighborhood Hacks 2026)
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsEmergencyModalOpen(true)}
                className="inline-flex items-center gap-1.5 font-medium text-content-primary hover:text-accent transition-colors group focus-visible:ring-1 focus-visible:ring-focus-ring"
              >
                <PhoneCall className="w-3.5 h-3.5 text-accent group-hover:scale-110 transition-transform" aria-hidden="true" />
                <span className="underline-offset-4 group-hover:underline">Helplines (112 / 100)</span>
              </button>

              <span className="text-content-muted hidden sm:inline" aria-hidden="true">•</span>

              <Link
                href="/staff/login"
                className="hidden sm:inline-flex items-center gap-1 font-medium text-content-secondary hover:text-brand transition-colors focus-visible:ring-1 focus-visible:ring-focus-ring text-[11px]"
              >
                <Shield className="w-3 h-3 text-brand" aria-hidden="true" />
                <span>Staff Portal</span>
              </Link>
            </div>
          </div>
        </Container>
      </div>

      {/* Emergency Contacts Dialog */}
      <Dialog
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        title="Verified Emergency & Disaster Helplines — Pune"
        description="Public safety and verified emergency contacts for Pune citizens. For life-threatening emergencies, dial 112 immediately."
        footer={
          <Button variant="primary" size="sm" onClick={() => setIsEmergencyModalOpen(false)}>
            Close Emergency Directory
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="p-3 rounded-base bg-status-warning-surface border border-status-warning-border text-xs text-status-warning flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              PuneSetu is for non-emergency municipal grievances. In active crises, fires, or medical emergencies, call the authorized numbers below directly.
            </span>
          </div>

          <div className="divide-y divide-border border border-border rounded-base overflow-hidden">
            {emergencyContacts.map((c) => (
              <div key={c.service} className="p-3 bg-surface hover:bg-surface-muted flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-content-primary">{c.service}</p>
                  <p className="text-[11px] text-content-secondary">{c.desc}</p>
                </div>
                <a
                  href={`tel:${c.number.split(" ")[0].replace(/[^0-9]/g, "")}`}
                  className="px-2.5 py-1 rounded bg-brand-surface text-brand font-mono font-bold text-xs hover:bg-brand hover:text-brand-contrast transition-colors shrink-0"
                >
                  {c.number}
                </a>
              </div>
            ))}
          </div>
        </div>
      </Dialog>
    </>
  );
}
