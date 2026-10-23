"use client";

import React, { useState, useMemo } from "react";
import {
  PhoneCall,
  ShieldAlert,
  AlertCircle,
  Phone,
  Flame,
  Ambulance,
  HeartHandshake,
  Zap,
  Check,
  ExternalLink,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language/language-provider";
import { EMERGENCY_CONTACTS, type EmergencyContact } from "@/lib/civic/emergency-data";

export function EmergencyDirectoryView() {
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const categories = [
    { id: "ALL", label: t("emergency.allCategories") },
    { id: "NATIONAL", label: t("emergency.cat.national") },
    { id: "POLICE", label: t("emergency.cat.police") },
    { id: "FIRE", label: t("emergency.cat.fire") },
    { id: "MEDICAL", label: t("emergency.cat.medical") },
    { id: "DISASTER", label: t("emergency.cat.disaster") },
    { id: "HELPLINE", label: t("emergency.cat.helpline") },
    { id: "UTILITIES", label: t("emergency.cat.utilities") },
  ];

  const filteredContacts = useMemo(() => {
    if (selectedCategory === "ALL") return EMERGENCY_CONTACTS;
    return EMERGENCY_CONTACTS.filter((c) => c.category === selectedCategory);
  }, [selectedCategory]);

  const handleCopy = (contact: EmergencyContact) => {
    navigator.clipboard.writeText(contact.telephone);
    setCopiedId(contact.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleAudio = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported by your browser.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const script =
      language === "mr"
        ? "पुणे तातडीचे संपर्क क्रमांक. राष्ट्रीय एकात्मिक आपत्कालीन क्रमांक ११२. पोलीस नियंत्रण कक्ष १०० किंवा ०२०-२६१२६२९६. अग्निशामक दल १०१. रुग्णवाहिका सेवा १०८. पुणे मनपा आपत्ती नियंत्रण कक्ष ०२०-२५५०१२६९. मनपा टोल फ्री क्रमांक १८००-१०३०-२२२. महिला मदत कक्ष १०९१. बाल मदत कक्ष १०९८. महावितरण वीज आपत्कालीन १९१२."
        : language === "hi"
        ? "पुणे आपातकालीन संपर्क नंबर। राष्ट्रीय एकीकृत आपातकालीन नंबर ११२। पुलिस नियंत्रण कक्ष १०० या ०२०-२६१२६२९६। अग्निशमन दल १०१। एम्बुलेंस सेवा १०८। नगर निगम आपदा सेल ०२०-२५५०१२६९। टोल फ्री १८००-१०३०-२२२। महिला हेल्पलाइन १०९१। चाइल्डलाइन १०९८।"
        : "Pune Emergency Contacts. National integrated helpline 112. Police control room 100 or 020-26126296. Fire brigade 101. Ambulance service 108. PMC disaster management cell 020-25501269. PMC toll free 1800-1030-222. Women helpline 1091. Childline 1098. Electricity emergency 1912.";

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.95;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  return (
    <div className="min-h-screen bg-background text-content-primary py-8 sm:py-12">
      <Container size="lg">
        {/* Header & Urgent Alert Banner */}
        <div className="mb-8 border-b border-border pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-2">
              <Badge variant="error" size="md">
                <ShieldAlert className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                {t("emergency.badge")}
              </Badge>
              <span className="text-xs text-content-secondary hidden sm:inline">
                Government Verified Control Lines
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleAudio}
              leftIcon={isPlayingAudio ? <VolumeX className="w-4 h-4 text-status-warning" /> : <Volume2 className="w-4 h-4 text-brand" />}
              className="text-xs"
              aria-label={isPlayingAudio ? t("a11y.stopAudio") : t("a11y.listenText")}
            >
              {isPlayingAudio ? t("a11y.stopAudio") : t("a11y.listenText")}
            </Button>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-content-primary mb-2">
            {t("emergency.title")}
          </h1>
          <p className="text-sm sm:text-base text-content-secondary max-w-3xl leading-relaxed">
            {t("emergency.subtitle")}
          </p>

          {/* Urgent Banner */}
          <div className="mt-5 p-4 rounded-base bg-status-error/10 border-2 border-status-error flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-status-error shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-content-primary mb-0.5">
                {t("emergency.alert")}
              </p>
              <p className="text-content-secondary">
                Emergency dispatch lines must not be used for routine civic grievances. For potholes, waste, or streetlights, use the PuneSetu reporting wizard.
              </p>
            </div>
          </div>
        </div>

        {/* 112 National Emergency Hero Feature */}
        <div className="p-6 rounded-base border-2 border-brand bg-surface shadow-elevated mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-base bg-brand text-brand-contrast flex items-center justify-center font-extrabold text-2xl shadow-subtle shrink-0">
              112
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="brand" size="sm">National ERSS</Badge>
                <span className="text-xs font-semibold text-status-success">24x7 Active</span>
              </div>
              <h2 className="text-lg font-bold text-content-primary">
                {language === "mr" ? "राष्ट्रीय एकात्मिक आपत्कालीन मदत क्रमांक" : language === "hi" ? "राष्ट्रीय एकीकृत आपातकालीन हेल्पलाइन" : "National Integrated Emergency Helpline (112)"}
              </h2>
              <p className="text-xs text-content-secondary max-w-xl mt-1 leading-relaxed">
                Connects directly to the automated dispatch centre for Police, Fire Brigade, Medical Ambulance, and Disaster First Responders anywhere in Pune and across India.
              </p>
            </div>
          </div>

          <a
            href="tel:112"
            className="w-full md:w-auto px-6 py-3 rounded-base bg-status-error text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-card hover:bg-status-error/90 transition-all shrink-0"
          >
            <PhoneCall className="w-5 h-5 animate-pulse" aria-hidden="true" />
            <span>{t("emergency.callNow")}: 112</span>
          </a>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 mb-6 pb-2 border-b border-border" role="group" aria-label="Filter by emergency category">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-base transition-colors ${
                selectedCategory === cat.id
                  ? "bg-brand text-brand-contrast font-bold shadow-subtle"
                  : "bg-surface text-content-secondary hover:text-content-primary hover:bg-surface-hover border border-border"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Directory Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContacts.map((contact) => (
            <Card
              key={contact.id}
              className="p-5 flex flex-col justify-between hover:shadow-card hover:border-brand/30 transition-all duration-150"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge
                    variant={
                      contact.category === "NATIONAL" || contact.category === "POLICE"
                        ? "brand"
                        : contact.category === "FIRE"
                        ? "warning"
                        : contact.category === "MEDICAL"
                        ? "error"
                        : contact.category === "DISASTER"
                        ? "info"
                        : "neutral"
                    }
                    size="sm"
                  >
                    {contact.category}
                  </Badge>
                  <span className="text-[11px] font-medium text-status-success">
                    {contact.availability}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-base font-bold text-content-primary mb-1">
                  {language === "mr" ? contact.nameMr : language === "hi" ? contact.nameHi : contact.name}
                </h3>
                <p className="text-xs text-content-secondary mb-3 leading-relaxed">
                  {language === "mr" ? contact.descriptionMr : language === "hi" ? contact.descriptionHi : contact.description}
                </p>

                {/* Jurisdiction */}
                <div className="text-[11px] text-content-muted mb-3 flex items-center gap-1.5">
                  <span className="font-semibold text-content-secondary">Jurisdiction:</span>
                  <span>{language === "mr" ? contact.jurisdictionMr : language === "hi" ? contact.jurisdictionHi : contact.jurisdiction}</span>
                </div>
              </div>

              {/* Call and Copy Actions */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <a
                  href={contact.callHref}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-base bg-brand text-brand-contrast text-xs font-semibold hover:bg-brand-hover transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{contact.telephone.split("/")[0].trim()}</span>
                </a>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(contact)}
                  className="text-xs"
                  aria-label={`Copy phone number for ${contact.name}`}
                >
                  {copiedId === contact.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-status-success mr-1" />
                      {t("common.copied")}
                    </>
                  ) : (
                    t("common.copy")
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Provenance Footer */}
        <div className="mt-8 p-3 rounded-base bg-surface-muted/50 border border-border text-center text-xs text-content-muted">
          {t("emergency.provenance")}
        </div>
      </Container>
    </div>
  );
}
