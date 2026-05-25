"use client";

import Link from "next/link";
import { Avatar } from "@/components/common/Avatar";
import { FollowButton } from "./FollowButton";

interface UserCardProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    bio?: string | null;
    followerCount: number;
    isFollowedByMe: boolean;
  };
  viewerId?: string;
}

export function UserCard({ user, viewerId }: UserCardProps) {
  const isSelf = viewerId === user.id;

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border hover:bg-secondary/20 transition-colors animate-fade-up">
      <Link href={`/profile/${user.username}`} className="shrink-0">
        <Avatar src={user.avatarUrl} alt={user.displayName} size={44} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/profile/${user.username}`} className="min-w-0">
            <p className="font-semibold truncate hover:underline">{user.displayName}</p>
            <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
          </Link>
          {!isSelf && (
            <FollowButton
              username={user.username}
              isFollowing={user.isFollowedByMe}
            />
          )}
        </div>
        {user.bio && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{user.bio}</p>
        )}
      </div>
    </div>
  );
}
