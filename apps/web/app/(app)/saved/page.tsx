"use client";

import { useQuery, useMutation } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import { GET_BOOKMARKS } from "@/lib/gql/queries";
import { UNBOOKMARK_POST } from "@/lib/gql/mutations";
import { PostCardCompact } from "@/components/post/PostCardCompact";
import { Loader2, Bookmark } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { redirect } from "next/navigation";

export default function SavedPage() {
  const { data: session, status } = useSession();
  const viewer = session?.user as any;

  const { data, loading, fetchMore } = useQuery(GET_BOOKMARKS, {
    variables: { limit: 18 },
    skip: !viewer,
  });

  const posts: any[] = (data as any)?.bookmarks?.edges ?? [];
  const pageInfo = (data as any)?.bookmarks?.pageInfo;

  const [tab, setTab] = useState<"posts" | "reels">("posts");
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!pageInfo?.hasNextPage || loadingMore) return;
    setLoadingMore(true);
    await fetchMore({ variables: { limit: 18, cursor: pageInfo.endCursor } });
    setLoadingMore(false);
  }, [pageInfo, loadingMore, fetchMore]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore(); }, { threshold: 0.1 });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loadMore]);

  if (status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-md" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-2">
          <Bookmark size={20} style={{ color: "var(--color-text-primary)" }} />
          <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Saved</h1>
          <span className="text-sm ml-auto" style={{ color: "var(--color-text-secondary)" }}>
            {posts.length > 0 ? `${posts.length} posts` : ""}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "var(--color-border)" }}>
        {(["posts", "reels"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-sm font-semibold capitalize transition-colors"
            style={{
              color: tab === t ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              borderBottom: tab === t ? "2px solid var(--color-text-primary)" : "2px solid transparent",
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts tab */}
      {tab === "posts" && (
        <>
          {loading && posts.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-text-secondary)" }} />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center py-20 gap-4">
              <div className="rounded-full p-5 border-2" style={{ borderColor: "var(--color-text-primary)" }}>
                <Bookmark size={36} style={{ color: "var(--color-text-primary)" }} />
              </div>
              <p className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Save</p>
              <p className="text-sm text-center max-w-xs" style={{ color: "var(--color-text-secondary)" }}>
                Save photos and videos that you want to see again. No one is notified, and only you can see what you've saved.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
              {posts.map((post: any) => (
                <PostCardCompact key={post.id} post={post} />
              ))}
            </div>
          )}

          <div ref={sentinelRef} className="h-8" />
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="animate-spin" style={{ color: "var(--color-text-secondary)" }} />
            </div>
          )}
        </>
      )}

      {/* Reels tab — placeholder */}
      {tab === "reels" && (
        <div className="flex flex-col items-center py-20 gap-4">
          <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Saved Reels</p>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Coming soon</p>
        </div>
      )}
    </div>
  );
}
