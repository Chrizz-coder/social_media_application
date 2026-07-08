"use client";

import Link from "next/link";
import { Avatar } from "@/components/common/Avatar";
import { useSession } from "next-auth/react";
import { useQuery } from "@apollo/client/react";
import { GET_SUGGESTED_USERS, GET_TRENDING_HASHTAGS } from "@/lib/gql/queries";
import { FollowButton } from "@/components/user/FollowButton";
import { Loader2 } from "lucide-react";

export function RightSidebar() {
  const { data: session } = useSession();
  const user = session?.user as any;

  // Query suggested users only if authenticated
  const {
    data: suggestedData,
    loading: loadingSuggestions,
    error: errorSuggestions,
  } = useQuery<any>(GET_SUGGESTED_USERS, {
    variables: { limit: 5 },
    skip: !session,
  });

  const {
    data: trendingData,
    loading: loadingTrending,
    error: errorTrending,
  } = useQuery<any>(GET_TRENDING_HASHTAGS, {
    variables: { limit: 5 },
  });

  const suggestions: any[] = suggestedData?.suggestedUsers ?? [];
  const trending: any[] = trendingData?.trendingHashtags ?? [];

  return (
    <aside className="sticky top-0 h-screen overflow-y-auto py-8 px-4" style={{ width: 320 }}>
      {/* Current user */}
      {user && (
        <div className="flex items-center gap-3 mb-6">
          <Avatar src={user.image} alt={user.name ?? "User"} size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
              {user.username ?? user.name}
            </p>
            <p className="text-sm truncate" style={{ color: "var(--color-text-secondary)" }}>
              {user.name}
            </p>
          </div>
          <Link
            href="/login"
            className="text-xs font-semibold hover:opacity-70 transition-opacity"
            style={{ color: "var(--color-interactive)" }}
          >
            Switch
          </Link>
        </div>
      )}

      {/* Suggested for you */}
      {session && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
              Suggested for you
            </span>
            <Link
              href="/search"
              className="text-xs font-semibold hover:opacity-70 transition-opacity"
              style={{ color: "var(--color-text-primary)" }}
            >
              See All
            </Link>
          </div>

          {loadingSuggestions && (
            <div className="flex justify-center py-4">
              <Loader2 size={18} className="animate-spin text-muted-foreground" />
            </div>
          )}

          {errorSuggestions && (
            <p className="text-xs text-muted-foreground py-2 text-center">
              Failed to load suggestions.
            </p>
          )}

          {!loadingSuggestions && !errorSuggestions && suggestions.length > 0 && (
            <div className="flex flex-col gap-3">
              {suggestions.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <Avatar src={u.avatarUrl} alt={u.displayName} size={32} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/profile/${u.username}`}
                      className="text-sm font-semibold block truncate hover:opacity-70 transition-opacity"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {u.username}
                    </Link>
                    <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
                      {u.displayName}
                    </p>
                  </div>
                  <FollowButton
                    username={u.username}
                    isFollowing={u.isFollowedByMe}
                    className="text-xs px-3 py-1 rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}

          {!loadingSuggestions && !errorSuggestions && suggestions.length === 0 && (
            <p className="text-xs text-muted-foreground py-2 text-center">
              No suggestions available.
            </p>
          )}
        </div>
      )}

      {/* Trending hashtags */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
            Trending
          </span>
        </div>

        {loadingTrending && (
          <div className="flex justify-center py-4">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {errorTrending && (
          <p className="text-xs text-muted-foreground py-2 text-center">
            Failed to load trending tags.
          </p>
        )}

        {!loadingTrending && !errorTrending && trending.length > 0 && (
          <div className="flex flex-col gap-3">
            {trending.map((h) => (
              <Link
                key={h.id}
                href={`/hashtag/${h.name}`}
                className="flex items-center justify-between hover:opacity-70 transition-opacity"
              >
                <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  #{h.name}
                </span>
                <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {h.totalCount} posts
                </span>
              </Link>
            ))}
          </div>
        )}

        {!loadingTrending && !errorTrending && trending.length === 0 && (
          <p className="text-xs text-muted-foreground py-2 text-center">
            No trending hashtags yet.
          </p>
        )}
      </div>

      {/* Footer links */}
      <div className="mt-8 flex flex-wrap gap-2">
        {["About", "Help", "Privacy", "Terms", "Locations", "Language"].map((l) => (
          <span key={l} className="text-[11px] cursor-pointer hover:underline" style={{ color: "var(--color-text-secondary)" }}>
            {l}
          </span>
        ))}
        <p className="w-full text-[11px] mt-2" style={{ color: "var(--color-text-secondary)" }}>
          © 2025 SOCIALAPP
        </p>
      </div>
    </aside>
  );
}
