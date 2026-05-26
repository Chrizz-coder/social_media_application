"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation } from "@apollo/client/react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { VIEW_STORY } from "@/lib/gql/mutations";
import { Avatar } from "@/components/common/Avatar";

interface StoryViewerProps {
  groups: any[];
  initialGroupIndex: number;
  onClose: () => void;
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STORY_DURATION = 5000; // ms for images

export function StoryViewer({ groups, initialGroupIndex, onClose }: StoryViewerProps) {
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0); // 0-100
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(Date.now());

  const [viewStory] = useMutation(VIEW_STORY);

  const currentGroup = groups[groupIdx];
  const currentStory = currentGroup?.stories[storyIdx];

  const goNext = useCallback(() => {
    if (!currentGroup) return;
    if (storyIdx < currentGroup.stories.length - 1) {
      setStoryIdx((i) => i + 1);
      setProgress(0);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx((i) => i + 1);
      setStoryIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [groupIdx, groups.length, storyIdx, currentGroup, onClose]);

  const goPrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
      setProgress(0);
    } else if (groupIdx > 0) {
      const prevGroup = groups[groupIdx - 1];
      setGroupIdx((i) => i - 1);
      setStoryIdx(prevGroup.stories.length - 1);
      setProgress(0);
    }
  }, [groupIdx, storyIdx, groups]);

  // Auto-advance timer
  useEffect(() => {
    if (!currentStory) return;
    setProgress(0);
    startRef.current = Date.now();
    const duration = STORY_DURATION;
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current!);
        goNext();
      }
    }, 50);
    // Fire view mutation
    viewStory({ variables: { id: currentStory.id } }).catch(() => {});
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentStory?.id, goNext]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goNext, goPrev]);

  if (!currentGroup || !currentStory) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "var(--color-surface-overlay)" }}
    >
      <div className="relative w-full max-w-sm h-full md:h-[85vh] md:rounded-2xl overflow-hidden" style={{ background: "#000" }}>
        {/* Media */}
        <div className="absolute inset-0">
          <Image
            src={currentStory.mediaUrl}
            alt={currentStory.caption ?? "Story"}
            fill
            className="object-cover"
            sizes="420px"
          />
        </div>

        {/* Gradient overlay top */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30 pointer-events-none" />

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {currentGroup.stories.map((_: any, i: number) => (
            <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.4)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  background: "#fff",
                  width: i < storyIdx ? "100%" : i === storyIdx ? `${progress}%` : "0%",
                  transition: i === storyIdx ? "none" : undefined,
                }}
              />
            </div>
          ))}
        </div>

        {/* Author info */}
        <div className="absolute top-8 left-3 right-12 z-10 flex items-center gap-2">
          <Avatar src={currentGroup.user.avatarUrl} alt={currentGroup.user.displayName} size={32} />
          <span className="text-white text-sm font-semibold">{currentGroup.user.username}</span>
          <span className="text-white/70 text-xs">{relativeTime(currentStory.createdAt)}</span>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-3 z-10 text-white p-1"
        >
          <X size={24} />
        </button>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-8 left-3 right-3 z-10">
            <p className="text-white text-sm text-center drop-shadow">{currentStory.caption}</p>
          </div>
        )}

        {/* Click zones — left half / right half */}
        <div className="absolute inset-0 flex z-20">
          <div className="flex-1" onClick={goPrev} />
          <div className="flex-1" onClick={goNext} />
        </div>

        {/* Arrow hints */}
        {groupIdx > 0 && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
            <ChevronLeft size={28} className="text-white/60" />
          </div>
        )}
        {groupIdx < groups.length - 1 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
            <ChevronRight size={28} className="text-white/60" />
          </div>
        )}
      </div>
    </div>
  );
}
