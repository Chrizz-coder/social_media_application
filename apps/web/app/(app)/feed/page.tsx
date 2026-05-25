"use client";

import { useSession } from "next-auth/react";
import { PostFeed } from "@/components/post/PostFeed";
import { GET_FEED, GET_POSTS } from "@/lib/gql/queries";
import { Loader2 } from "lucide-react";
import type { Metadata } from "next";

export default function FeedPage() {
  const { data: session, status } = useSession();
  const viewer = session?.user as any;
  const hasFollowing = true; // Try the feed; falls back to empty state in PostFeed

  if (status === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <h1 className="text-lg font-bold">Home</h1>
      </header>

      {/* Feed — shows followed users' posts, falls back gracefully */}
      <PostFeed
        query={viewer ? GET_FEED : GET_POSTS}
        viewerId={viewer?.id ?? viewer?._id}
      />
    </div>
  );
}
