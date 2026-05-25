"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@apollo/client/react";
import { PostCard } from "./PostCard";
import { Loader2 } from "lucide-react";

interface PostFeedProps {
  query: any;
  variables?: Record<string, unknown>;
  viewerId?: string;
}

export function PostFeed({ query, variables = {}, viewerId }: PostFeedProps) {
  const { data, loading, fetchMore, error } = useQuery(query, {
    variables: { limit: 20, ...variables },
    notifyOnNetworkStatusChange: true,
  });

  const sentinel = useRef<HTMLDivElement>(null);

  const d = data as any;
  const connection =
    d?.feed ?? d?.posts ?? d?.userPosts ?? d?.likedPosts;

  const { edges = [], pageInfo } = connection ?? {};
  const hasNextPage = pageInfo?.hasNextPage ?? false;
  const endCursor = pageInfo?.endCursor;

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!sentinel.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading && hasNextPage) {
          fetchMore({
            variables: { ...variables, limit: 20, cursor: endCursor },
          });
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasNextPage, loading, endCursor, fetchMore, variables]);

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Failed to load posts. Please try again.
      </div>
    );
  }

  if (!loading && edges.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground text-sm">No posts yet.</p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Follow some users or create your first post!
        </p>
      </div>
    );
  }

  return (
    <div>
      {edges.map((post: any) => (
        <PostCard key={post.id} post={post} viewerId={viewerId} />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinel} className="h-4" />

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="animate-spin text-primary" />
        </div>
      )}

      {!hasNextPage && edges.length > 0 && (
        <p className="py-6 text-center text-xs text-muted-foreground">
          You&apos;re all caught up ✓
        </p>
      )}
    </div>
  );
}
