"use client";

import { useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { GET_HASHTAG, GET_POSTS } from "@/lib/gql/queries";
import { PostCardCompact } from "@/components/post/PostCardCompact";
import { PostCard } from "@/components/post/PostCard";
import { Loader2, Hash } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = "top" | "recent";

// Custom GET_POSTS_BY_HASHTAG — we re-use GET_POSTS from the search results
// The backend resolver supports `posts` which returns all posts sorted by date.
// We filter client-side from the search results for the hashtag page for now.
import { gql, useQuery as useApolloQuery } from "@apollo/client";

const GET_POSTS_BY_HASHTAG = gql`
  query GetPostsByHashtag($query: String!, $limit: Int) {
    search(query: $query, limit: $limit) {
      posts {
        id content imageUrl likeCount commentCount likedByMe bookmarkedByMe bookmarkCount hashtags createdAt
        author { id username displayName avatarUrl isVerified }
      }
    }
  }
`;

export default function HashtagPage() {
  const { tag } = useParams<{ tag: string }>();
  const decodedTag = decodeURIComponent(tag);
  const [activeTab, setActiveTab] = useState<Tab>("top");

  const { data: session } = useSession();
  const viewer = session?.user as any;
  const viewerId = viewer?.id ?? viewer?._id;

  const { data: hashtagData, loading: hashtagLoading } = useQuery(GET_HASHTAG, {
    variables: { name: decodedTag },
  });
  const hashtag = (hashtagData as any)?.hashtag;

  const { data: postsData, loading: postsLoading } = useApolloQuery(GET_POSTS_BY_HASHTAG, {
    variables: { query: `#${decodedTag}`, limit: 36 },
  });
  const posts: any[] = (postsData as any)?.search?.posts ?? [];

  const topPosts = posts.slice(0, 9);
  const recentPosts = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-md" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-2">
          <Hash size={22} style={{ color: "var(--color-brand)" }} />
          <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{decodedTag}</h1>
        </div>
        {hashtag && (
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            {hashtag.totalCount.toLocaleString()} posts
          </p>
        )}
      </header>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "var(--color-border)" }}>
        {(["top", "recent"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              "flex-1 py-3 text-sm font-semibold capitalize transition-colors",
              activeTab === t ? "border-b-2 border-primary text-primary" : ""
            )}
            style={{ color: activeTab === t ? "var(--color-text-primary)" : "var(--color-text-secondary)", borderColor: activeTab === t ? "var(--color-text-primary)" : "transparent" }}
          >
            {t === "top" ? "Top" : "Recent"}
          </button>
        ))}
      </div>

      {(hashtagLoading || postsLoading) && posts.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-text-secondary)" }} />
        </div>
      ) : (
        <>
          {/* Top tab: 3-column grid */}
          {activeTab === "top" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
              {topPosts.map((post: any) => (
                <PostCardCompact key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Recent tab: paginated feed */}
          {activeTab === "recent" && (
            <div>
              {recentPosts.map((post: any) => (
                <PostCard key={post.id} post={post} viewerId={viewerId} />
              ))}
            </div>
          )}

          {posts.length === 0 && (
            <div className="py-16 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
              No posts found for #{decodedTag}
            </div>
          )}
        </>
      )}
    </div>
  );
}
