import { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  PhoneCall,
  FileText,
  Sparkles,
  ArrowRight,
  Compass,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Civic Services Hub — PuneSetu (पुणे सेतू)",
  description:
    "Direct access to Pune municipal directories, citizen charters, verified emergency helplines, E-Tapaal file tracking, and civic knowledge assistant.",
};

export default function ServicesHubPage() {
  const services = [
    {
      title: "Citizen Charter & Civic Rights",
      marathi: "नागरिक सनद आणि सेवा हमी",
      href: "/services/charter",
      icon: ShieldCheck,
      badge: "RTS Act Maharashtra",
      badgeVariant: "brand" as const,
      description:
        "Prescribed statutory service standards under the Maharashtra Right to Public Services Act (2015), designated appellate authorities, and PuneSetu internal SLA targets.",
      actionLabel: "Read Charter & SLAs",
    },
    {
      title: "15 Prabhag Wards Directory",
      marathi: "१५ क्षेत्रीय कार्यालय निर्देशिका",
      href: "/services/wards",
      icon: Building2,
      badge: "Verified Addresses",
      badgeVariant: "info" as const,
      description:
        "Official office addresses, Assistant Municipal Commissioners, jurisdictional areas, and direct telephone lines for all 15 Pune Municipal Corporation ward offices.",
      actionLabel: "Explore Ward Directory",
    },
    {
      title: "Verified Emergency Contacts",
      marathi: "तातडीचे संपर्क क्रमांक",
      href: "/services/emergency",
      icon: PhoneCall,
      badge: "24x7 Helplines",
      badgeVariant: "error" as const,
      description:
        "Government-verified emergency dispatch telephone lines for Disaster Management (020-25501269), National ERSS (112), Police (100), Fire (101), and Medical (108).",
      actionLabel: "View Verified Numbers",
    },
    {
      title: "E-Tapaal File Movement Tracker",
      marathi: "ई-टपाल पत्रव्यवहार ट्रॅकिंग",
      href: "/services/etapaal",
      icon: FileText,
      badge: "Demonstration Mode",
      badgeVariant: "warning" as const,
      description:
        "Track municipal correspondence, inward applications, and administrative file movement across PMC engineering divisions with an authentic movement ledger.",
      actionLabel: "Track Tapaal Record",
    },
    {
      title: "Civic Knowledge Assistant",
      marathi: "नागरी ज्ञान सहाय्यक",
      href: "/services/assistant",
      icon: Sparkles,
      badge: "Grounded AI Engine",
      badgeVariant: "brand" as const,
      description:
        "Grounded conversational assistant answering citizen questions on filing grievances, finding ward offices, emergency response, and municipal service guidelines.",
      actionLabel: "Chat with Assistant",
    },
  ];

  return (
    <>
      <PublicHeader />
      <main id="main-content" className="min-h-screen bg-background text-content-primary py-8 sm:py-12">
        <Container size="lg">
          {/* Header */}
          <div className="mb-8 border-b border-border pb-6">
            <div className="inline-flex items-center gap-2 mb-3">
              <Badge variant="brand" size="md">
                <Compass className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                Civic Services Directory
              </Badge>
              <span className="text-xs text-content-secondary">
                Pune Municipal Corporation
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-content-primary mb-2">
              Civic Services & Municipal Information Hub
            </h1>
            <p className="text-sm sm:text-base text-content-secondary max-w-3xl leading-relaxed">
              Explore officially verified municipal directories, citizen rights under Maharashtra RTS Act, 24x7 emergency control lines, and file movement tracking.
            </p>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {services.map((srv) => {
              const Icon = srv.icon;
              return (
                <Card
                  key={srv.href}
                  className="p-6 flex flex-col justify-between hover:shadow-card hover:border-brand/40 transition-all duration-150"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-base bg-brand-surface text-brand flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <Badge variant={srv.badgeVariant} size="sm">
                        {srv.badge}
                      </Badge>
                    </div>

                    <h2 className="text-base font-bold text-content-primary mb-0.5">
                      {srv.title}
                    </h2>
                    <p className="text-xs font-semibold text-accent font-sans mb-3">
                      {srv.marathi}
                    </p>
                    <p className="text-xs text-content-secondary leading-relaxed mb-4">
                      {srv.description}
                    </p>
                  </div>

                  <Link href={srv.href} className="pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      className="w-full text-xs font-semibold justify-between"
                    >
                      <span>{srv.actionLabel}</span>
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions Footer Card */}
          <div className="p-6 rounded-base border border-border bg-surface-muted/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-content-primary">Need to report an active civic problem?</h3>
              <p className="text-xs text-content-secondary">
                Submit an issue with location, photograph evidence, and track verified resolution updates.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/track">
                <Button variant="outline" size="sm">
                  Track Complaint
                </Button>
              </Link>
              <Link href="/grievances/new">
                <Button variant="accent" size="sm">
                  Report Civic Issue
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </main>
      <PublicFooter />
    </>
  );
}
