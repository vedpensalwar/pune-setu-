"use client";

import React, { useState } from "react";
import { Star, CheckCircle2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SatisfactionFeedback } from "@/lib/civic/types";

interface CitizenFeedbackCardProps {
  trackingToken: string;
  existingFeedback: SatisfactionFeedback | null;
  onFeedbackSaved: (feedback: SatisfactionFeedback) => void;
}

export function CitizenFeedbackCard({
  trackingToken,
  existingFeedback,
  onFeedbackSaved,
}: CitizenFeedbackCardProps) {
  const [rating, setRating] = useState<number>(existingFeedback?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState(existingFeedback?.feedbackText || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(
    existingFeedback ? "Your satisfaction rating has been recorded. Thank you for your feedback!" : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (existingFeedback) return; // Prevent duplicate submission

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/grievances/${trackingToken}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          feedbackText: feedbackText.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback.");
      }

      setSuccessMsg("Your rating and feedback have been successfully saved.");
      onFeedbackSaved(data.feedback);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6 border-border bg-surface shadow-subtle space-y-4">
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 text-status-warning fill-status-warning" />
        <h3 className="text-base font-bold text-content-primary">
          Citizen Satisfaction Feedback
        </h3>
      </div>

      {successMsg ? (
        <div className="p-4 rounded-base bg-status-success/10 border border-status-success/30 flex items-start gap-2.5 text-xs text-status-success">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">{successMsg}</p>
            <div className="flex items-center gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= (existingFeedback?.rating || rating)
                      ? "text-status-warning fill-status-warning"
                      : "text-content-muted"
                  }`}
                />
              ))}
              <span className="text-content-primary font-bold ml-1.5">
                {existingFeedback?.rating || rating} / 5 Stars
              </span>
            </div>
            {existingFeedback?.feedbackText && (
              <p className="text-content-secondary italic pt-1">
                &ldquo;{existingFeedback.feedbackText}&rdquo;
              </p>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-content-secondary leading-relaxed">
            This grievance has been resolved. Please rate your satisfaction with the resolution quality and promptness.
          </p>

          {/* Star Rating Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-primary block">
              Redressal Rating (1 to 5 Stars):
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded hover:bg-surface-subtle transition-transform hover:scale-110 focus:outline-none focus:ring-1 focus:ring-brand"
                  aria-label={`Rate ${star} star`}
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "text-status-warning fill-status-warning"
                        : "text-content-muted"
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-content-primary ml-2">
                {hoverRating || rating} / 5
              </span>
            </div>
          </div>

          {/* Optional Text Review */}
          <div className="space-y-1.5">
            <label htmlFor="feedback-text" className="text-xs font-semibold text-content-primary block">
              Comments or Observations (Optional):
            </label>
            <textarea
              id="feedback-text"
              rows={3}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Share your experience regarding the repair quality or field response..."
              maxLength={500}
              className="w-full text-xs p-3 rounded-base border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-status-danger font-medium">{errorMsg}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Submit Feedback
          </Button>
        </form>
      )}
    </Card>
  );
}
