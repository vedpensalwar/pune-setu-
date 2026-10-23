"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  RotateCcw,
  Copy,
  Check,
  Building,
  Info,
  ShieldCheck,
  ExternalLink,
  Bot,
  User,
  ArrowRight,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language/language-provider";
import {
  queryCivicAssistant,
  type AssistantMessage,
} from "@/lib/civic/assistant-engine";

export function CivicAssistantView() {
  const { language, t } = useLanguage();
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const initialMessage: AssistantMessage = {
    id: "welcome",
    sender: "assistant",
    content:
      language === "mr"
        ? "नमस्कार! मी पुणे सेतू नागरी माहिती सहाय्यक आहे. मी आपल्याला नागरी तक्रार नोंदवणे, प्रभाग कार्यालयांचे पत्ते, आपत्कालीन मदत क्रमांक, आणि महाराष्ट्र लोकसेवा हक्क (RTS) नियमावलीबाबत अचूक व पडताळणीकृत माहिती देऊ शकतो. आपण खालीलपैकी प्रश्न विचारू शकता किंवा स्वतःचा प्रश्न टाईप करू शकता."
        : language === "hi"
        ? "नमस्ते! मैं पुणे सेतु नागरिक ज्ञान सहायक हूँ। मैं आपको नागरिक शिकायत दर्ज करने, वार्ड कार्यालयों के पते, आपातकालीन नंबरों, और महाराष्ट्र लोक सेवा अधिकार (RTS) नियमों पर सत्यापित जानकारी दे सकता हूँ।"
        : "Hello! I am the PuneSetu Civic Knowledge Assistant. I can assist you with verified municipal information regarding filing grievances, finding ward offices, emergency contact numbers, and understanding the Maharashtra Right to Public Services Act (RTS). How can I help you today?",
    sources: [
      "PuneSetu Verified Civic Corpus",
      "Pune Municipal Corporation (pmc.gov.in)",
      "Maharashtra State Commission for Right to Public Services",
    ],
    suggestedFollowups: [
      language === "mr" ? "माझ्या परिसरातील खड्ड्यांची तक्रार कशी नोंदवावी?" : "How do I report a pothole in my area?",
      language === "mr" ? "पुणे आपत्ती नियंत्रण कक्षाचे क्रमांक काय आहेत?" : "What are the emergency numbers for Pune?",
      language === "mr" ? "कोथरूड क्षेत्रीय कार्यालय कुठे आहे?" : "Where is the Kothrud Ward Office located?",
      language === "mr" ? "RTS कायदा आणि नागरी तक्रारी यात काय फरक आहे?" : "What is the difference between RTS Act and PuneSetu?",
    ],
    timestamp: "Just now",
  };

  const [messages, setMessages] = useState<AssistantMessage[]>([initialMessage]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgCountRef = useRef(1);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    setInputQuery("");
    const nextId = ++msgCountRef.current;

    const userMsg: AssistantMessage = {
      id: `user-${nextId}`,
      sender: "user",
      content: query,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await queryCivicAssistant(query, language);
      const botMsgId = ++msgCountRef.current;
      const botMsg: AssistantMessage = {
        id: `assistant-${botMsgId}`,
        sender: "assistant",
        content: response.answer,
        sources: response.sources,
        suggestedFollowups: response.suggestedFollowups,
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsgId = ++msgCountRef.current;
      const errorMsg: AssistantMessage = {
        id: `assistant-${errorMsgId}`,
        sender: "assistant",
        content: "Sorry, I encountered an issue retrieving verified civic information. Please check your network and try again.",
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([initialMessage]);
    setInputQuery("");
  };

  const handleCopy = (msg: AssistantMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-content-primary py-8 sm:py-12">
      <Container size="md">
        {/* Header */}
        <div className="mb-6 border-b border-border pb-4">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="inline-flex items-center gap-2">
              <Badge variant="brand" size="md">
                <Sparkles className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                {t("assistant.badge")}
              </Badge>
              <Badge variant="info" size="sm">
                Verified Corpus Mode
              </Badge>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              {t("assistant.reset")}
            </Button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content-primary mb-1">
            {t("assistant.title")}
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
            {t("assistant.subtitle")}
          </p>

          {/* Mode Notice */}
          <div className="mt-3 p-2.5 rounded-base bg-surface-muted border border-border flex items-center gap-2 text-[11px] text-content-secondary">
            <ShieldCheck className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
            <span>{t("assistant.modeNotice")}</span>
          </div>
        </div>

        {/* Chat Messages Container */}
        <div className="border border-border rounded-base bg-surface shadow-subtle p-4 sm:p-6 mb-4 min-h-[460px] max-h-[600px] overflow-y-auto flex flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.sender === "user"
                    ? "bg-accent text-accent-contrast"
                    : "bg-brand text-brand-contrast"
                }`}
              >
                {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-base p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-brand text-brand-contrast"
                    : "bg-surface-muted text-content-primary border border-border"
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>

                {/* Sources Citation */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-border-subtle text-[11px] text-content-muted">
                    <p className="font-semibold text-content-secondary mb-1">
                      {t("assistant.sourcesLabel")}
                    </p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {msg.sources.map((src, idx) => (
                        <li key={idx}>{src}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Follow-up suggestions */}
                {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-border-subtle">
                    <p className="text-[11px] font-semibold text-content-secondary mb-1.5">
                      {t("assistant.suggested")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedFollowups.map((sugg, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSend(sugg)}
                          className="px-2.5 py-1 text-[11px] rounded-subtle bg-surface hover:bg-surface-hover border border-border text-brand font-medium transition-colors text-left"
                        >
                          {sugg}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Footer Actions */}
                <div className="mt-2 pt-1 flex items-center justify-between text-[10px] text-content-muted opacity-80">
                  <span>{msg.timestamp}</span>
                  {msg.sender === "assistant" && (
                    <button
                      type="button"
                      onClick={() => handleCopy(msg)}
                      className="hover:text-content-primary flex items-center gap-1 transition-colors"
                      aria-label="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-status-success" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand text-brand-contrast flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-base bg-surface-muted border border-border text-xs text-content-secondary animate-pulse">
                Retrieving verified civic information...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Query Input Box */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("assistant.inputPlaceholder")}
            aria-label={t("assistant.inputPlaceholder")}
            disabled={isLoading}
            className="flex-1 h-11 px-4 text-xs sm:text-sm rounded-base border border-border bg-surface text-content-primary focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:opacity-50"
          />
          <Button
            variant="accent"
            size="md"
            onClick={() => handleSend()}
            disabled={isLoading || !inputQuery.trim()}
            rightIcon={<Send className="w-4 h-4" />}
            className="font-bold text-xs"
          >
            {t("assistant.send")}
          </Button>
        </div>
      </Container>
    </div>
  );
}
