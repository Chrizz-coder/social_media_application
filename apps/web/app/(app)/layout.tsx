import { Sidebar, SidebarCompact } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { RightSidebar } from "@/components/layout/RightSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-surface)" }}>

      {/* ── Desktop sidebar (≥1024px): full labels ── */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* ── Tablet sidebar (768–1024px): icons only ── */}
      <div className="hidden md:block lg:hidden">
        <SidebarCompact />
      </div>

      {/* ── Center column ── */}
      <main
        className="flex-1 min-w-0 pb-16 md:pb-0"
        style={{ borderRight: "1px solid var(--color-border)" }}
      >
        {/* Spacer for mobile top header */}
        <div className="h-14 md:hidden" />

        <div className="mx-auto" style={{ maxWidth: 630 }}>
          {children}
        </div>
      </main>

      {/* ── Right sidebar (≥1280px only) ── */}
      <div className="hidden xl:block">
        <RightSidebar />
      </div>

      {/* ── Mobile nav (header + bottom tabs) ── */}
      <MobileNav />
    </div>
  );
}
