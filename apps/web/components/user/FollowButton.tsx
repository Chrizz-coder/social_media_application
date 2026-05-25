"use client";

import { useMutation } from "@apollo/client/react";
import { Loader2 } from "lucide-react";
import { FOLLOW_USER, UNFOLLOW_USER } from "@/lib/gql/mutations";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  username: string;
  isFollowing: boolean;
  className?: string;
}

export function FollowButton({ username, isFollowing, className }: FollowButtonProps) {
  const [follow,   { loading: following }] = useMutation(FOLLOW_USER,   { variables: { username } });
  const [unfollow, { loading: unfollowing }] = useMutation(UNFOLLOW_USER, { variables: { username } });
  const loading = following || unfollowing;

  return (
    <button
      onClick={() => (isFollowing ? unfollow() : follow())}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-sm font-semibold transition-all duration-150 disabled:opacity-60",
        isFollowing
          ? "border border-border bg-transparent text-foreground hover:border-destructive hover:text-destructive"
          : "bg-primary text-primary-foreground hover:opacity-90",
        className
      )}
    >
      {loading && <Loader2 size={13} className="animate-spin" />}
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
