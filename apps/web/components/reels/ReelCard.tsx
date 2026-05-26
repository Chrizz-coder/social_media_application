"use client";

import { useRef, useEffect, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Heart, MessageCircle, Bookmark, Share2, Volume2, VolumeX } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { ParsedContent } from "@/components/ui/HashtagLink";
import { LIKE_REEL, UNLIKE_REEL, BOOKMARK_POST, UNBOOKMARK_POST, FOLLOW_USER } from "@/lib/gql/mutations";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ReelCardProps {
  reel: {
    id: string;
    videoUrl: string;
    thumbnailUrl?: string | null;
    caption?: string | null;
    duration: number;
    likeCount: number;
    commentCount: number;
    viewCount: number;
    likedByMe: boolean;
    bookmarkedByMe: boolean;
    hashtags: string[];
    author: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
      isVerified?: boolean;
      isFollowedByMe?: boolean;
    };
  };
  isActive: boolean;
}

export function ReelCard({ reel, isActive }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [likeAnim, setLikeAnim] = useState(false);

  const [likeReel] = useMutation(LIKE_REEL, {
    variables: { id: reel.id },
    optimisticResponse: { likeReel: { __typename: "Reel", id: reel.id, likeCount: reel.likeCount + 1, likedByMe: true } },
  });
  const [unlikeReel] = useMutation(UNLIKE_REEL, {
    variables: { id: reel.id },
    optimisticResponse: { unlikeReel: { __typename: "Reel", id: reel.id, likeCount: Math.max(0, reel.likeCount - 1), likedByMe: false } },
  });
  const [followUser] = useMutation(FOLLOW_USER, { variables: { username: reel.author.username } });

  // Play/pause based on viewport
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  const toggleLike = () => {
    if (reel.likedByMe) { unlikeReel(); }
    else { setLikeAnim(true); setTimeout(() => setLikeAnim(false), 200); likeReel(); }
  };

  const toggleMute = () => {
    setMuted(v => {
      if (videoRef.current) videoRef.current.muted = !v;
      return !v;
    });
  };

  return (
    <div className="relative w-full h-screen shrink-0 overflow-hidden bg-black" style={{ scrollSnapAlign: "start" }}>
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.thumbnailUrl ?? undefined}
        loop
        muted={muted}
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        onClick={toggleMute}
      />

      {/* Mute indicator */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 z-20 rounded-full p-2 bg-black/40 text-white"
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

      {/* Right action bar */}
      <div className="absolute right-3 bottom-28 z-10 flex flex-col items-center gap-5">
        {/* Author avatar + follow */}
        <div className="relative flex flex-col items-center">
          <Link href={`/profile/${reel.author.username}`}>
            <Avatar src={reel.author.avatarUrl} alt={reel.author.displayName} size={44} />
          </Link>
          {!reel.author.isFollowedByMe && (
            <button
              onClick={() => followUser()}
              className="absolute -bottom-3 flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-bold"
              style={{ background: "var(--color-interactive)" }}
            >
              +
            </button>
          )}
        </div>

        {/* Like */}
        <div className="flex flex-col items-center gap-1">
          <button onClick={toggleLike} className="text-white">
            <Heart
              size={28}
              strokeWidth={1.75}
              className={cn("transition-transform", likeAnim && "animate-like-pop", reel.likedByMe && "fill-current text-red-500")}
            />
          </button>
          <span className="text-white text-xs font-semibold">{reel.likeCount.toLocaleString()}</span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center gap-1">
          <Link href={`/post/${reel.id}`} className="text-white">
            <MessageCircle size={28} strokeWidth={1.75} />
          </Link>
          <span className="text-white text-xs font-semibold">{reel.commentCount.toLocaleString()}</span>
        </div>

        {/* Bookmark */}
        <button className="text-white">
          <Bookmark
            size={28}
            strokeWidth={1.75}
            className={cn(reel.bookmarkedByMe && "fill-white")}
          />
        </button>

        {/* Share */}
        <button className="text-white">
          <Share2 size={28} strokeWidth={1.75} />
        </button>
      </div>

      {/* Bottom overlay: author + caption */}
      <div className="absolute left-3 right-16 bottom-6 z-10">
        <Link href={`/profile/${reel.author.username}`} className="flex items-center gap-2 mb-2">
          <span className="text-white text-sm font-bold">{reel.author.username}</span>
          {!reel.author.isFollowedByMe && (
            <span className="text-white text-xs border border-white rounded px-1.5 py-0.5 font-semibold">Follow</span>
          )}
        </Link>
        {reel.caption && (
          <p className="text-white text-sm leading-relaxed line-clamp-3">
            <ParsedContent text={reel.caption} className="text-white" />
          </p>
        )}
      </div>
    </div>
  );
}
