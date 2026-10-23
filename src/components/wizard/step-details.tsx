"use client";

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Mic,
  MicOff,
  Flame,
  Clock,
  Sparkles,
  Building2,
  ShieldAlert,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoryLabel, getPriorityLabel } from "@/lib/civic/display";
import { useLanguage } from "@/components/language/language-provider";

export interface DetailsData {
  title: string;
  description: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
  departmentId: string;
  departmentName?: string;
}

interface StepDetailsProps {
  data: DetailsData;
  onChange: (data: DetailsData) => void;
  onNext: () => void;
  onBack: () => void;
}

interface DepartmentOption {
  id: string;
  name: string;
  code: string;
  description?: string;
}

const CATEGORIES = [
  { id: "ROADS_POTHOLES", name: "Roads & Potholes", icon: "🛣️", defaultDeptCode: "ROAD_TRAFFIC", desc: "Potholes, broken asphalt, pavers & road safety" },
  { id: "SOLID_WASTE", name: "Solid Waste Management", icon: "🗑️", defaultDeptCode: "SOLID_WASTE", desc: "Garbage dumps, overflowing bins & street sweeping" },
  { id: "WATER_SUPPLY", name: "Water Supply", icon: "🚰", defaultDeptCode: "WATER_SUPPLY", desc: "Pipeline leakages, low water pressure & contamination" },
  { id: "SEWAGE_DRAINAGE", name: "Drainage & Sewage", icon: "🌊", defaultDeptCode: "DRAINAGE", desc: "Blocked gutters, open manholes & stormwater drains" },
  { id: "STREET_LIGHTING", name: "Street Lighting", icon: "💡", defaultDeptCode: "STREET_LIGHT", desc: "Dark spots, non-functional street lamps & wiring" },
  { id: "ENCROACHMENT", name: "Encroachment Removal", icon: "🚫", defaultDeptCode: "ENCROACHMENT", desc: "Footpath obstruction & unauthorized commercial hoardings" },
  { id: "HEALTH_SANITATION", name: "Public Health & Sanitation", icon: "🏥", defaultDeptCode: "PUBLIC_HEALTH", desc: "Mosquito breeding, fogging & public urinal cleanliness" },
  { id: "GARDENS_PARKS", name: "Parks & Gardens", icon: "🌳", defaultDeptCode: "GARDEN_PARK", desc: "Fallen trees, park maintenance & playground equipment" },
  { id: "OTHER", name: "Other Civic Issues", icon: "📋", defaultDeptCode: "ROAD_TRAFFIC", desc: "General civic maintenance & municipal infrastructure" },
];

const PRIORITIES: Array<{
  id: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
  label: string;
  sla: string;
  badge: "neutral" | "brand" | "warning" | "danger";
  desc: string;
}> = [
  { id: "LOW", label: "Low Priority", sla: "Advisory target: 7 Days (168h)", badge: "neutral", desc: "Minor aesthetic or long-term civic enhancements" },
  { id: "MEDIUM", label: "Medium (Standard)", sla: "Advisory target: 3 Days (72h)", badge: "brand", desc: "Normal municipal service request" },
  { id: "HIGH", label: "High Urgency", sla: "Advisory target: 24 Hours", badge: "warning", desc: "Direct citizen hindrance, high-traffic blockage" },
  { id: "EMERGENCY", label: "Emergency Safety", sla: "Target: 6 Hours inspection", badge: "danger", desc: "Immediate public safety hazard or cave-in" },
];

export function StepDetails({ data, onChange, onNext, onBack }: StepDetailsProps) {
  const { t } = useLanguage();
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState<"en-IN" | "mr-IN" | "hi-IN">("en-IN");
  const [speechError, setSpeechError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.departments) {
          setDepartments(json.departments);
          // If no department selected yet, default from category
          if (!data.departmentId) {
            const catObj = CATEGORIES.find((c) => c.id === data.category);
            const matchingDept = json.departments.find(
              (d: DepartmentOption) => d.code === catObj?.defaultDeptCode
            );
            if (matchingDept) {
              onChange({
                ...data,
                departmentId: matchingDept.id,
                departmentName: matchingDept.name,
              });
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDepts(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    const cat = CATEGORIES.find((c) => c.id === categoryId);
    let matchedDeptId = data.departmentId;
    let matchedDeptName = data.departmentName;

    if (departments.length > 0 && cat?.defaultDeptCode) {
      const found = departments.find((d) => d.code === cat.defaultDeptCode);
      if (found) {
        matchedDeptId = found.id;
        matchedDeptName = found.name;
      }
    }

    onChange({
      ...data,
      category: categoryId,
      departmentId: matchedDeptId,
      departmentName: matchedDeptName,
    });
  };

  // Speech Recognition Handler
  const toggleSpeechRecognition = () => {
    setSpeechError(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in this browser. Please type your description manually.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLanguage;
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const updated = data.description
            ? `${data.description} ${transcript}`
            : transcript;
          onChange({ ...data, description: updated });
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === "not-allowed") {
          setSpeechError("Microphone access was denied. Please allow microphone permissions.");
        } else {
          setSpeechError("Speech recognition did not catch audio clearly. Please try again.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setSpeechError("Could not start speech recognition.");
      setIsListening(false);
    }
  };

  const handleNext = () => {
    if (!data.title || data.title.trim().length < 5) {
      setValidationError("Please enter a complaint title of at least 5 characters.");
      return;
    }
    if (!data.description || data.description.trim().length < 10) {
      setValidationError("Please describe the issue in at least 10 characters.");
      return;
    }
    if (!data.category) {
      setValidationError("Please select an issue category.");
      return;
    }
    setValidationError(null);
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="brand" size="sm">
            Step 3 of 5
          </Badge>
          <span className="text-xs text-content-muted">Classification &amp; Urgency</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-content-primary">
          Describe the Civic Issue
        </h2>
        <p className="text-xs sm:text-sm text-content-secondary mt-1">
          Select the correct category, assign priority, and provide details for PMC field engineers.
        </p>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="p-3.5 rounded-base bg-status-danger/10 border border-status-danger/20 flex items-start gap-2.5 text-xs text-status-danger">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* 1. Category Selection Cards */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-content-primary uppercase tracking-wide">
          Select Civic Issue Category <span className="text-status-danger">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {CATEGORIES.map((cat) => {
            const isSelected = data.category === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`text-left p-3 rounded-base border transition-all text-xs flex flex-col justify-between ${
                  isSelected
                    ? "border-brand bg-brand/10 ring-2 ring-brand/20 shadow-sm"
                    : "border-border bg-surface hover:border-brand/40 hover:bg-surface-hover"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="font-bold text-content-primary">{getCategoryLabel(cat.id, t) || cat.name}</span>
                  </div>
                  <p className="text-[11px] text-content-muted line-clamp-2">{cat.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Department & Priority Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Department Association */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-content-primary">
            Responsible Municipal Department
          </label>
          <select
            value={data.departmentId}
            onChange={(e) => {
              const selectedId = e.target.value;
              const found = departments.find((d) => d.id === selectedId);
              onChange({
                ...data,
                departmentId: selectedId,
                departmentName: found?.name,
              });
            }}
            disabled={loadingDepts}
            className="w-full h-10 px-3 text-xs rounded-base border border-border bg-surface text-content-primary focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-content-muted">
            Automatically mapped from category, or adjust manually if required.
          </p>
        </div>

        {/* Urgency Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-content-primary">
            Issue Urgency Level <span className="text-status-danger">*</span>
          </label>
          <select
            value={data.priority}
            onChange={(e) => onChange({ ...data, priority: e.target.value as any })}
            className="w-full h-10 px-3 text-xs rounded-base border border-border bg-surface text-content-primary focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} — {p.sla}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-content-muted">
            Configurable municipal application target; not a statutory deadline.
          </p>
        </div>
      </div>

      {/* Emergency Guidance Banner */}
      {data.priority === "EMERGENCY" && (
        <div className="rounded-base border border-status-danger/30 bg-status-danger/10 p-4 text-xs text-status-danger flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Life-Threatening Emergency Notice</p>
            <p className="text-content-secondary leading-relaxed">
              If this incident poses an immediate danger to human life (e.g. active building collapse, gas leakage, live fallen high-voltage power lines), please dial <strong>112 (National Emergency)</strong> or <strong>101 (Fire Brigade)</strong> immediately. PuneSetu grievance redressal is for civic infrastructure repair.
            </p>
          </div>
        </div>
      )}

      {/* 3. Title Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-content-primary">
            Brief Complaint Title <span className="text-status-danger">*</span>
          </label>
          <span className="text-[11px] text-content-muted">{data.title.length}/150</span>
        </div>
        <input
          type="text"
          placeholder="e.g. Deep pothole on Ferguson College Road causing two-wheeler skids"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          maxLength={150}
          className="w-full h-10 px-3 text-xs rounded-base border border-border bg-surface text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {/* 4. Description with Speech-to-Text */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-content-primary">
            Detailed Issue Description <span className="text-status-danger">*</span>
          </label>
          <div className="flex items-center gap-2">
            {/* Language Selector for Speech */}
            <select
              value={speechLanguage}
              onChange={(e) => setSpeechLanguage(e.target.value as any)}
              className="text-[11px] bg-surface-subtle border border-border rounded px-1.5 py-0.5 text-content-secondary focus:outline-none"
              title="Voice language"
            >
              <option value="en-IN">English (India)</option>
              <option value="mr-IN">मराठी (Marathi)</option>
              <option value="hi-IN">हिन्दी (Hindi)</option>
            </select>

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded transition-colors ${
                isListening
                  ? "bg-status-danger text-white animate-pulse"
                  : "bg-brand/10 text-brand hover:bg-brand/20"
              }`}
            >
              {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              <span>{isListening ? "Listening..." : "Voice Input"}</span>
            </button>

            <span className="text-[11px] text-content-muted">{data.description.length}/2000</span>
          </div>
        </div>

        {speechError && (
          <p className="text-[11px] text-status-danger flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>{speechError}</span>
          </p>
        )}

        <textarea
          rows={5}
          placeholder="Describe what happened, how long the issue has persisted, exact physical impact, and specific hazards..."
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          maxLength={2000}
          className="w-full p-3 text-xs rounded-base border border-border bg-surface text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand leading-relaxed"
        />
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onBack}>
          Back to Location
        </Button>
        <Button type="button" variant="primary" onClick={handleNext}>
          Check Similar Grievances
        </Button>
      </div>
    </div>
  );
}
