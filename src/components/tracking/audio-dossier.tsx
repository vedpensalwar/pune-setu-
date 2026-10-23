"use client";

import React, { useEffect, useState, useRef } from "react";
import { Volume2, Play, Pause, Square, Globe, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AudioDossierProps {
  trackingToken: string;
  title: string;
  category: string;
  status: string;
  departmentName?: string;
  wardName?: string;
  landmark?: string | null;
  submittedAt: string;
  deadlineAt?: string | null;
  latestNote?: string | null;
}

type AudioLang = "en-IN" | "mr-IN" | "hi-IN";

export function AudioDossier({
  trackingToken,
  title,
  category,
  status,
  departmentName,
  wardName,
  landmark,
  submittedAt,
  deadlineAt,
  latestNote,
}: AudioDossierProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [selectedLang, setSelectedLang] = useState<AudioLang>("en-IN");
  const [playbackState, setPlaybackState] = useState<"idle" | "playing" | "paused">("idle");
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        setIsSupported(true);
      }
    }, 0);

    // Clean up when unmounting
    return () => {
      clearTimeout(timer);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Construct localized public complaint summary script
  const getScript = (lang: AudioLang): string => {
    const formattedDate = new Date(submittedAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    if (lang === "mr-IN") {
      return `पुणे सेतू तक्रार सारांश. ट्रॅकिंग कोड: ${trackingToken}. तक्रार विषय: ${title}. श्रेणी: ${category.replace(/_/g, " ")}. सध्याची स्थिती: ${status.replace(/_/g, " ")}. प्रभाग कार्यालय: ${wardName || "पुणे महानगरपालिका"}. नोंदणी दिनांक: ${formattedDate}. ${latestNote ? `ताजी माहिती: ${latestNote}.` : ""} अधिक माहितीसाठी पुणे सेतू पोर्टल पहा.`;
    }

    if (lang === "hi-IN") {
      return `पुणे सेतू शिकायत सारांश. ट्रैकिंग कोड: ${trackingToken}. विषय: ${title}. श्रेणी: ${category.replace(/_/g, " ")}. वर्तमान स्थिति: ${status.replace(/_/g, " ")}. संबंधित विभाग: ${departmentName || "नगर निगम"}. पंजीकरण तारीख: ${formattedDate}. ${latestNote ? `नवीनतम विवरण: ${latestNote}.` : ""} विवरण के लिए पुणे सेतू देखें.`;
    }

    return `PuneSetu civic case audio summary. Tracking token: ${trackingToken}. Complaint subject: ${title}. Category: ${category.replace(/_/g, " ")}. Current recorded status: ${status.replace(/_/g, " ")}. Responsible department: ${departmentName || "Municipal Operations"}. Prabhag ward: ${wardName || "Central Desk"}. Submitted on: ${formattedDate}. ${latestNote ? `Latest progress update: ${latestNote}.` : ""} For complete audit timeline, review the PuneSetu portal.`;
  };

  const handlePlay = () => {
    if (!isSupported) return;

    if (playbackState === "paused") {
      window.speechSynthesis.resume();
      setPlaybackState("playing");
      return;
    }

    window.speechSynthesis.cancel();

    const script = getScript(selectedLang);
    const utterance = new SpeechSynthesisUtterance(script);
    utteranceRef.current = utterance;
    utterance.lang = selectedLang;
    utterance.rate = 0.95; // Clear conversational pace

    // Attempt to pick matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(
      (v) => v.lang.toLowerCase() === selectedLang.toLowerCase() || v.lang.startsWith(selectedLang.split("-")[0])
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
      setVoiceAvailable(true);
    } else {
      setVoiceAvailable(true); // Browser fallback voice will be used
    }

    utterance.onstart = () => {
      setPlaybackState("playing");
    };

    utterance.onend = () => {
      setPlaybackState("idle");
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis notice:", e);
      setPlaybackState("idle");
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setPlaybackState("paused");
  };

  const handleStop = () => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setPlaybackState("idle");
  };

  const handleLangChange = (lang: AudioLang) => {
    handleStop();
    setSelectedLang(lang);
  };

  if (!isSupported) {
    return (
      <Card className="p-4 border-border bg-surface text-xs text-content-muted flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-content-muted shrink-0" />
        <span>Audio summary is not supported by your current browser. You can read the printed complaint slip below.</span>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5 border-border bg-surface shadow-subtle space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-content-muted block">
              Accessibility Feature
            </span>
            <h3 className="text-sm font-bold text-content-primary">
              Civic Audio Dossier &amp; Status Readout
            </h3>
          </div>
        </div>

        {/* Language Selection Tabs */}
        <div className="flex items-center gap-1 p-1 bg-surface-subtle border border-border rounded-base text-xs">
          <button
            type="button"
            onClick={() => handleLangChange("en-IN")}
            className={`px-2.5 py-1 rounded-subtle font-medium transition-colors ${
              selectedLang === "en-IN" ? "bg-brand text-white font-bold" : "text-content-secondary hover:text-content-primary"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => handleLangChange("mr-IN")}
            className={`px-2.5 py-1 rounded-subtle font-medium transition-colors ${
              selectedLang === "mr-IN" ? "bg-brand text-white font-bold" : "text-content-secondary hover:text-content-primary"
            }`}
          >
            मराठी
          </button>
          <button
            type="button"
            onClick={() => handleLangChange("hi-IN")}
            className={`px-2.5 py-1 rounded-subtle font-medium transition-colors ${
              selectedLang === "hi-IN" ? "bg-brand text-white font-bold" : "text-content-secondary hover:text-content-primary"
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2 pt-1">
        {playbackState === "playing" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handlePause}
            leftIcon={<Pause className="w-3.5 h-3.5" />}
          >
            Pause
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handlePlay}
            leftIcon={<Play className="w-3.5 h-3.5" />}
          >
            {playbackState === "paused" ? "Resume Summary" : "Listen to Audio Summary"}
          </Button>
        )}

        {playbackState !== "idle" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStop}
            leftIcon={<Square className="w-3.5 h-3.5" />}
          >
            Stop
          </Button>
        )}

        {playbackState === "playing" && (
          <div className="flex items-center gap-1.5 text-xs text-brand font-medium animate-pulse ml-2">
            <span className="w-2 h-2 rounded-full bg-brand" />
            <span>Playing audio summary ({selectedLang.split("-")[0].toUpperCase()})</span>
          </div>
        )}
      </div>
    </Card>
  );
}
