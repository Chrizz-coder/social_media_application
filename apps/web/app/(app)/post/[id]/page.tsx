"use client";

import { useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { GET_POST } from "@/lib/gql/queries";
import { PostCard } from "@/components/post/PostCard";
import { CommentList } from "@/components/post/CommentList";
import { CommentForm } from "@/components/post/CommentForm";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const viewer = session?.user as any;

  const { data, loading } = useQuery(GET_POST, { variables: { id } });
  const post = (data as any)?.post;

  const viewerId = viewer?.id ?? viewer?._id;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Post not found.
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <Link href="/feed" className="rounded-xl p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold">Post</h1>
      </header>

      {/* Post */}
      <PostCard post={post} viewerId={viewerId} />

      {/* Comment form */}
      {viewer && <CommentForm postId={post.id} />}

      {/* Comments */}
      <CommentList postId={post.id} />
    </div>
  );
}
