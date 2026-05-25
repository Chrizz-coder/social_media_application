"use client";

import { useQuery } from "@apollo/client/react";
import { Avatar } from "@/components/common/Avatar";
import { RelativeTime } from "@/components/common/RelativeTime";
import { GET_COMMENTS } from "@/lib/gql/queries";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface CommentListProps {
  postId: string;
}

export function CommentList({ postId }: CommentListProps) {
  const { data, loading, fetchMore } = useQuery(GET_COMMENTS, {
    variables: { postId, limit: 20 },
  });

  const { edges = [], pageInfo } = (data as any)?.comments ?? {};

  return (
    <div>
      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="animate-spin text-primary" />
        </div>
      )}

      {edges.map((comment: any) => (
        <div key={comment.id} className="flex gap-3 px-4 py-3 border-b border-border animate-fade-up">
          <Link href={`/profile/${comment.author.username}`} className="shrink-0">
            <Avatar src={comment.author.avatarUrl} alt={comment.author.displayName} size={36} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <Link href={`/profile/${comment.author.username}`} className="text-sm font-semibold hover:underline">
                {comment.author.displayName}
              </Link>
              <span className="text-xs text-muted-foreground">@{comment.author.username}</span>
              <RelativeTime date={comment.createdAt} className="ml-auto text-xs text-muted-foreground" />
            </div>
            <p className="mt-0.5 text-sm leading-relaxed">{comment.content}</p>
          </div>
        </div>
      ))}

      {pageInfo?.hasNextPage && (
        <button
          onClick={() => fetchMore({ variables: { postId, limit: 20, cursor: pageInfo.endCursor } })}
          className="w-full py-3 text-sm text-primary hover:underline"
        >
          Load more comments
        </button>
      )}

      {!loading && edges.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No comments yet. Be the first!
        </p>
      )}
    </div>
  );
}
