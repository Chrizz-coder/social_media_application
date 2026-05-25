"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Trash2, MoreHorizontal } from "lucide-react";
import { useMutation } from "@apollo/client/react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { RelativeTime } from "@/components/common/RelativeTime";
import { LIKE_POST, UNLIKE_POST, DELETE_POST } from "@/lib/gql/mutations";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    imageUrl?: string | null;
    likeCount: number;
    commentCount: number;
    likedByMe: boolean;
    createdAt: string;
    author: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
    };
  };
  viewerId?: string;
  onDelete?: (id: string) => void;
}

export function PostCard({ post, viewerId, onDelete }: PostCardProps) {
  const isOwner = viewerId === post.author.id;

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

  const toggleLike = () => {
    if (post.likedByMe) {
      unlikePost({
        optimisticResponse: {
          unlikePost: { __typename: "Post", id: post.id, likeCount: post.likeCount - 1, likedByMe: false },
        },
      });
    } else {
      likePost({
        optimisticResponse: {
          likePost: { __typename: "Post", id: post.id, likeCount: post.likeCount + 1, likedByMe: true },
        },
      });
    }
  };

  return (
    <article className="group border-b border-border px-4 py-4 transition-colors hover:bg-secondary/20 animate-fade-up">
      <div className="flex gap-3">
        {/* Avatar */}
        <Link href={`/profile/${post.author.username}`} className="shrink-0">
          <Avatar
            src={post.author.avatarUrl}
            alt={post.author.displayName}
            size={44}
          />
        </Link>

        <div className="min-w-0 flex-1">
          {/* Author + time */}
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2 min-w-0">
              <Link
                href={`/profile/${post.author.username}`}
                className="font-semibold hover:underline truncate"
              >
                {post.author.displayName}
              </Link>
              <span className="text-sm text-muted-foreground truncate">
                @{post.author.username}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <RelativeTime date={post.createdAt} className="text-xs text-muted-foreground" />
              {isOwner && (
                <button
                  onClick={() => deletePost()}
                  className="rounded-lg p-1 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/15 hover:text-destructive"
                  title="Delete post"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <Link href={`/post/${post.id}`}>
            <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {post.content}
            </p>
          </Link>

          {/* Image */}
          {post.imageUrl && (
            <Link href={`/post/${post.id}`}>
              <div className="relative mt-3 overflow-hidden rounded-xl border border-border">
                <Image
                  src={post.imageUrl}
                  alt="Post image"
                  width={600}
                  height={400}
                  className="w-full object-cover max-h-80"
                />
              </div>
            </Link>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-6">
            {/* Like */}
            <button
              onClick={toggleLike}
              className={cn(
                "flex items-center gap-1.5 text-sm transition-all duration-150",
                post.likedByMe
                  ? "text-like"
                  : "text-muted-foreground hover:text-like"
              )}
            >
              <Heart
                size={17}
                className={cn(
                  "transition-transform duration-150 active:scale-125",
                  post.likedByMe && "fill-current"
                )}
              />
              <span>{post.likeCount}</span>
            </button>

            {/* Comment */}
            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <MessageCircle size={17} />
              <span>{post.commentCount}</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
