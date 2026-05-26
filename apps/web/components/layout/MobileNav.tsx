"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { House, Compass, PlusSquare, Film, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { useQuery } from "@apollo/client/react";
import { GET_NOTIFICATIONS } from "@/lib/gql/queries";

// Bottom tabs (5 core destinations, Instagram-style)
const BOTTOM_TABS = [
  { href: "/feed",     icon: House,          label: "Home" },
  { href: "/explore",  icon: Compass,        label: "Explore" },
  { href: "/compose",  icon: PlusSquare,     label: "Create" },
  { href: "/reels",    icon: Film,           label: "Reels" },
  { href: "/messages", icon: MessageCircle,  label: "Messages" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const username = user?.username ?? user?._id ?? "me";

  const { data: notifData } = useQuery(GET_NOTIFICATIONS, {
    variables: { limit: 1 },
    skip: !user,
    pollInterval: 30_000,
  });
  const unreadNotif = (notifData as any)?.notifications?.unreadCount ?? 0;

  return (
    <>
      {/* ── Mobile top header ─────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 border-b md:hidden"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {/* Logo */}
        <span
          className="text-xl font-bold tracking-tight select-none"
          style={{
            background: "var(--color-brand-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          SocialApp
        </span>

        {/* Right icons: Notifications + Profile */}
        <div className="flex items-center gap-1">
          <Link
            href="/notifications"
            className="touch-target relative"
            style={{ color: "var(--color-text-primary)" }}
          >
            {/* Bell-style ring dot */}
            {unreadNotif > 0 && (
              <span
                className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full"
                style={{ background: "var(--color-danger)" }}
              />
            )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </Link>
          <Link
            href={`/profile/${username}`}
            className="touch-target"
            style={{ color: "var(--color-text-primary)" }}
          >
            <div
              className="rounded-full overflow-hidden"
              style={{
                width: 28,
                height: 28,
                outline: pathname.startsWith(`/profile/${username}`) ? `2px solid var(--color-text-primary)` : "none",
                outlineOffset: 2,
              }}
            >
              <Avatar src={user?.image} alt={user?.name ?? "User"} size={28} />
            </div>
          </Link>
        </div>
      </header>

      {/* ── Bottom tab bar ─────────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t md:hidden pb-safe"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
          minHeight: 56,
        }}
      >
        {BOTTOM_TABS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 transition-opacity",
                active ? "opacity-100" : "opacity-60 hover:opacity-90"
              )}
              style={{ color: "var(--color-text-primary)", minHeight: 56 }}
            >
              <Icon
                size={24}
                strokeWidth={active ? 2.5 : 1.75}
                className={cn(active && "scale-105")}
              />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
