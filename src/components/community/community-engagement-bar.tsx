"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, Bell, BellOff, Check, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CommunityEngagementBarProps {
  trackingToken: string;
  initialEndorsementsCount: number;
  initialFollowersCount?: number;
  className?: string;
  onUpdate?: () => void;
}

export function CommunityEngagementBar({
  trackingToken,
  initialEndorsementsCount,
  initialFollowersCount = 0,
  className = "",
  onUpdate,
}: CommunityEngagementBarProps) {
  const router = useRouter();
  const [endorsementsCount, setEndorsementsCount] = useState(initialEndorsementsCount);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [endorsed, setEndorsed] = useState(false);
  const [following, setFollowing] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loadingEndorse, setLoadingEndorse] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/community/engagement?token=${encodeURIComponent(trackingToken)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        setAuthenticated(Boolean(data.authenticated));
        if (data.authenticated) {
          setEndorsed(Boolean(data.endorsed));
          setFollowing(Boolean(data.following));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [trackingToken]);

  const handleEndorse = async () => {
    if (authenticated === false) {
      router.push(`/login?redirect=${encodeURIComponent(`/track/${trackingToken}`)}`);
      return;
    }

    setLoadingEndorse(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`/api/grievances/${encodeURIComponent(trackingToken)}/endorse`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEndorsed(data.endorsed);
        setEndorsementsCount(data.totalEndorsements);
        setFeedbackMsg(data.endorsed ? "Issue endorsed! Your support prioritizes resolution." : "Endorsement withdrawn.");
        if (onUpdate) onUpdate();
      } else if (res.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(`/track/${trackingToken}`)}`);
      } else {
        setFeedbackMsg(data.error || "Failed to update endorsement.");
      }
    } catch {
      setFeedbackMsg("Network error. Please try again.");
    } finally {
      setLoadingEndorse(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleFollow = async () => {
    if (authenticated === false) {
      router.push(`/login?redirect=${encodeURIComponent(`/track/${trackingToken}`)}`);
      return;
    }

    setLoadingFollow(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`/api/grievances/${encodeURIComponent(trackingToken)}/follow`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFollowing(data.following);
        setFollowersCount(data.totalFollowers);
        setFeedbackMsg(data.following ? "Now following this issue. You will receive in-app updates." : "Unfollowed updates.");
        if (onUpdate) onUpdate();
      } else if (res.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(`/track/${trackingToken}`)}`);
      } else {
        setFeedbackMsg(data.error || "Failed to update follow state.");
      }
    } catch {
      setFeedbackMsg("Network error. Please try again.");
    } finally {
      setLoadingFollow(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  return (
    <div className={`p-4 rounded-base bg-surface border border-border shadow-subtle space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-content-primary uppercase tracking-wider">
            Community Engagement
          </span>
          <Badge variant="brand" size="sm">
            {endorsementsCount} {endorsementsCount === 1 ? "Endorsement" : "Endorsements"}
          </Badge>
          {followersCount > 0 && (
            <Badge variant="neutral" size="sm">
              {followersCount} {followersCount === 1 ? "Follower" : "Followers"}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Endorse Button */}
          <Button
            type="button"
            variant={endorsed ? "primary" : "outline"}
            size="sm"
            onClick={handleEndorse}
            disabled={loadingEndorse}
            leftIcon={
              endorsed ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <ThumbsUp className="w-3.5 h-3.5" />
              )
            }
            className="text-xs font-semibold"
          >
            {endorsed ? "Endorsed" : "Endorse"} ({endorsementsCount})
          </Button>

          {/* Follow Button */}
          <Button
            type="button"
            variant={following ? "secondary" : "outline"}
            size="sm"
            onClick={handleFollow}
            disabled={loadingFollow}
            leftIcon={
              following ? (
                <BellOff className="w-3.5 h-3.5" />
              ) : (
                <Bell className="w-3.5 h-3.5" />
              )
            }
            className="text-xs font-semibold"
          >
            {following ? "Following" : "Follow Updates"}
          </Button>
        </div>
      </div>

      {feedbackMsg && (
        <p className="text-xs text-brand font-medium animate-in fade-in duration-200">
          {feedbackMsg}
        </p>
      )}

      {authenticated === false && (
        <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-content-secondary">
          <span>Sign in with a citizen account to endorse or follow resolution milestones.</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/track/${trackingToken}`)}`)}
            leftIcon={<LogIn className="w-3 h-3" />}
            className="text-[11px] h-7 px-2"
          >
            Sign In
          </Button>
        </div>
      )}
    </div>
  );
}
