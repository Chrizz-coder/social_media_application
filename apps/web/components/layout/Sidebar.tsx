"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Home,
  Bell,
  Search,
  User,
  PenSquare,
  LogOut,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { useQuery } from "@apollo/client/react";
import { GET_NOTIFICATIONS } from "@/lib/gql/queries";

const navItems = [
  { href: "/feed",          icon: Home,      label: "Home" },
  { href: "/search",        icon: Search,    label: "Search" },
  { href: "/notifications", icon: Bell,      label: "Notifications" },
  { href: "/compose",       icon: PenSquare, label: "Compose" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;

  const { data: notifData } = useQuery(GET_NOTIFICATIONS, {
    variables: { limit: 1 },
    skip: !user,
    pollInterval: 30_000,
  });
  const unread = (notifData as any)?.notifications?.unreadCount ?? 0;

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col gap-2 border-r border-border bg-card/50 px-4 py-6 backdrop-blur-sm">
      {/* Logo */}
      <Link href="/feed" className="mb-4 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-lg">
          S
        </div>
        <span className="text-xl font-bold tracking-tight">Social</span>
      </Link>

      {/* Nav links */}
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const isNotif = href === "/notifications";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <span className="relative">
                <Icon
                  size={20}
                  className={cn(
                    "transition-transform duration-150 group-hover:scale-110",
                    active && "text-primary"
                  )}
                />
                {isNotif && unread > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Profile link */}
      {user?.name && (
        <Link
          href={`/profile/${user.username ?? (user as any)._id}`}
          className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
        >
          <User size={20} />
          Profile
        </Link>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* User card + sign out */}
      {user && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-3 py-2.5">
          <Avatar
            src={user.image}
            alt={user.name ?? "User"}
            size={36}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              @{user.username ?? "user"}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </aside>
  );
}
