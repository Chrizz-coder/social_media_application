"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import { GET_POST, GET_COMMENTS } from "@/lib/gql/queries";
import { PostCard } from "./PostCard";
import { CommentList } from "./CommentList";
import { CommentForm } from "./CommentForm";
import { X, Loader2 } from "lucide-react";
import Image from "next/image";

interface PostModalProps {
  post: any;
  onClose: () => void;
}

export function PostModal({ post: initialPost, onClose }: PostModalProps) {
  const { data: session } = useSession();
  const viewer = session?.user as any;

  const { data } = useQuery(GET_POST, { variables: { id: initialPost.id } });
  const post = (data as any)?.post ?? initialPost;

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const viewerId = viewer?.id ?? viewer?._id;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[80] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white z-10 p-2"
      >
        <X size={28} />
      </button>

      {/* Desktop: two-panel */}
      <div
        className="hidden md:flex w-full max-w-5xl max-h-[90vh] rounded-xl overflow-hidden"
        style={{ background: "var(--color-surface)" }}
      >
        {/* Left: media */}
        <div className="flex-1 relative bg-black min-h-[500px]">
          {post.imageUrl ? (
            <Image src={post.imageUrl} alt={post.content?.slice(0, 40)} fill className="object-contain" sizes="50vw" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-8" style={{ background: "#111" }}>
              <p className="text-white text-base">{post.content}</p>
            </div>
          )}
        </div>

        {/* Right: comments */}
        <div className="w-[340px] flex flex-col border-l" style={{ borderColor: "var(--color-border)" }}>
          {/* Author header */}
          <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
            <PostCard post={post} viewerId={viewerId} />
          </div>
          {/* Comments */}
          <div className="flex-1 overflow-y-auto">
            <CommentList postId={post.id} />
          </div>
          {/* Compose */}
          <div className="border-t p-3 flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
            <CommentForm postId={post.id} />
          </div>
        </div>
      </div>

      {/* Mobile: full-screen scroll */}
      <div
        className="md:hidden w-full h-full overflow-y-auto"
        style={{ background: "var(--color-surface)" }}
      >
        <button onClick={onClose} className="flex items-center gap-2 p-4" style={{ color: "var(--color-text-primary)" }}>
          <X size={20} /> Close
        </button>
        <PostCard post={post} viewerId={viewerId} />
        <CommentList postId={post.id} />
        <div className="p-3 border-t sticky bottom-0" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
          <CommentForm postId={post.id} />
        </div>
      </div>
    </div>
  );
}
