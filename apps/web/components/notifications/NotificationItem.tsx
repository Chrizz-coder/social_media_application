"use client";

import Link from "next/link";
import { Avatar } from "@/components/common/Avatar";
import { RelativeTime } from "@/components/common/RelativeTime";
import { Bell, Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    read: boolean;
    createdAt: string;
    actor: { id: string; username: string; displayName: string; avatarUrl?: string | null };
    post?: { id: string; content: string } | null;
  };
}

const icons: Record<string, React.ReactNode> = {
  FOLLOW:  <Bell  size={14} className="text-primary" />,
  LIKE:    <Heart size={14} className="text-like" />,
  COMMENT: <MessageCircle size={14} className="text-primary" />,
};

const messages: Record<string, string> = {
  FOLLOW:  "followed you",
  LIKE:    "liked your post",
  COMMENT: "commented on your post",
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const { type, actor, post, read, createdAt } = notification;

  const inner = (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 border-b border-border transition-colors hover:bg-secondary/20 animate-fade-up",
        !read && "bg-accent/5"
      )}
    >
      <div className="relative shrink-0">
        <Avatar src={actor.avatarUrl} alt={actor.displayName} size={40} />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-card border border-border">
          {icons[type] ?? <Bell size={12} />}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-semibold">{actor.displayName}</span>{" "}
          {messages[type] ?? "interacted with you"}
        </p>
        {post && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{post.content}</p>
        )}
        <RelativeTime date={createdAt} className="mt-0.5 text-xs text-muted-foreground" />
      </div>
      {!read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </div>
  );

  if (post) return <Link href={`/post/${post.id}`}>{inner}</Link>;
  return <Link href={`/profile/${actor.username}`}>{inner}</Link>;
}
