"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { useState } from "react";
import { PostModal } from "./PostModal";

interface PostCardCompactProps {
  post: {
    id: string;
    imageUrl?: string | null;
    likeCount: number;
    commentCount: number;
    content: string;
    author: { username: string; displayName: string; avatarUrl?: string | null };
  };
  span?: "normal" | "wide" | "tall";
}

export function PostCardCompact({ post, span = "normal" }: PostCardCompactProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const spanClass =
    span === "wide" ? "col-span-2" :
    span === "tall" ? "row-span-2" : "";

  return (
    <>
      <div
        className={`relative cursor-pointer overflow-hidden bg-black group ${spanClass}`}
        style={{ aspectRatio: span === "tall" ? "1/2" : "1/1" }}
        onClick={() => setModalOpen(true)}
      >
        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt={post.content.slice(0, 40)}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 33vw, 210px"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center p-3"
            style={{ background: "linear-gradient(135deg, #833AB4, #E1306C)" }}
          >
            <p className="text-white text-sm font-medium text-center line-clamp-4">
              {post.content}
            </p>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-5">
          <div className="flex items-center gap-1.5 text-white font-semibold text-sm">
            <Heart size={20} className="fill-white" />
            <span>{post.likeCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white font-semibold text-sm">
            <MessageCircle size={20} className="fill-white" />
            <span>{post.commentCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {modalOpen && (
        <PostModal post={post} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
