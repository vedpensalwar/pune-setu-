"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  FileText,
  PhoneCall,
  Search,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language/language-provider";

export interface CivicServiceItem {
  id: string;
  title: string;
  marathi: string;
  href: string;
  icon: React.ElementType;
  summary: string;
  badge: string;
  actionLabel: string;
}

export function ServiceDiscovery() {
  const { t } = useLanguage();

  const services: CivicServiceItem[] = [
    {
      id: "citizen-charter",
      title: "Citizen Charter & Civic Rights",
      marathi: "नागरिक सनद आणि सेवा हमी",
      href: "/services/charter",
      icon: ShieldCheck,
      summary: "Prescribed service standards, designated RTS appellate authorities, and PuneSetu internal resolution targets.",
      badge: "RTS Act Maharashtra",
      actionLabel: "Read Charter",
    },
    {
      id: "ward-directory",
      title: "15 Administrative Wards Directory",
      marathi: "१५ क्षेत्रीय कार्यालय निर्देशिका",
      href: "/services/wards",
      icon: Search,
      summary: "Office addresses, contact phone numbers, Assistant Municipal Commissioners, and localities across all 15 PMC wards.",
      badge: "PMC Prabhags",
      actionLabel: "Explore Wards",
    },
    {
      id: "emergency-helpline",
      title: "Verified Emergency Contacts",
      marathi: "तातडीचे संपर्क क्रमांक",
      href: "/services/emergency",
      icon: PhoneCall,
      summary: "Government-verified emergency lines for Disaster Cell (020-25501269), National ERSS (112), Police, and Medical (108).",
      badge: "24x7 Verified",
      actionLabel: "View Numbers",
    },
    {
      id: "e-tapaal",
      title: "E-Tapaal File Movement Tracker",
      marathi: "ई-टपाल पत्रव्यवहार ट्रॅकिंग",
      href: "/services/etapaal",
      icon: FileText,
      summary: "Track municipal correspondence, inward application letters, and administrative movement ledgers across PMC divisions.",
      badge: "Correspondence Tracker",
      actionLabel: "Track Tapaal",
    },
    {
      id: "civic-assistant",
      title: "Civic Knowledge Assistant",
      marathi: "नागरी ज्ञान सहाय्यक",
      href: "/services/assistant",
      icon: Sparkles,
      summary: "Grounded assistant answering questions on filing grievances, finding ward offices, emergency response, and municipal guidelines.",
      badge: "Corpus-Grounded",
      actionLabel: "Ask Assistant",
    },
    {
      id: "services-hub",
      title: "Civic Services Directory Hub",
      marathi: "नागरी सेवा पोर्टल",
      href: "/services",
      icon: Building2,
      summary: "Comprehensive central gateway connecting citizens to all municipal service directories, guidelines, and helpline registries.",
      badge: "Central Portal",
      actionLabel: "Open Hub",
    },
  ];

  return (
    <section id="service-discovery" className="py-14 sm:py-16 bg-surface text-content-primary border-t border-border">
      <Container size="lg">
        <div className="space-y-10">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-surface border border-brand/15 text-brand text-xs font-semibold tracking-wide uppercase">
              <span>Civic Resources & Directory</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-content-primary tracking-tight">
              {t("services.title")}
            </h2>
            <p className="text-sm sm:text-base text-content-secondary leading-relaxed max-w-xl mx-auto">
              {t("services.subtitle")}
            </p>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="p-6 rounded-2xl border border-border bg-surface hover:border-brand/40 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="w-11 h-11 rounded-xl bg-brand-surface border border-brand/20 flex items-center justify-center text-brand shrink-0">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-content-primary leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-accent font-sans font-semibold mt-0.5">
                        {item.marathi}
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border-subtle flex items-center justify-between">
                    <Badge variant="neutral" size="sm">
                      {item.badge}
                    </Badge>
                    <Link
                      href={item.href}
                      className="text-xs font-semibold text-brand hover:text-accent flex items-center gap-1 transition-colors"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
