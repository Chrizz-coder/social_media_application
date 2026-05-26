import "@/components/ui/skeleton.css";

const bg = { background: "var(--color-border)" };
const bgElevated = { background: "var(--color-surface-elevated)" };

// ── Shared block ────────────────────────────────────────────────────────────
function Bone({ w, h, rounded = false, className = "" }: { w?: string | number; h?: string | number; rounded?: boolean; className?: string }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: w ?? "100%",
        height: h ?? 14,
        borderRadius: rounded ? 9999 : 6,
        ...bg,
      }}
    />
  );
}

// ── PostCardSkeleton ────────────────────────────────────────────────────────
export function PostCardSkeleton() {
  return (
    <div className="border-b animate-fade-up" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-3">
        <Bone w={32} h={32} rounded className="shrink-0" />
        <Bone w={120} h={12} />
      </div>
      {/* Image */}
      <Bone w="100%" h={320} className="rounded-none" />
      {/* Actions */}
      <div className="px-3 py-3 flex gap-4">
        <Bone w={24} h={24} rounded />
        <Bone w={24} h={24} rounded />
        <Bone w={24} h={24} rounded />
      </div>
      {/* Like count */}
      <div className="px-3 pb-2"><Bone w={80} h={12} /></div>
      {/* Caption */}
      <div className="px-3 pb-3 space-y-1.5">
        <Bone w="90%" h={12} />
        <Bone w="70%" h={12} />
      </div>
    </div>
  );
}

// ── StorySkeleton ───────────────────────────────────────────────────────────
export function StorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: 72 }}>
      <Bone w={64} h={64} rounded />
      <Bone w={48} h={10} />
    </div>
  );
}

// ── ReelCardSkeleton ────────────────────────────────────────────────────────
export function ReelCardSkeleton() {
  return (
    <div className="w-full h-screen" style={{ background: "#111", scrollSnapAlign: "start" }}>
      <div className="absolute inset-0 skeleton" style={{ ...bg, borderRadius: 0 }} />
    </div>
  );
}

// ── ProfileHeaderSkeleton ───────────────────────────────────────────────────
export function ProfileHeaderSkeleton() {
  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center gap-6">
        <Bone w={86} h={86} rounded />
        <div className="flex flex-1 gap-4 justify-around">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Bone w={32} h={16} />
              <Bone w={48} h={10} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <Bone w={120} h={14} />
        <Bone w="80%" h={12} />
        <Bone w="60%" h={12} />
      </div>
      <div className="flex gap-2 mt-4">
        <Bone h={34} className="flex-1" />
        <Bone h={34} className="flex-1" />
      </div>
    </div>
  );
}

// ── ConversationRowSkeleton ─────────────────────────────────────────────────
export function ConversationRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Bone w={48} h={48} rounded />
      <div className="flex-1 space-y-1.5">
        <Bone w="60%" h={12} />
        <Bone w="80%" h={10} />
      </div>
    </div>
  );
}

// ── MessageBubbleSkeleton ───────────────────────────────────────────────────
export function MessageBubbleSkeleton() {
  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <div className="flex justify-start"><Bone w={180} h={36} className="rounded-2xl" /></div>
      <div className="flex justify-end"><Bone w={140} h={36} className="rounded-2xl" /></div>
      <div className="flex justify-start"><Bone w={220} h={36} className="rounded-2xl" /></div>
      <div className="flex justify-end"><Bone w={100} h={36} className="rounded-2xl" /></div>
    </div>
  );
}

// ── StoryBarSkeleton (row of stories) ──────────────────────────────────────
export function StoryBarSkeleton() {
  return (
    <div className="flex gap-4 px-4 py-3 border-b overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
      {[...Array(5)].map((_, i) => <StorySkeleton key={i} />)}
    </div>
  );
}
