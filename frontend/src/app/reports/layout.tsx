"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import {
  BarChart3,
  CalendarDays,
  Home,
  LineChart,
  PlusSquare,
  Search,
  Users,
  BookOpen,
  ChevronLeft,
  CloudUpload,
} from "lucide-react";

const UI = {
  page: "#0b1220",
  sidebar: "#121826",
  sidebarInner: "#0f1625",
  panel: "#161b24",
  border: "#273041",
  text: "#e6edf6",
  muted: "#7c889e",
  accent: "#00a449",
};

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-colors ${
        active ? "bg-[#192235]" : "hover:bg-[#172033]"
      }`}
      style={{ color: active ? UI.text : UI.muted }}
    >
      <span
        className={`w-[18px] h-[18px] flex items-center justify-center ${
          active ? "text-[#00a449]" : "text-[#7c889e]"
        }`}
      >
        {icon}
      </span>
      <span className={`${active ? "font-medium" : "font-normal"}`}>{label}</span>
    </Link>
  );
}

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, fetchUser, user } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchUser();
  }, [token, router, fetchUser]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: UI.page }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: UI.accent }} />
      </div>
    );
  }

  const active = (href: string) => pathname?.startsWith(href);

  return (
    <div className="min-h-screen flex" style={{ background: UI.page }}>
      {/* Sidebar (reference-like) */}
      <aside
        className="w-[270px] p-4 flex flex-col"
        style={{ background: UI.sidebar }}
      >
        <div
          className="rounded-2xl border h-full flex flex-col overflow-hidden"
          style={{ background: UI.sidebarInner, borderColor: UI.border }}
        >
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            {/* Brand: TEXT ONLY (no green icon) */}
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-semibold" style={{ color: UI.text }}>
                TSIS.ai
              </span>
            </div>
            <button
              className="h-8 w-8 rounded-md border flex items-center justify-center"
              style={{ background: "#141c2c", borderColor: UI.border, color: UI.muted }}
              aria-label="Collapse"
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          <nav className="px-4 pt-2 flex-1">
            <div className="flex flex-col gap-1">
              <NavItem href="/dashboard" icon={<Home className="h-4 w-4" />} label="Dashboard" active={active("/dashboard")} />
              <NavItem href="/calendar" icon={<CalendarDays className="h-4 w-4" />} label="Calendar" active={active("/calendar")} />
              <NavItem href="/reports" icon={<BarChart3 className="h-4 w-4" />} label="Reports" active={active("/reports")} />
              <NavItem href="/trades" icon={<LineChart className="h-4 w-4" />} label="Trades" active={active("/trades")} />
              <NavItem href="/journal" icon={<BookOpen className="h-4 w-4" />} label="Journal" active={active("/journal")} />
              <NavItem href="/trades/new" icon={<PlusSquare className="h-4 w-4" />} label="New Trade" active={active("/trades/new")} />
              <NavItem href="/community" icon={<Users className="h-4 w-4" />} label="Community" active={active("/community")} />
              <NavItem href="/search" icon={<Search className="h-4 w-4" />} label="Search" active={active("/search")} />
            </div>
          </nav>

          <div className="px-4 pb-4">
            <button
              className="w-full h-11 rounded-lg flex items-center justify-center gap-2 text-[13px] font-medium"
              style={{ background: UI.accent, color: "#06210f" }}
              type="button"
            >
              <CloudUpload className="h-4 w-4" />
              Import Trades
            </button>

            <div
              className="mt-4 rounded-xl border px-3 py-3 flex items-center gap-3"
              style={{ background: "#121a2a", borderColor: UI.border }}
            >
              <div className="h-9 w-9 rounded-full bg-[#1a2232] flex items-center justify-center text-[12px]" style={{ color: UI.muted }}>
                {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-[12px] truncate" style={{ color: UI.text }}>
                  {user?.email || "user"}
                </div>
                <div className="text-[11px]" style={{ color: UI.muted }}>
                  Plan: Gold
                </div>
              </div>
              <div className="ml-auto text-[16px]" style={{ color: UI.muted }}>⋯</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto relative" style={{ background: UI.page }}>
        {children}

        {/* Help bubble (reference-like) */}
        <button
          type="button"
          className="fixed right-8 bottom-8 h-12 px-5 rounded-full flex items-center gap-2 shadow-lg"
          style={{ background: UI.accent, color: "#06210f" }}
          aria-label="Help"
        >
          <span className="text-[13px] font-semibold">Help</span>
          <span className="h-5 w-5 rounded-full border border-[#06210f] flex items-center justify-center text-[12px]">?</span>
        </button>
      </main>
    </div>
  );
}
