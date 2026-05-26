"use client";

import { useQuery } from "@apollo/client/react";
import { useRef, useState, useEffect, useCallback } from "react";
import { GET_REELS } from "@/lib/gql/queries";
import { ReelCard } from "@/components/reels/ReelCard";
import { ReelCardSkeleton } from "@/components/ui/Skeletons";
import { EmptyState } from "@/components/ui/EmptyState";
import { Film } from "lucide-react";
import Link from "next/link";

export default function ReelsPage() {
  const { data, loading, fetchMore } = useQuery(GET_REELS, {
    variables: { limit: 5 },
  });

  const reels: any[] = (data as any)?.reels?.edges ?? [];
  const pageInfo = (data as any)?.reels?.pageInfo;
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll("[data-reel-index]");
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveIndex(Number((entry.target as HTMLElement).dataset.reelIndex));
          }
        }
      },
      { threshold: 0.6 }
    );
    items.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [reels.length]);

  // Prefetch next batch
  useEffect(() => {
    if (!pageInfo?.hasNextPage) return;
    if (activeIndex >= reels.length - 3) {
      fetchMore({ variables: { limit: 5, cursor: pageInfo.endCursor } });
    }
  }, [activeIndex, reels.length, pageInfo, fetchMore]);

  if (loading && reels.length === 0) {
    return (
      <div className="bg-black" style={{ height: "100dvh" }}>
        <ReelCardSkeleton />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex items-center justify-center bg-black" style={{ height: "100dvh" }}>
        <EmptyState
          icon={Film}
          title="No reels yet"
          description="Be the first to share a reel!"
          action={{ label: "Upload a reel", href: "/reels/upload" }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-y-scroll no-scrollbar"
      style={{
        height: "100dvh",
        scrollSnapType: "y mandatory",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {reels.map((reel: any, i: number) => (
        <div key={reel.id} data-reel-index={i}>
          <ReelCard reel={reel} isActive={i === activeIndex} />
        </div>
      ))}

      {/* Snap indicator dots */}
      <div
        className="fixed right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1.5 pointer-events-none"
      >
        {reels.map((_: any, i: number) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === activeIndex ? 8 : 4,
              height: i === activeIndex ? 8 : 4,
              background: i === activeIndex ? "#fff" : "rgba(255,255,255,0.35)",
            }}
          />
        ))}
      </div>

      {/* Upload CTA */}
      <Link
        href="/reels/upload"
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-xl"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}
      >
        <Film size={14} /> Upload Reel
      </Link>
    </div>
  );
}
