"use client";

import { useQuery } from "@apollo/client/react";
import { useRef, useState, useEffect, useCallback } from "react";
import { GET_REELS } from "@/lib/gql/queries";
import { ReelCard } from "@/components/reels/ReelCard";
import { Loader2 } from "lucide-react";

export default function ReelsPage() {
  const { data, loading, fetchMore } = useQuery(GET_REELS, {
    variables: { limit: 5 },
  });

  const reels: any[] = (data as any)?.reels?.edges ?? [];
  const pageInfo = (data as any)?.reels?.pageInfo;

  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // IntersectionObserver: detect which reel is active (in view)
  useEffect(() => {
    if (!containerRef.current) return;
    observerRef.current?.disconnect();

    const items = containerRef.current.querySelectorAll("[data-reel-index]");
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.reelIndex);
            setActiveIndex(idx);
          }
        }
      },
      { threshold: 0.6 }
    );
    items.forEach((el) => observerRef.current!.observe(el));
    return () => observerRef.current?.disconnect();
  }, [reels.length]);

  // Prefetch next batch when user is 3 from the end
  useEffect(() => {
    if (!pageInfo?.hasNextPage) return;
    if (activeIndex >= reels.length - 3) {
      fetchMore({ variables: { limit: 5, cursor: pageInfo.endCursor } });
    }
  }, [activeIndex, reels.length, pageInfo, fetchMore]);

  if (loading && reels.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <p className="text-white text-sm">No reels yet. <a href="/reels/upload" className="underline">Upload one!</a></p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll"
      style={{ scrollSnapType: "y mandatory", scrollbarWidth: "none" }}
    >
      {reels.map((reel: any, i: number) => (
        <div key={reel.id} data-reel-index={i}>
          <ReelCard reel={reel} isActive={i === activeIndex} />
        </div>
      ))}
    </div>
  );
}
