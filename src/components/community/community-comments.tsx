"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageCircle, Send, ShieldCheck, User, LogIn, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface CommentItem {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: "CITIZEN" | "MUNICIPAL_OFFICER" | "ADMIN";
  content: string;
  isInternal?: boolean;
  createdAt: string;
}

interface CommunityCommentsProps {
  trackingToken: string;
  className?: string;
}

export function CommunityComments({ trackingToken, className = "" }: CommunityCommentsProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check auth
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setCurrentUser(data.user);
        }
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  // Fetch comments
  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/grievances/${encodeURIComponent(trackingToken)}/comments`);
      if (!res.ok) {
        throw new Error("Unable to load community comments.");
      }
      const data = await res.json();
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load comments.");
    } finally {
      setLoading(false);
    }
  }, [trackingToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      setSubmitError("Comment content cannot be empty.");
      return;
    }
    if (trimmed.length > 1000) {
      setSubmitError("Comment cannot exceed 1000 characters.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await fetch(`/api/grievances/${encodeURIComponent(trackingToken)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setContent("");
        setSubmitSuccess("Comment posted successfully.");
        await loadComments();
        setTimeout(() => setSubmitSuccess(null), 3000);
      } else {
        setSubmitError(data.error || "Failed to post comment.");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "MUNICIPAL_OFFICER":
        return (
          <Badge variant="brand" size="sm" dot>
            Municipal Officer
          </Badge>
        );
      case "ADMIN":
        return (
          <Badge variant="accent" size="sm" dot>
            Administrator
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            Citizen
          </Badge>
        );
    }
  };

  return (
    <Card className={`p-5 sm:p-6 border-border bg-surface shadow-subtle space-y-5 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-brand" />
          <h2 className="text-sm font-bold text-content-primary uppercase tracking-wider">
            Public Comments &amp; Discussion
          </h2>
        </div>
        <Badge variant="neutral" size="sm">
          {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
        </Badge>
      </div>

      {/* Comment Form */}
      {authChecked && (
        currentUser ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="comment-input" className="text-xs font-semibold text-content-primary flex items-center justify-between">
                <span>Add your comment or enquiry</span>
                <span className="text-[11px] text-content-muted font-mono">
                  {content.length}/1000
                </span>
              </label>
              <textarea
                id="comment-input"
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share helpful community updates, verify repair status, or ask respectful questions..."
                maxLength={1000}
                className="w-full text-xs sm:text-sm p-3 rounded-base border border-border bg-background text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-focus-ring resize-y"
              />
            </div>

            {submitError && (
              <div className="flex items-center gap-1.5 text-xs text-status-error">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{submitError}</span>
              </div>
            )}
            {submitSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-status-success">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{submitSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-content-muted">
                Posting as <strong>{currentUser.name}</strong> ({currentUser.role === "CITIZEN" ? "Citizen" : "Official"})
              </p>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submitting || !content.trim()}
                leftIcon={<Send className="w-3.5 h-3.5" />}
                className="text-xs font-semibold"
              >
                {submitting ? "Posting…" : "Post Comment"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="p-3.5 rounded-base bg-surface-muted border border-border flex items-center justify-between gap-3 text-xs text-content-secondary">
            <span>Sign in to participate in the public civic discussion thread.</span>
            <Link href={`/login?redirect=${encodeURIComponent(`/track/${trackingToken}`)}`}>
              <Button variant="outline" size="sm" leftIcon={<LogIn className="w-3 h-3" />} className="text-xs">
                Sign In to Comment
              </Button>
            </Link>
          </div>
        )
      )}

      {/* Comments List */}
      <div className="space-y-3 pt-2">
        {loading ? (
          <div className="py-6 text-center text-xs text-content-muted">
            <div className="w-5 h-5 mx-auto border-2 border-brand border-t-transparent rounded-full animate-spin mb-2" />
            Loading discussion…
          </div>
        ) : error ? (
          <p className="text-xs text-status-error text-center py-4">{error}</p>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 text-content-muted space-y-1">
            <MessageCircle className="w-8 h-8 mx-auto text-content-muted/40 mb-1" />
            <p className="text-xs font-semibold text-content-secondary">No comments yet</p>
            <p className="text-[11px]">Be the first Pune citizen or neighborhood resident to comment on this issue.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3.5 rounded-base border text-xs space-y-2 transition-colors ${
                comment.authorRole === "MUNICIPAL_OFFICER" || comment.authorRole === "ADMIN"
                  ? "bg-brand-surface/30 border-brand/20"
                  : "bg-surface border-border"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface-muted border border-border flex items-center justify-center text-content-secondary">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-content-primary">{comment.authorName}</span>
                  {getRoleBadge(comment.authorRole)}
                </div>
                <span className="text-[11px] font-mono text-content-muted">
                  {new Date(comment.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-content-primary leading-relaxed whitespace-pre-line pl-8">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
