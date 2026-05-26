"use client";

import { useQuery, useLazyQuery } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import { GET_EXPLORE, GET_TRENDING_HASHTAGS } from "@/lib/gql/queries";
import { PostCardCompact } from "@/components/post/PostCardCompact";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";

export default function ExplorePage() {
  const router = useRouter();
  const { data: session } = useSession();

  const { data: trendingData } = useQuery(GET_TRENDING_HASHTAGS, { variables: { limit: 10 } });
  const trending: any[] = (trendingData as any)?.trendingHashtags ?? [];

  const { data, loading, fetchMore } = useQuery(GET_EXPLORE, {
    variables: { limit: 18 },
  });

  const posts: any[] = (data as any)?.explore?.edges ?? [];
  const pageInfo = (data as any)?.explore?.pageInfo;

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = useCallback(async () => {
    if (!pageInfo?.hasNextPage || loadingMore) return;
    setLoadingMore(true);
    await fetchMore({ variables: { limit: 18, cursor: pageInfo.endCursor } });
    setLoadingMore(false);
  }, [pageInfo, loadingMore, fetchMore]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) loadMore(); }, { threshold: 0.1 });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-md" style={{ background: "var(--color-surface)/80", borderColor: "var(--color-border)" }}>
        <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Explore</h1>
      </header>

      {/* Search bar (links to /search) */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        <button
          onClick={() => router.push("/search")}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
          style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
        >
          <Search size={16} />
          <span>Search</span>
        </button>
      </div>

      {/* Trending hashtag chips */}
      {trending.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto px-4 py-3 border-b"
          style={{ borderColor: "var(--color-border)", scrollbarWidth: "none" }}
        >
          {trending.map((h: any) => (
            <Link
              key={h.id}
              href={`/hashtag/${h.name}`}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold border transition-colors hover:opacity-80"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
                background: "var(--color-surface-elevated)",
              }}
            >
              #{h.name}
            </Link>
          ))}
        </div>
      )}

      {/* Instagram-style 3-column grid */}
      {loading && posts.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-text-secondary)" }} />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2,
          }}
        >
          {posts.map((post: any, i: number) => {
            // Every 7th and 8th item in a 9-block: wide or tall
            const blockPos = i % 9;
            const span = blockPos === 6 ? "wide" : blockPos === 7 ? "tall" : "normal";
            return (
              <PostCardCompact
                key={post.id}
                post={post}
                span={span}
              />
            );
          })}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-8" />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--color-text-secondary)" }} />
        </div>
      )}
    </div>
  );
}
