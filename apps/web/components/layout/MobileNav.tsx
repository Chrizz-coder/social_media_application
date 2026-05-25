"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bell, Search, PenSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/feed",          icon: Home,      label: "Home" },
  { href: "/search",        icon: Search,    label: "Search" },
  { href: "/notifications", icon: Bell,      label: "Alerts" },
  { href: "/compose",       icon: PenSquare, label: "Post" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card/90 backdrop-blur-md md:hidden">
      {tabs.map(({ href, icon: Icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-3 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon size={22} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
