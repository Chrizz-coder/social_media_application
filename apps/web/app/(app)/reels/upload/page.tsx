"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { CREATE_REEL } from "@/lib/gql/mutations";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

function extractHashtags(text: string): string[] {
  return [...new Set((text.match(/#\w+/g) ?? []).map(t => t.slice(1).toLowerCase()))];
}

export default function ReelUploadPage() {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [duration, setDuration] = useState<number>(15);
  const [error, setError] = useState("");

  const hashtags = extractHashtags(caption);

  const [createReel, { loading }] = useMutation(CREATE_REEL, {
    onCompleted: () => router.push("/reels"),
    onError: (e) => setError(e.message),
  });

  const submit = () => {
    if (!videoUrl.trim()) { setError("Video URL is required"); return; }
    if (!duration || duration < 1) { setError("Duration must be at least 1 second"); return; }
    setError("");
    createReel({
      variables: {
        input: {
          videoUrl: videoUrl.trim(),
          thumbnailUrl: thumbnailUrl.trim() || undefined,
          caption: caption.trim() || undefined,
          duration,
          hashtags,
        },
      },
    });
  };

  // Highlight hashtags in caption
  const captionWithHighlight = caption.split(/(#\w+)/g).map((part, i) =>
    /^#\w+$/.test(part)
      ? <mark key={i} style={{ background: "rgba(0,149,246,0.15)", color: "var(--color-interactive)", borderRadius: 3 }}>{part}</mark>
      : <span key={i}>{part}</span>
  );

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <Link href="/reels"><ArrowLeft size={20} style={{ color: "var(--color-text-primary)" }} /></Link>
        <h1 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>New Reel</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Video URL */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Video URL *</label>
          <input
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            placeholder="https://example.com/video.mp4"
            className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none"
            style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
          />
        </div>

        {/* Thumbnail URL */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Thumbnail URL (optional)</label>
          <input
            value={thumbnailUrl}
            onChange={e => setThumbnailUrl(e.target.value)}
            placeholder="https://example.com/thumb.jpg"
            className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none"
            style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
          />
        </div>

        {/* Caption */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Caption</label>
          <div className="relative">
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value.slice(0, 2200))}
              rows={5}
              placeholder="Write a caption… #hashtags are highlighted"
              className="w-full rounded-xl px-3 py-2.5 text-sm border resize-none focus:outline-none"
              style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
            />
            <span className="absolute bottom-2 right-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>{caption.length}/2200</span>
          </div>

          {/* Hashtag preview chips */}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {hashtags.map(t => (
                <span key={t} className="text-xs rounded-full px-2.5 py-1 font-semibold" style={{ background: "rgba(0,149,246,0.12)", color: "var(--color-interactive)" }}>#{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Duration (seconds) *</label>
          <input
            type="number"
            min={1}
            max={90}
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            className="w-32 rounded-xl px-3 py-2.5 text-sm border focus:outline-none"
            style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
          />
        </div>

        {error && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: "var(--color-interactive)" }}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Share Reel
        </button>
      </div>
    </div>
  );
}
