import type { ReactNode } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileText,
  PlusSquare,
  Search,
  Users,
} from "lucide-react";

// Reports layout inspired by modern trading journals.
// Kept branded + slightly differentiated to avoid a pixel-perfect clone.

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: any; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-colors ${
        active ? "bg-white/5 text-white" : "text-white/70 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

export default function ReportsLayout({ children }: { children: ReactNode }) {
  const ACCENT = "#48d18a";
  // Simple active detection without usePathname (keeps layout server component).
  // For a richer experience, you can convert to client + usePathname.
  const active = "reports";

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-[240px] shrink-0 border-r border-white/10 bg-[#0a1323]">
          <div className="px-4 py-4">
            {/* Brand: text-only (no icon) */}
            <div className="text-[18px] font-semibold tracking-wide">TSIS.ai</div>
          </div>

          <nav className="px-3 space-y-1">
            <NavItem href="/dashboard" label="Dashboard" icon={BarChart3} active={active === "dashboard"} />
            <NavItem href="/calendar" label="Calendar" icon={CalendarDays} active={active === "calendar"} />
            <NavItem href="/reports" label="Reports" icon={FileText} active />
            <NavItem href="/trades" label="Trades" icon={ClipboardList} active={active === "trades"} />
            <NavItem href="/journal" label="Journal" icon={FileText} active={active === "journal"} />
            <NavItem href="/trades/new" label="New Trade" icon={PlusSquare} active={active === "new"} />
            <NavItem href="/community" label="Community" icon={Users} active={active === "community"} />
            <NavItem href="/search" label="Search" icon={Search} active={active === "search"} />
          </nav>

          <div className="mt-6 px-3">
            <button
              className="w-full rounded-md text-white text-[13px] font-medium py-2.5 transition-colors"
              style={{ backgroundColor: ACCENT }}
            >
              Import Trades
            </button>
          </div>

          <div className="mt-auto px-4 py-4 text-[11px] text-white/50">Plan: Gold</div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
