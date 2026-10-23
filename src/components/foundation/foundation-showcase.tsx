"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
  Sliders,
  Bell,
  Sparkles,
  Info,
  Terminal,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ThemeSelector } from "@/components/theme/theme-selector";

export function FoundationShowcase() {
  const { toast } = useToast();

  // Component preview interactive states
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [showInputError, setShowInputError] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"components" | "tokens" | "typography">("components");

  const wardOptions = [
    { value: "shivajinagar", label: "Ward 07 — Shivajinagar / Ghole Road" },
    { value: "kothrud", label: "Ward 12 — Kothrud / Bavdhan" },
    { value: "kasba", label: "Ward 04 — Kasba Peth / Vishrambaug" },
    { value: "hadapsar", label: "Ward 15 — Hadapsar / Mundhwa" },
    { value: "aundh", label: "Ward 01 — Aundh / Baner" },
  ];

  const handleTestToast = (type: "success" | "error" | "warning" | "info") => {
    switch (type) {
      case "success":
        toast({
          type: "success",
          title: "Design System Verified",
          message: "All semantic tokens and accessibility states are active.",
        });
        break;
      case "warning":
        toast({
          type: "warning",
          title: "Simulated System Notice",
          message: "Service deadline alerts will use this high-contrast indicator.",
        });
        break;
      case "error":
        toast({
          type: "error",
          title: "Validation Triggered",
          message: "Input validation boundaries prevent incorrect data submission.",
        });
        break;
      case "info":
        toast({
          type: "info",
          title: "Theme Preference Synced",
          message: "Your visual appearance selection has been saved to local storage.",
        });
        break;
    }
  };

  return (
    <div className="space-y-12">
      {/* Design System & Architecture Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-base border border-border bg-surface shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-base bg-brand-surface border border-brand/20 flex items-center justify-center text-brand shrink-0">
            <Building2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-content-primary tracking-wide uppercase">
                Architecture Standard
              </span>
              <Badge variant="brand" size="sm">
                Version 1.0 Foundation
              </Badge>
            </div>
            <p className="text-xs text-content-secondary mt-0.5">
              Strict light-first design • WCAG AAA high-contrast • Devanagari typography
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-content-secondary hidden md:inline">
            Appearance:
          </span>
          <ThemeSelector variant="pills" />
        </div>
      </div>

      {/* Navigation Tabs for Inspection */}
      <div className="border-b border-border flex items-center gap-2 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("components")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors duration-150 flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === "components"
              ? "border-brand text-brand"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
        >
          <Sliders className="w-4 h-4" aria-hidden="true" />
          <span>UI Components & States</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tokens")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors duration-150 flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === "tokens"
              ? "border-brand text-brand"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <span>Semantic Tokens</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("typography")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors duration-150 flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === "typography"
              ? "border-brand text-brand"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
        >
          <FileText className="w-4 h-4" aria-hidden="true" />
          <span>Typography & Bilingual Scale</span>
        </button>
      </div>

      {/* TAB 1: UI COMPONENTS & INTERACTIVE STATES */}
      {activeTab === "components" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Buttons & Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Button Hierarchy & States</CardTitle>
                <Badge variant="neutral" size="sm">
                  Interactive
                </Badge>
              </div>
              <CardDescription>
                Consistent button variants with loading protection, keyboard focus rings, and touch targets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  isLoading={isButtonLoading}
                  onClick={() =>
                    toast({
                      type: "info",
                      title: "Primary Button Clicked",
                      message: "Dispatched primary municipal action event.",
                    })
                  }
                >
                  Primary Action
                </Button>
                <Button
                  variant="accent"
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  onClick={() =>
                    toast({
                      type: "info",
                      title: "Accent Button Clicked",
                      message: "Dispatched saffron accent action event.",
                    })
                  }
                >
                  Saffron Accent
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    toast({
                      type: "info",
                      title: "Secondary Button Clicked",
                      message: "Dispatched secondary action event.",
                    })
                  }
                >
                  Secondary
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast({
                      type: "info",
                      title: "Outline Button Clicked",
                      message: "Dispatched outline action event.",
                    })
                  }
                >
                  Outline
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    toast({
                      type: "info",
                      title: "Ghost Button Clicked",
                      message: "Dispatched ghost action event.",
                    })
                  }
                >
                  Ghost
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    toast({
                      type: "error",
                      title: "Destructive Button Clicked",
                      message: "Dispatched destructive confirmation alert.",
                    })
                  }
                >
                  Destructive
                </Button>
              </div>

              <div className="p-3.5 rounded-base border border-border-subtle bg-surface-muted flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs text-content-secondary">
                  <span className="font-semibold text-content-primary">Duplicate Submission Guard:</span> Test button loading state.
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextState = !isButtonLoading;
                    setIsButtonLoading(nextState);
                    toast({
                      type: nextState ? "warning" : "success",
                      title: nextState ? "Loading State Active" : "Loading State Cleared",
                      message: nextState
                        ? "Button click is protected and submission is disabled."
                        : "Button restored to active interaction state.",
                    });
                  }}
                >
                  {isButtonLoading ? "Reset Normal State" : "Simulate Loading"}
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-content-primary uppercase tracking-wide">
                  Button Sizes
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      toast({
                        type: "info",
                        title: "Small Button Clicked",
                        message: "Small size height: 32px verified.",
                      })
                    }
                  >
                    Small (32px)
                  </Button>
                  <Button
                    size="md"
                    variant="primary"
                    onClick={() =>
                      toast({
                        type: "info",
                        title: "Medium Button Clicked",
                        message: "Medium size height: 40px verified.",
                      })
                    }
                  >
                    Medium (40px)
                  </Button>
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={() =>
                      toast({
                        type: "info",
                        title: "Large Button Clicked",
                        message: "Large size height: 44px verified.",
                      })
                    }
                  >
                    Large (44px)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Form Controls & Validation */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Inputs & Selection Controls</CardTitle>
                <Badge variant="neutral" size="sm">
                  Accessible
                </Badge>
              </div>
              <CardDescription>
                Labels, helper text, accessible IDs, and WCAG-compliant error states.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Ward Reference or Citizen Identifier"
                required
                placeholder="e.g. PS-PUN-2026-10492"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                description="Unique identifier follows the standard PS-PUN-YYYY-XXXXXX format."
                error={showInputError ? "Invalid tracking format. Must begin with PS-PUN-." : undefined}
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-content-secondary">
                  Toggle simulated validation failure:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextError = !showInputError;
                    setShowInputError(nextError);
                    toast({
                      type: nextError ? "error" : "success",
                      title: nextError ? "Input Error Triggered" : "Input Error Cleared",
                      message: nextError
                        ? "ARIA invalid state and role=alert active."
                        : "Field state restored to valid.",
                    });
                  }}
                >
                  {showInputError ? "Clear Error" : "Trigger Error"}
                </Button>
              </div>

              <Select
                label="Municipal Administrative Ward"
                required
                options={wardOptions}
                placeholder="Select an administrative ward"
                value={selectedWard}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedWard(val);
                  const opt = wardOptions.find((w) => w.value === val);
                  if (opt) {
                    toast({
                      type: "info",
                      title: "Ward Selected",
                      message: `Jurisdiction updated to ${opt.label}.`,
                    });
                  }
                }}
                description="Configured boundaries for municipal operations in Pune."
              />
            </CardContent>
          </Card>

          {/* Card 3: Badges & Status Indicators */}
          <Card>
            <CardHeader>
              <CardTitle>Status Indicators & Badges</CardTitle>
              <CardDescription>
                Semantic indicators paired with explicit text. Meaning is never conveyed by colour alone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral" dot>Neutral Record</Badge>
                <Badge variant="brand" dot>Official Review</Badge>
                <Badge variant="accent" dot>Action Required</Badge>
                <Badge variant="success" dot>Resolved & Verified</Badge>
                <Badge variant="warning" dot>Approaching Deadline</Badge>
                <Badge variant="error" dot>Escalated Case</Badge>
                <Badge variant="info" dot>Information Logged</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-base border border-border bg-surface-muted">
                  <p className="text-xs font-semibold text-content-primary">Standard Size</p>
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    <Badge variant="success">Submitted</Badge>
                    <Badge variant="brand">Assigned</Badge>
                    <Badge variant="warning">In Progress</Badge>
                  </div>
                </div>
                <div className="p-3 rounded-base border border-border bg-surface-muted">
                  <p className="text-xs font-semibold text-content-primary">Compact Size</p>
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    <Badge size="sm" variant="success">Closed</Badge>
                    <Badge size="sm" variant="error">Overdue</Badge>
                    <Badge size="sm" variant="info">Notice</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Dialogs, Toasts & Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Dialogs & Notification Triggers</CardTitle>
              <CardDescription>
                Accessible modal dialog with focus trapping and timed toast notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-content-primary uppercase tracking-wide">
                  Modal Dialog Test
                </p>
                <Button
                  variant="primary"
                  onClick={() => setIsDialogOpen(true)}
                  leftIcon={<Eye className="w-4 h-4" />}
                >
                  Open Accessible Dialog Preview
                </Button>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-content-primary uppercase tracking-wide">
                  Toast Notification Dispatcher
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestToast("success")}
                  >
                    Success Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestToast("warning")}
                  >
                    Warning Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestToast("error")}
                  >
                    Error Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestToast("info")}
                  >
                    Info Toast
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-content-primary uppercase tracking-wide">
                  Loading Skeletons & Spinner
                </p>
                <div className="flex items-center gap-4">
                  <Spinner size="md" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: SEMANTIC DESIGN TOKENS */}
      {activeTab === "tokens" && (
        <Card elevated>
          <CardHeader>
            <CardTitle>Centralised Semantic Token Palette</CardTitle>
            <CardDescription>
              Cohesive color system designed for civic authority, restrained saffron highlights, and complete theme harmony.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Brand Navy */}
              <div className="p-4 rounded-base border border-border bg-surface flex flex-col justify-between h-36">
                <div>
                  <div className="w-8 h-8 rounded-subtle bg-brand border border-border mb-2" />
                  <p className="text-sm font-semibold text-content-primary">Brand Navy</p>
                  <p className="text-xs text-content-secondary">Primary authority token</p>
                </div>
                <code className="text-xs text-content-muted font-mono">var(--brand) • #172B4D</code>
              </div>

              {/* Saffron Accent */}
              <div className="p-4 rounded-base border border-border bg-surface flex flex-col justify-between h-36">
                <div>
                  <div className="w-8 h-8 rounded-subtle bg-accent border border-border mb-2" />
                  <p className="text-sm font-semibold text-content-primary">Saffron Accent</p>
                  <p className="text-xs text-content-secondary">Action & emphasis highlight</p>
                </div>
                <code className="text-xs text-content-muted font-mono">var(--accent) • #F47721</code>
              </div>

              {/* Background Surface */}
              <div className="p-4 rounded-base border border-border bg-surface flex flex-col justify-between h-36">
                <div>
                  <div className="w-8 h-8 rounded-subtle bg-background border border-border mb-2" />
                  <p className="text-sm font-semibold text-content-primary">Page Canvas</p>
                  <p className="text-xs text-content-secondary">Warm, readable light base</p>
                </div>
                <code className="text-xs text-content-muted font-mono">var(--background) • #F7F8FA</code>
              </div>

              {/* Success */}
              <div className="p-4 rounded-base border border-border bg-surface flex flex-col justify-between h-36">
                <div>
                  <div className="w-8 h-8 rounded-subtle bg-status-success border border-border mb-2" />
                  <p className="text-sm font-semibold text-content-primary">Success Green</p>
                  <p className="text-xs text-content-secondary">Resolution & verification</p>
                </div>
                <code className="text-xs text-content-muted font-mono">var(--success) • #17845B</code>
              </div>

              {/* Warning */}
              <div className="p-4 rounded-base border border-border bg-surface flex flex-col justify-between h-36">
                <div>
                  <div className="w-8 h-8 rounded-subtle bg-status-warning border border-border mb-2" />
                  <p className="text-sm font-semibold text-content-primary">Warning Amber</p>
                  <p className="text-xs text-content-secondary">Deadline & SLA warnings</p>
                </div>
                <code className="text-xs text-content-muted font-mono">var(--warning) • #B7791F</code>
              </div>

              {/* Error */}
              <div className="p-4 rounded-base border border-border bg-surface flex flex-col justify-between h-36">
                <div>
                  <div className="w-8 h-8 rounded-subtle bg-status-error border border-border mb-2" />
                  <p className="text-sm font-semibold text-content-primary">Error Crimson</p>
                  <p className="text-xs text-content-secondary">Escalation & critical alerts</p>
                </div>
                <code className="text-xs text-content-muted font-mono">var(--error) • #C83E4D</code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: TYPOGRAPHY & BILINGUAL SCALE */}
      {activeTab === "typography" && (
        <Card>
          <CardHeader>
            <CardTitle>Typography System & Script Adaptability</CardTitle>
            <CardDescription>
              Built to support English, Marathi (मराठी), and Hindi (हिंदी) with consistent baselines and zero text clipping.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-base border border-border-subtle bg-surface-muted">
                <span className="text-xs font-bold text-content-muted uppercase tracking-wider block mb-1">
                  Display Heading (28px - 36px)
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
                  PuneSetu: Civic Grievance Redressal
                </p>
                <p className="text-xl sm:text-2xl font-bold text-content-primary mt-1">
                  पुणे सेतू: नागरिक तक्रार निवारण आणि महापालिका कामकाज
                </p>
              </div>

              <div className="p-4 rounded-base border border-border-subtle bg-surface-muted">
                <span className="text-xs font-bold text-content-muted uppercase tracking-wider block mb-1">
                  Section Heading (18px - 22px)
                </span>
                <p className="text-lg font-bold text-content-primary">
                  Community Issue Discovery & Real-Time Tracking
                </p>
                <p className="text-base font-semibold text-content-primary mt-0.5">
                  स्थानिक समस्या शोध आणि पारदर्शक पाठपुरावा
                </p>
              </div>

              <div className="p-4 rounded-base border border-border-subtle bg-surface-muted">
                <span className="text-xs font-bold text-content-muted uppercase tracking-wider block mb-1">
                  Body & Descriptive Copy (14px - 16px)
                </span>
                <p className="text-sm text-content-secondary leading-relaxed">
                  Citizens submit geotagged issues, attach evidence photos, receive unambiguous tracking tokens, and review resolution reports submitted by verified municipal officers.
                </p>
                <p className="text-sm text-content-secondary leading-relaxed mt-2">
                  नागरिक छायाचित्रांसह तक्रार दाखल करू शकतात, अधिकृत ट्रॅकिंग क्रमांक मिळवू शकतात आणि महापालिका अधिकाऱ्यांनी सादर केलेले निवारण पुरावे तपासू शकतात.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accessible Dialog Implementation */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Verification Dialog — PuneSetu Design System"
        description="This modal demonstrates focus trapping, escape key closure, and backdrop dismissal."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
              Close Dialog
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsDialogOpen(false);
                toast({
                  type: "success",
                  title: "Action Confirmed",
                  message: "Dialog confirmation executed smoothly.",
                });
              }}
            >
              Confirm Action
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-content-secondary">
            All interactive dialogs in PuneSetu trap keyboard focus strictly within the dialog while open, restore body scrolling upon unmount, and announce headings accurately to assistive screen readers.
          </p>
          <div className="p-3 rounded-base bg-surface-muted border border-border-subtle text-xs text-content-secondary">
            <span className="font-semibold text-content-primary">Accessibility Test:</span> Press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border font-mono text-content-primary">Tab</kbd> to cycle between buttons, or press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border font-mono text-content-primary">Esc</kbd> to dismiss.
          </div>
        </div>
      </Dialog>
    </div>
  );
}
