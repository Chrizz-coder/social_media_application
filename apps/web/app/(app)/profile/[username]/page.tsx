"use client";

import { useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { GET_USER, GET_USER_POSTS, GET_LIKED_POSTS } from "@/lib/gql/queries";
import { PostFeed } from "@/components/post/PostFeed";
import { FollowButton } from "@/components/user/FollowButton";
import { Avatar } from "@/components/common/Avatar";
import { Loader2, Users, Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = "posts" | "likes";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data: session } = useSession();
  const viewer = session?.user as any;

  const [tab, setTab] = useState<Tab>("posts");

  const { data, loading } = useQuery(GET_USER, { variables: { username } });
  const user = (data as any)?.user;

  const viewerId = viewer?.id ?? viewer?._id;
  const isSelf = viewerId && user?.id === viewerId;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        User not found.
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <h1 className="text-lg font-bold">{user.displayName}</h1>
      </header>

      {/* Profile hero */}
      <div className="border-b border-border px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <Avatar src={user.avatarUrl} alt={user.displayName} size={72} />
          {!isSelf && (
            <FollowButton username={user.username} isFollowing={user.isFollowedByMe} />
          )}
        </div>

        <div className="mt-4">
          <h2 className="text-xl font-bold">{user.displayName}</h2>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          {user.bio && <p className="mt-2 text-sm">{user.bio}</p>}
        </div>

        {/* Stats */}
        <div className="mt-4 flex gap-5">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold">{user.followingCount}</span>
            <span className="text-muted-foreground">Following</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold">{user.followerCount}</span>
            <span className="text-muted-foreground">Followers</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["posts", "likes"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-3 text-sm font-medium capitalize transition-colors",
              tab === t
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "posts" ? "Posts" : "Likes"}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "posts" ? (
        <PostFeed query={GET_USER_POSTS} variables={{ username }} viewerId={viewerId} />
      ) : (
        <PostFeed query={GET_LIKED_POSTS} variables={{ username }} viewerId={viewerId} />
      )}
    </div>
  );
}
