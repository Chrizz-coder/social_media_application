import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-2xl">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
