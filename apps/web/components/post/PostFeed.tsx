"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@apollo/client/react";
import { PostCard } from "./PostCard";
import { PostCardSkeleton } from "@/components/ui/Skeletons";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users } from "lucide-react";

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
  const connection = d?.feed ?? d?.posts ?? d?.userPosts ?? d?.likedPosts;
  const { edges = [], pageInfo } = connection ?? {};
  const hasNextPage = pageInfo?.hasNextPage ?? false;
  const endCursor = pageInfo?.endCursor;

  useEffect(() => {
    if (!sentinel.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading && hasNextPage) {
          fetchMore({ variables: { ...variables, limit: 20, cursor: endCursor } });
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasNextPage, loading, endCursor, fetchMore, variables]);

  if (error) {
    return (
      <EmptyState
        icon={Users}
        title="Something went wrong"
        description="Failed to load posts. Please try again."
      />
    );
  }

  if (loading && edges.length === 0) {
    return (
      <div>
        {[...Array(3)].map((_, i) => <PostCardSkeleton key={i} />)}
      </div>
    );
  }

  if (!loading && edges.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No posts yet"
        description="Follow people to see their posts here."
        action={{ label: "Find people", href: "/explore" }}
      />
    );
  }

  return (
    <div>
      {edges.map((post: any) => (
        <PostCard key={post.id} post={post} viewerId={viewerId} />
      ))}

      <div ref={sentinel} className="h-4" />

      {loading && edges.length > 0 && (
        <PostCardSkeleton />
      )}

      {!hasNextPage && edges.length > 0 && (
        <p className="py-8 text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
          You&apos;re all caught up ✓
        </p>
      )}
    </div>
  );
}
