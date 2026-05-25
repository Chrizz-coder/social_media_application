"use client";

import { useState, useRef } from "react";
import { useMutation } from "@apollo/client/react";
import { SendHorizonal, Loader2 } from "lucide-react";
import { CREATE_COMMENT } from "@/lib/gql/mutations";
import { GET_COMMENTS } from "@/lib/gql/queries";

interface CommentFormProps {
  postId: string;
}

export function CommentForm({ postId }: CommentFormProps) {
  const [content, setContent] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const [createComment, { loading }] = useMutation(CREATE_COMMENT, {
    refetchQueries: [{ query: GET_COMMENTS, variables: { postId, limit: 20 } }],
    onCompleted: () => setContent(""),
  });

  const submit = () => {
    if (!content.trim() || loading) return;
    createComment({ variables: { input: { postId, content: content.trim() } } });
  };

  return (
    <div className="flex gap-3 border-b border-border p-4">
      <div className="relative flex-1">
        <textarea
          ref={ref}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          placeholder="Add a comment…"
          rows={2}
          maxLength={300}
          className="w-full resize-none rounded-xl border border-input bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
        />
        <span className="absolute bottom-2 right-3 text-xs text-muted-foreground/60">
          {content.length}/300
        </span>
      </div>
      <button
        onClick={submit}
        disabled={!content.trim() || loading}
        className="self-end flex items-center justify-center h-9 w-9 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 transition-opacity hover:opacity-90"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <SendHorizonal size={15} />}
      </button>
    </div>
  );
}
