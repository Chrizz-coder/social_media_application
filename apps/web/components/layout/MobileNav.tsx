"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { House, Compass, PlusSquare, Heart, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { useQuery } from "@apollo/client/react";
import { GET_NOTIFICATIONS } from "@/lib/gql/queries";

export function MobileNav() {
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

  const tabs = [
    { href: "/feed",          icon: House,      label: "Home" },
    { href: "/search",        icon: Compass,    label: "Search" },
    { href: "/compose",       icon: PlusSquare, label: "Create" },
    { href: "/notifications", icon: Heart,      label: "Activity", isNotif: true },
    { href: `/profile/${username}`, icon: null, label: "Profile", isProfile: true },
  ];

  return (
    <>
      {/* Mobile top header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 border-b md:hidden"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <div className="flex-1" />
        <span
          className="text-xl font-bold tracking-tight"
          style={{
            background: "var(--color-brand-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          SocialApp
        </span>
        <div className="flex-1 flex justify-end gap-3">
          <Link href="/notifications" style={{ color: "var(--color-text-primary)" }}>
            <div className="relative">
              <Heart size={24} strokeWidth={1.75} />
              {unread > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-white"
                  style={{ background: "var(--color-danger)" }}
                >
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </div>
          </Link>
          <Link href="/compose" style={{ color: "var(--color-text-primary)" }}>
            <MessageCircle size={24} strokeWidth={1.75} />
          </Link>
        </div>
      </header>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center border-t md:hidden"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", height: 56 }}
      >
        {tabs.map(({ href, icon: Icon, label, isNotif, isProfile }: any) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className="flex flex-1 flex-col items-center justify-center h-full relative transition-opacity hover:opacity-70"
              style={{ color: "var(--color-text-primary)" }}
            >
              {isProfile ? (
                <div
                  className="rounded-full overflow-hidden"
                  style={{
                    width: 26,
                    height: 26,
                    outline: active ? `2px solid var(--color-text-primary)` : "none",
                    outlineOffset: 2,
                  }}
                >
                  <Avatar src={user?.image} alt={user?.name ?? "User"} size={26} />
                </div>
              ) : (
                <div className="relative">
                  <Icon size={26} strokeWidth={active ? 2.5 : 1.75} />
                  {isNotif && unread > 0 && (
                    <span
                      className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-white"
                      style={{ background: "var(--color-danger)" }}
                    >
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
