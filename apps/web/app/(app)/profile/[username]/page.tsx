"use client";

import { useQuery, useMutation } from "@apollo/client/react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { GET_USER, GET_USER_POSTS, GET_LIKED_POSTS, GET_BOOKMARKS, GET_USER_REELS } from "@/lib/gql/queries";
import { CREATE_OR_GET_CONVERSATION } from "@/lib/gql/mutations";
import { PostCardCompact } from "@/components/post/PostCardCompact";
import { FollowButton } from "@/components/user/FollowButton";
import { Avatar } from "@/components/common/Avatar";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { Loader2, Grid3x3, Film, Bookmark, MessageCircle, BarChart2, Settings } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

type Tab = "posts" | "reels" | "saved";

function ReelThumb({ reel }: { reel: any }) {
  return (
    <div className="relative aspect-square overflow-hidden bg-black cursor-pointer group">
      {reel.thumbnailUrl ? (
        <Image src={reel.thumbnailUrl} alt={reel.caption ?? "Reel"} fill className="object-cover" sizes="33vw" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "#1a1a1a" }}>
          <Film size={24} className="text-white/40" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Film size={20} className="text-white" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const viewer = session?.user as any;
  const [tab, setTab] = useState<Tab>("posts");

  const { data, loading } = useQuery(GET_USER, { variables: { username } });
  const user = (data as any)?.user;

  const viewerId = viewer?.id ?? viewer?._id;
  const isSelf = viewerId && user?.id === viewerId;

  const { data: postsData } = useQuery(GET_USER_POSTS, {
    variables: { username, limit: 18 },
    skip: !user || tab !== "posts",
  });
  const { data: reelsData } = useQuery(GET_USER_REELS, {
    variables: { username, limit: 18 },
    skip: !user || tab !== "reels",
  });
  const { data: savedData } = useQuery(GET_BOOKMARKS, {
    variables: { limit: 18 },
    skip: !isSelf || tab !== "saved",
  });

  const posts: any[]  = (postsData as any)?.userPosts?.edges ?? [];
  const reels: any[]  = (reelsData as any)?.userReels?.edges ?? [];
  const saved: any[]  = (savedData as any)?.bookmarks?.edges ?? [];

  const [createConv, { loading: convLoading }] = useMutation(CREATE_OR_GET_CONVERSATION, {
    onCompleted: (d: any) => router.push(`/messages?conv=${d.createOrGetConversation.id}`),
  });

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 size={24} className="animate-spin" style={{ color: "var(--color-text-secondary)" }} /></div>;
  }

  if (!user) {
    return <div className="py-16 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>User not found.</div>;
  }

  const tabs: { key: Tab; icon: any; label: string; hidden?: boolean }[] = [
    { key: "posts",  icon: Grid3x3,  label: "Posts" },
    { key: "reels",  icon: Film,     label: "Reels" },
    { key: "saved",  icon: Bookmark, label: "Saved", hidden: !isSelf },
  ];

  const currentGrid = tab === "posts" ? posts : tab === "reels" ? reels : saved;

  return (
    <div>
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-md" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>{user.username}</h1>
          {user.isVerified && <VerifiedBadge size="sm" />}
          {isSelf && <Link href="/analytics" className="ml-auto"><BarChart2 size={20} style={{ color: "var(--color-text-primary)" }} /></Link>}
        </div>
      </header>

      {/* Profile hero */}
      <div className="px-4 pt-6 pb-4">
        {/* Top row: avatar + stats */}
        <div className="flex items-center gap-6">
          <Avatar src={user.avatarUrl} alt={user.displayName} size={86} />

          <div className="flex flex-1 gap-4 justify-around">
            <div className="flex flex-col items-center">
              <span className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>{postsData ? posts.length : "—"}</span>
              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Posts</span>
            </div>
            <Link href={`/profile/${username}/followers`} className="flex flex-col items-center hover:opacity-70">
              <span className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>{user.followerCount.toLocaleString()}</span>
              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Followers</span>
            </Link>
            <Link href={`/profile/${username}/following`} className="flex flex-col items-center hover:opacity-70">
              <span className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>{user.followingCount.toLocaleString()}</span>
              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Following</span>
            </Link>
          </div>
        </div>

        {/* Name + bio */}
        <div className="mt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{user.displayName}</span>
            {user.isVerified && <VerifiedBadge size="sm" />}
          </div>
          {user.bio && <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: "var(--color-text-primary)" }}>{user.bio}</p>}
        </div>

        {/* CTA buttons */}
        <div className="mt-4 flex gap-2">
          {isSelf ? (
            <>
              <Link
                href="/settings/profile"
                className="flex-1 rounded-lg py-1.5 text-sm font-semibold text-center border transition-colors hover:bg-secondary"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
              >
                Edit Profile
              </Link>
              <Link
                href="/analytics"
                className="flex-1 rounded-lg py-1.5 text-sm font-semibold text-center border transition-colors hover:bg-secondary"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
              >
                View Analytics
              </Link>
            </>
          ) : (
            <>
              <div className="flex-1">
                <FollowButton username={user.username} isFollowing={user.isFollowedByMe} />
              </div>
              <button
                onClick={() => createConv({ variables: { userId: user.id } })}
                disabled={convLoading}
                className="flex-1 rounded-lg py-1.5 text-sm font-semibold border transition-colors hover:bg-secondary flex items-center justify-center gap-1.5"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
              >
                {convLoading ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
                Message
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "var(--color-border)" }}>
        {tabs.filter(t => !t.hidden).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors"
            style={{
              color: tab === key ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              borderBottom: tab === key ? `2px solid var(--color-text-primary)` : "2px solid transparent",
            }}
          >
            <Icon size={18} strokeWidth={tab === key ? 2.5 : 1.75} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {currentGrid.length === 0 ? (
        <div className="py-16 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {tab === "posts" ? "No posts yet." : tab === "reels" ? "No reels yet." : "Nothing saved yet."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {tab === "reels"
            ? reels.map((r: any) => <ReelThumb key={r.id} reel={r} />)
            : currentGrid.map((p: any) => <PostCardCompact key={p.id} post={p} />)
          }
        </div>
      )}
    </div>
  );
}
