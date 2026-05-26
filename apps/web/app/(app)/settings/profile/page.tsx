"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UPDATE_PROFILE } from "@/lib/gql/mutations";
import { GET_USER } from "@/lib/gql/queries";
import { Avatar } from "@/components/common/Avatar";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const viewer = session?.user as any;
  const username = viewer?.username ?? viewer?.name;

  const { data, loading: userLoading } = useQuery(GET_USER, {
    variables: { username },
    skip: !username,
  });
  const user = (data as any)?.user;

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Populate fields once user loads
  if (user && !initialized) {
    setDisplayName(user.displayName ?? "");
    setBio(user.bio ?? "");
    setAvatarUrl(user.avatarUrl ?? "");
    setInitialized(true);
  }

  const [updateProfile, { loading }] = useMutation(UPDATE_PROFILE, {
    onCompleted: async () => {
      await updateSession();
      setToast({ type: "success", msg: "Profile updated!" });
      setTimeout(() => { setToast(null); router.push(`/profile/${username}`); }, 1500);
    },
    onError: (e) => setToast({ type: "error", msg: e.message }),
  });

  const submit = () => {
    const input: Record<string, string> = {};
    if (displayName.trim()) input.displayName = displayName.trim();
    if (bio.trim() !== undefined) input.bio = bio.trim();
    if (avatarUrl.trim()) input.avatarUrl = avatarUrl.trim();
    updateProfile({ variables: { input } });
  };

  const inputStyle = {
    background: "var(--color-surface-elevated)",
    borderColor: "var(--color-border)",
    color: "var(--color-text-primary)",
  };

  if (userLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-text-secondary)" }} />
      </div>
    );
  }

  return (
    <div>
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b backdrop-blur-md"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <Link href={`/profile/${username}`}>
          <ArrowLeft size={20} style={{ color: "var(--color-text-primary)" }} />
        </Link>
        <h1 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>Edit Profile</h1>
        <button
          onClick={submit}
          disabled={loading}
          className="text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5"
          style={{ color: "var(--color-interactive)" }}
        >
          {loading && <Loader2 size={13} className="animate-spin" />}
          Done
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Avatar preview */}
        <div className="flex flex-col items-center gap-3">
          <Avatar src={avatarUrl || user?.avatarUrl} alt={displayName || "Preview"} size={86} />
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Profile photo</span>
        </div>

        {/* Avatar URL */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
            Avatar URL
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={e => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none"
            style={inputStyle}
          />
        </div>

        {/* Display name */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
            Display name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            maxLength={50}
            placeholder="Your name"
            className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none"
            style={inputStyle}
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
            Bio
          </label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value.slice(0, 150))}
            rows={3}
            placeholder="Tell people about yourself…"
            className="w-full rounded-xl px-3 py-2.5 text-sm border resize-none focus:outline-none"
            style={inputStyle}
          />
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{bio.length}/150</span>
        </div>

        {/* Username (read-only) */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
            Username
          </label>
          <div
            className="w-full rounded-xl px-3 py-2.5 text-sm border"
            style={{ ...inputStyle, opacity: 0.6 }}
          >
            @{username}
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>Username cannot be changed.</p>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className="rounded-xl px-4 py-3 text-sm text-center font-semibold"
            style={{
              background: toast.type === "success" ? "rgba(0,149,246,0.12)" : "rgba(237,73,86,0.12)",
              color: toast.type === "success" ? "var(--color-interactive)" : "var(--color-danger)",
            }}
          >
            {toast.msg}
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: "var(--color-interactive)" }}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Save changes
        </button>
      </div>
    </div>
  );
}
