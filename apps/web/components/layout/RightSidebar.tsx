"use client";

import Link from "next/link";
import { Avatar } from "@/components/common/Avatar";
import { useSession } from "next-auth/react";

const SUGGESTED_USERS = [
  { username: "alex_design", name: "Alex Design", image: null },
  { username: "photo.by.maya", name: "Maya Chen", image: null },
  { username: "codewithjohn", name: "John Dev", image: null },
  { username: "travelgram_k", name: "Kira Travels", image: null },
  { username: "urbanshots", name: "Urban Shots", image: null },
];

const TRENDING = [
  { tag: "webdev",       count: "14.2K posts" },
  { tag: "photography",  count: "98.5K posts" },
  { tag: "design",       count: "62.1K posts" },
  { tag: "javascript",   count: "45.8K posts" },
  { tag: "react",        count: "38.3K posts" },
];

export function RightSidebar() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const username = user?.username ?? user?.name ?? "You";

  return (
    <aside className="sticky top-0 h-screen overflow-y-auto py-8 px-4" style={{ width: 320 }}>
      {/* Current user */}
      {user && (
        <div className="flex items-center gap-3 mb-6">
          <Avatar src={user.image} alt={user.name ?? "User"} size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
              {user.username ?? user.name}
            </p>
            <p className="text-sm truncate" style={{ color: "var(--color-text-secondary)" }}>
              {user.name}
            </p>
          </div>
          <Link
            href="/login"
            className="text-xs font-semibold hover:opacity-70 transition-opacity"
            style={{ color: "var(--color-interactive)" }}
          >
            Switch
          </Link>
        </div>
      )}

      {/* Suggested for you */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
            Suggested for you
          </span>
          <Link
            href="/search"
            className="text-xs font-semibold hover:opacity-70 transition-opacity"
            style={{ color: "var(--color-text-primary)" }}
          >
            See All
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {SUGGESTED_USERS.map((u) => (
            <div key={u.username} className="flex items-center gap-3">
              <Avatar src={u.image} alt={u.name} size={32} />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${u.username}`}
                  className="text-sm font-semibold block truncate hover:opacity-70 transition-opacity"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {u.username}
                </Link>
                <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
                  {u.name}
                </p>
              </div>
              <button
                className="text-xs font-semibold hover:opacity-70 transition-opacity shrink-0"
                style={{ color: "var(--color-interactive)" }}
              >
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trending hashtags */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
            Trending
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {TRENDING.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/hashtag/${tag}`}
              className="flex items-center justify-between hover:opacity-70 transition-opacity"
            >
              <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                #{tag}
              </span>
              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {count}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer links */}
      <div className="mt-8 flex flex-wrap gap-2">
        {["About", "Help", "Privacy", "Terms", "Locations", "Language"].map((l) => (
          <span key={l} className="text-[11px] cursor-pointer hover:underline" style={{ color: "var(--color-text-secondary)" }}>
            {l}
          </span>
        ))}
        <p className="w-full text-[11px] mt-2" style={{ color: "var(--color-text-secondary)" }}>
          © 2025 SOCIALAPP
        </p>
      </div>
    </aside>
  );
}
