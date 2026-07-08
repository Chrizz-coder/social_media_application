"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  House, Compass, Film, MessageCircle, Heart,
  PlusSquare, Bookmark, BarChart2, User,
  MoreHorizontal, Settings, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { useQuery } from "@apollo/client/react";
import { GET_NOTIFICATIONS, GET_CONVERSATIONS } from "@/lib/gql/queries";
import { useState } from "react";

const navItems = [
  { href: "/feed",          icon: House,          label: "Home" },
  { href: "/explore",       icon: Compass,        label: "Explore" },
  { href: "/reels",         icon: Film,           label: "Reels" },
  { href: "/messages",      icon: MessageCircle,  label: "Messages", isMessage: true },
  { href: "/notifications", icon: Heart,          label: "Notifications", isNotif: true },
  { href: "/saved",         icon: Bookmark,       label: "Saved" },
  { href: "/analytics",     icon: BarChart2,      label: "Analytics" },
  { href: "/compose",       icon: PlusSquare,     label: "Create" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const [moreOpen, setMoreOpen] = useState(false);

  const { data: notifData } = useQuery(GET_NOTIFICATIONS, {
    variables: { limit: 1 },
    skip: !user,
    pollInterval: 30_000,
  });
  const unread = (notifData as any)?.notifications?.unreadCount ?? 0;

  const { data: convData } = useQuery(GET_CONVERSATIONS, {
    skip: !user,
    pollInterval: 30_000,
  });
  const unreadMessages = (convData as any)?.conversations?.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0) ?? 0;

  const username = user?.username ?? user?._id ?? "me";

  return (
    <aside
      className="sticky top-0 flex h-screen flex-col border-r bg-background"
      style={{ borderColor: "var(--color-border)", width: 240 }}
    >
      {/* Logo */}
      <div className="px-6 py-8">
        <Link href="/feed" className="block">
          <span
            className="text-2xl font-bold tracking-tight select-none"
            style={{
              background: "var(--color-brand-gradient)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            SocialApp
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto no-scrollbar">
        {navItems.map(({ href, icon: Icon, label, isNotif, isMessage }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-4 rounded-xl px-3 py-3 text-sm transition-all duration-150 hover:bg-secondary",
                active ? "font-bold" : "font-normal"
              )}
              style={{ color: "var(--color-text-primary)" }}
            >
              <span className="relative">
                <Icon
                  size={24}
                  strokeWidth={active ? 2.5 : 1.75}
                  className="transition-transform duration-100 group-hover:scale-105"
                />
                {isNotif && unread > 0 && (
                  <span
                    className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ background: "var(--color-danger)" }}
                  >
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
                {isMessage && unreadMessages > 0 && (
                  <span
                    className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ background: "var(--color-danger)" }}
                  >
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}

        {/* Profile link */}
        {user && (
          <Link
            href={`/profile/${username}`}
            className={cn(
              "group flex items-center gap-4 rounded-xl px-3 py-3 text-sm transition-all hover:bg-secondary",
              pathname.startsWith(`/profile/${username}`) ? "font-bold" : "font-normal"
            )}
            style={{ color: "var(--color-text-primary)" }}
          >
            <User
              size={24}
              strokeWidth={pathname.startsWith(`/profile/${username}`) ? 2.5 : 1.75}
              className="transition-transform group-hover:scale-105"
            />
            <span>Profile</span>
          </Link>
        )}
      </nav>

      {/* More menu */}
      <div className="px-3 pb-4 relative">
        {moreOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
            <div
              className="absolute bottom-full left-3 mb-2 w-56 rounded-2xl shadow-xl border overflow-hidden z-50"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              <Link
                href="/settings/profile"
                onClick={() => setMoreOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-secondary transition-colors"
                style={{ color: "var(--color-text-primary)" }}
              >
                <Settings size={18} /> Settings
              </Link>
              <Link
                href="/saved"
                onClick={() => setMoreOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-secondary transition-colors"
                style={{ color: "var(--color-text-primary)" }}
              >
                <Bookmark size={18} /> Saved
              </Link>
              <div style={{ height: 1, background: "var(--color-border)" }} />
              <button
                className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-secondary transition-colors"
                style={{ color: "var(--color-danger)" }}
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut size={18} /> Log out
              </button>
            </div>
          </>
        )}

        <button
          onClick={() => setMoreOpen((v) => !v)}
          className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-sm font-normal hover:bg-secondary transition-colors"
          style={{ color: "var(--color-text-primary)" }}
        >
          <MoreHorizontal size={24} strokeWidth={1.75} />
          <span>More</span>
        </button>

        {/* User mini-profile */}
        {user && (
          <div className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2">
            <Avatar src={user.image} alt={user.name ?? "User"} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {user.username ?? user.name}
              </p>
              <p className="truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>
                @{user.username ?? user.name}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ── Tablet icon-only sidebar (72px wide) ───────────────────────────────── */
export function SidebarCompact() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;

  const { data: notifData } = useQuery(GET_NOTIFICATIONS, {
    variables: { limit: 1 },
    skip: !user,
    pollInterval: 30_000,
  });
  const unread = (notifData as any)?.notifications?.unreadCount ?? 0;
  const username = user?.username ?? user?._id ?? "me";

  const { data: convData } = useQuery(GET_CONVERSATIONS, {
    skip: !user,
    pollInterval: 30_000,
  });
  const unreadMessages = (convData as any)?.conversations?.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0) ?? 0;

  const items = [
    ...navItems,
    { href: `/profile/${username}`, icon: User, label: "Profile" },
  ];

  return (
    <aside
      className="sticky top-0 flex h-screen flex-col items-center border-r bg-background pt-6 gap-1 overflow-y-auto no-scrollbar"
      style={{ borderColor: "var(--color-border)", width: 72 }}
    >
      <Link href="/feed" className="mb-4">
        <span className="text-2xl font-black" style={{ color: "var(--color-brand)" }}>S</span>
      </Link>
      {items.map(({ href, icon: Icon, label, isNotif, isMessage }: any) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className="relative flex h-12 w-12 items-center justify-center rounded-xl hover:bg-secondary transition-colors"
            style={{ color: "var(--color-text-primary)" }}
          >
            <Icon size={24} strokeWidth={active ? 2.5 : 1.75} />
            {isNotif && unread > 0 && (
              <span
                className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-white"
                style={{ background: "var(--color-danger)" }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
            {isMessage && unreadMessages > 0 && (
              <span
                className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-white"
                style={{ background: "var(--color-danger)" }}
              >
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </Link>
        );
      })}
    </aside>
  );
}
