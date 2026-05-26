"use client";

import { useState, useRef } from "react";
import { useMutation } from "@apollo/client/react";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import { CREATE_STORY } from "@/lib/gql/mutations";
import { GET_STORIES } from "@/lib/gql/queries";
import Image from "next/image";

interface CreateStorySheetProps {
  open: boolean;
  onClose: () => void;
}

export function CreateStorySheet({ open, onClose }: CreateStorySheetProps) {
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState(false);
  const [toast, setToast] = useState("");

  const [createStory, { loading }] = useMutation(CREATE_STORY, {
    refetchQueries: [{ query: GET_STORIES }],
    onCompleted: () => {
      setToast("Story shared!");
      setTimeout(() => { setToast(""); onClose(); setMediaUrl(""); setCaption(""); setPreview(false); }, 1500);
    },
    onError: (e) => setToast(e.message),
  });

  if (!open) return null;

  const handleSubmit = () => {
    if (!mediaUrl.trim()) return;
    createStory({ variables: { input: { mediaUrl: mediaUrl.trim(), mediaType: "image", caption: caption || undefined } } });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div
        className="relative w-full max-w-md rounded-t-2xl md:rounded-2xl p-6 z-10"
        style={{ background: "var(--color-surface)", borderTop: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>Create story</h2>
          <button onClick={onClose}><X size={20} style={{ color: "var(--color-text-secondary)" }} /></button>
        </div>

        {/* URL input */}
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>Image URL</label>
          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => { setMediaUrl(e.target.value); setPreview(false); }}
            placeholder="https://example.com/photo.jpg"
            className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none"
            style={{
              background: "var(--color-surface-elevated)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          />
          {mediaUrl && (
            <button
              onClick={() => setPreview(true)}
              className="mt-2 text-xs font-semibold"
              style={{ color: "var(--color-interactive)" }}
            >
              Preview
            </button>
          )}
        </div>

        {/* Preview */}
        {preview && mediaUrl && (
          <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden mb-4 bg-black">
            <Image src={mediaUrl} alt="Story preview" fill className="object-cover" sizes="400px" />
          </div>
        )}

        {/* Caption */}
        <div className="mb-6">
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>Caption (optional)</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 200))}
            rows={2}
            placeholder="Add a caption…"
            className="w-full rounded-xl px-3 py-2.5 text-sm border resize-none focus:outline-none"
            style={{
              background: "var(--color-surface-elevated)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          />
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{caption.length}/200</span>
        </div>

        {toast && (
          <div className="mb-4 rounded-xl px-3 py-2 text-sm text-center" style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-primary)" }}>
            {toast}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!mediaUrl.trim() || loading}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: "var(--color-interactive)" }}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Share to story
        </button>
      </div>
    </div>
  );
}
