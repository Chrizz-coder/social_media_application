"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Loader2, X } from "lucide-react";
import { CREATE_POST } from "@/lib/gql/mutations";

interface ComposeFormProps {
  onSuccess?: () => void;
  autoFocus?: boolean;
}

export function ComposeForm({ onSuccess, autoFocus }: ComposeFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);

  const [createPost, { loading, error }] = useMutation(CREATE_POST, {
    variables: { input: { content, imageUrl: imageUrl || undefined } },
    update(cache, { data }) {
      // Evict feed/posts so they refetch with the new post at top
      cache.evict({ fieldName: "feed" });
      cache.evict({ fieldName: "posts" });
      cache.gc();
    },
    onCompleted: () => {
      setContent("");
      setImageUrl("");
      setShowImageInput(false);
      onSuccess?.();
      router.push("/feed");
    },
  });

  const charLeft = 500 - content.length;
  const canPost = content.trim().length > 0 && !loading;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <textarea
        autoFocus={autoFocus}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        rows={4}
        maxLength={500}
        className="w-full resize-none bg-transparent text-base placeholder:text-muted-foreground focus:outline-none"
      />

      {showImageInput && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Paste image URL…"
            className="flex-1 rounded-lg border border-input bg-input px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={() => { setShowImageInput(false); setImageUrl(""); }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImageInput((v) => !v)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            title="Add image URL"
          >
            <ImageIcon size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs tabular-nums ${
              charLeft < 50 ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {charLeft}
          </span>
          <button
            onClick={() => createPost()}
            disabled={!canPost}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40 hover:opacity-90"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Post
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-destructive">
          {(error as any).graphQLErrors?.[0]?.message ?? "Failed to post. Try again."}
        </p>
      )}
    </div>
  );
}
