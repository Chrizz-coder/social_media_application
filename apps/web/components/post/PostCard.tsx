"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2, Flag } from "lucide-react";
import { useMutation } from "@apollo/client/react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { ParsedContent } from "@/components/ui/HashtagLink";
import { LIKE_POST, UNLIKE_POST, DELETE_POST, BOOKMARK_POST, UNBOOKMARK_POST } from "@/lib/gql/mutations";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    imageUrl?: string | null;
    likeCount: number;
    commentCount: number;
    likedByMe: boolean;
    bookmarkedByMe?: boolean;
    bookmarkCount?: number;
    hashtags?: string[];
    createdAt: string;
    author: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
      isVerified?: boolean;
    };
  };
  viewerId?: string;
  onDelete?: (id: string) => void;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fullTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  }).toUpperCase();
}

export function PostCard({ post, viewerId, onDelete }: PostCardProps) {
  const isOwner = viewerId === post.author.id;
  const [moreOpen, setMoreOpen] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const [likePost]   = useMutation(LIKE_POST,   { variables: { postId: post.id } });
  const [unlikePost] = useMutation(UNLIKE_POST, { variables: { postId: post.id } });
  const [deletePost] = useMutation(DELETE_POST, {
    variables: { id: post.id },
    update(cache) {
      cache.evict({ id: cache.identify({ __typename: "Post", id: post.id }) });
      cache.gc();
    },
    onCompleted: () => onDelete?.(post.id),
  });

  const [bookmarkPost] = useMutation(BOOKMARK_POST, {
    variables: { postId: post.id },
    optimisticResponse: { bookmarkPost: true },
    update(cache) {
      cache.modify({
        id: cache.identify({ __typename: "Post", id: post.id }),
        fields: {
          bookmarkedByMe: () => true,
          bookmarkCount: (prev: number) => prev + 1,
        },
      });
    },
  });
  const [unbookmarkPost] = useMutation(UNBOOKMARK_POST, {
    variables: { postId: post.id },
    optimisticResponse: { unbookmarkPost: true },
    update(cache) {
      cache.modify({
        id: cache.identify({ __typename: "Post", id: post.id }),
        fields: {
          bookmarkedByMe: () => false,
          bookmarkCount: (prev: number) => Math.max(0, prev - 1),
        },
      });
    },
  });

  const toggleBookmark = () => {
    if (post.bookmarkedByMe) unbookmarkPost();
    else bookmarkPost();
  };

  const toggleLike = () => {
    if (post.likedByMe) {
      unlikePost({
        optimisticResponse: {
          unlikePost: { __typename: "Post", id: post.id, likeCount: post.likeCount - 1, likedByMe: false },
        },
      });
    } else {
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 200);
      likePost({
        optimisticResponse: {
          likePost: { __typename: "Post", id: post.id, likeCount: post.likeCount + 1, likedByMe: true },
        },
      });
    }
  };

  const handleDoubleTap = () => {
    if (!post.likedByMe) toggleLike();
  };

  // Detect aspect ratio from imageUrl query params or default to square
  const imgAspect = "4/5"; // default Instagram portrait

  return (
    <article
      className="border-b animate-fade-up"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-3">
        <Link href={`/profile/${post.author.username}`} className="flex items-center gap-2.5 min-w-0">
          <Avatar
            src={post.author.avatarUrl}
            alt={post.author.displayName}
            size={32}
          />
          <div className="flex items-center gap-1 min-w-0">
            <span
              className="text-sm font-semibold truncate hover:opacity-70 transition-opacity"
              style={{ color: "var(--color-text-primary)" }}
            >
              {post.author.username}
            </span>
            {post.author.isVerified && <VerifiedBadge size="sm" />}
            <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>
              &nbsp;•&nbsp;{relativeTime(post.createdAt)}
            </span>
          </div>
        </Link>

        {/* More menu */}
        <div className="relative" ref={moreRef}>
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className="p-1.5 rounded-full hover:bg-secondary transition-colors"
            style={{ color: "var(--color-text-primary)" }}
          >
            <MoreHorizontal size={20} />
          </button>

          {moreOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMoreOpen(false)}
              />
              <div
                className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-xl border w-44"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                {isOwner ? (
                  <>
                    <button
                      onClick={() => { deletePost(); setMoreOpen(false); }}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
                      style={{ color: "var(--color-danger)" }}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setMoreOpen(false)}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
                    style={{ color: "var(--color-danger)" }}
                  >
                    <Flag size={16} />
                    Report
                  </button>
                )}
                <button
                  onClick={() => setMoreOpen(false)}
                  className="flex w-full items-center px-4 py-3 text-sm transition-colors hover:bg-secondary"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Media ──────────────────────────────────────────────────── */}
      {post.imageUrl ? (
        <div
          className="relative w-full overflow-hidden bg-black cursor-pointer"
          style={{ aspectRatio: imgAspect }}
          onDoubleClick={handleDoubleTap}
        >
          <Image
            src={post.imageUrl}
            alt="Post image"
            fill
            className="object-cover"
            sizes="(max-width: 630px) 100vw, 630px"
          />
        </div>
      ) : (
        /* Text-only post */
        <div
          className="w-full px-3 py-2 cursor-pointer"
          onDoubleClick={handleDoubleTap}
        />
      )}

      {/* ── Action row ─────────────────────────────────────────────── */}
      <div className="px-3 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Like */}
          <button
            onClick={toggleLike}
            className="transition-opacity hover:opacity-60"
            style={{ color: post.likedByMe ? "var(--color-danger)" : "var(--color-text-primary)" }}
          >
            <Heart
              size={24}
              strokeWidth={1.75}
              className={cn(
                "transition-transform",
                likeAnim && "animate-like-pop",
                post.likedByMe && "fill-current"
              )}
            />
          </button>

          {/* Comment */}
          <Link
            href={`/post/${post.id}`}
            className="transition-opacity hover:opacity-60"
            style={{ color: "var(--color-text-primary)" }}
          >
            <MessageCircle size={24} strokeWidth={1.75} />
          </Link>

          {/* Share */}
          <button
            className="transition-opacity hover:opacity-60"
            style={{ color: "var(--color-text-primary)" }}
          >
            <Send size={24} strokeWidth={1.75} />
          </button>
        </div>

        {/* Bookmark (right-aligned) */}
        <button
          onClick={toggleBookmark}
          className="transition-opacity hover:opacity-60"
          style={{ color: "var(--color-text-primary)" }}
        >
          <Bookmark
            size={24}
            strokeWidth={1.75}
            className={cn(post.bookmarkedByMe && "fill-current")}
          />
        </button>
      </div>

      {/* ── Like count ─────────────────────────────────────────────── */}
      {post.likeCount > 0 && (
        <div className="px-3 pb-1">
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {post.likeCount.toLocaleString()} {post.likeCount === 1 ? "like" : "likes"}
          </span>
        </div>
      )}

      {/* ── Caption ────────────────────────────────────────────────── */}
      <div className="px-3 pb-1">
        <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>
          <Link
            href={`/profile/${post.author.username}`}
            className="font-semibold hover:opacity-70 transition-opacity mr-1.5"
          >
            {post.author.username}
          </Link>
          <ParsedContent text={post.content} />
        </span>
      </div>

      {/* ── Comments preview ───────────────────────────────────────── */}
      {post.commentCount > 0 && (
        <div className="px-3 pb-1">
          <Link
            href={`/post/${post.id}`}
            className="text-sm hover:opacity-70 transition-opacity"
            style={{ color: "var(--color-text-secondary)" }}
          >
            View all {post.commentCount} comment{post.commentCount !== 1 ? "s" : ""}
          </Link>
        </div>
      )}

      {/* ── Timestamp ──────────────────────────────────────────────── */}
      <div className="px-3 pb-3">
        <time
          dateTime={post.createdAt}
          className="text-[11px] tracking-wide uppercase"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {fullTimestamp(post.createdAt)}
        </time>
      </div>
    </article>
  );
}
