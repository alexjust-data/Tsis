"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap,
  Home,
  Search,
  TrendingUp,
  LineChart,
  BarChart3,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Layout,
  Layers,
  Type,
  Eye,
  Crosshair,
  PenTool,
  Square,
  Circle,
  Plus,
  Lock,
  Ruler,
  ZoomIn,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  divider?: boolean;
}

// Flash Research style left toolbar icons
const TOOLBAR_ITEMS: NavItem[] = [
  { icon: Plus, label: "Add" },
  { icon: ChevronLeft, label: "Back" },
  { icon: Layout, label: "Layout" },
  { icon: Layers, label: "Layers" },
  { icon: Crosshair, label: "Crosshair" },
  { divider: true, icon: Plus, label: "" },
  { icon: LineChart, label: "Trend Line" },
  { icon: Ruler, label: "Measure" },
  { icon: Type, label: "Text" },
  { icon: Eye, label: "Visibility" },
  { icon: PenTool, label: "Draw" },
  { icon: Square, label: "Rectangle" },
  { icon: Circle, label: "Circle" },
  { divider: true, icon: Plus, label: "" },
  { icon: ZoomIn, label: "Zoom" },
  { icon: Lock, label: "Lock" },
];

export default function Sidebar() {
  return (
    <aside className="w-[52px] bg-[#131722] border-r border-[#2a2e39] flex flex-col h-full">
      {/* Logo */}
      <div className="h-12 flex items-center justify-center border-b border-[#2a2e39]">
        <Link href="/" className="text-[#2962ff]">
          <Zap className="h-6 w-6" />
        </Link>
      </div>

      {/* Main navigation icons */}
      <nav className="flex-1 py-2 overflow-y-auto">
        <div className="flex flex-col items-center gap-1">
          {TOOLBAR_ITEMS.map((item, index) => {
            if (item.divider) {
              return (
                <div
                  key={`divider-${index}`}
                  className="w-6 h-px bg-[#2a2e39] my-2"
                />
              );
            }

            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className="w-9 h-9 flex items-center justify-center text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] rounded transition-colors"
                title={item.label}
              >
                <Icon className="h-[18px] w-[18px]" />
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom icons */}
      <div className="border-t border-[#2a2e39] py-2">
        <div className="flex flex-col items-center gap-1">
          <button
            className="w-9 h-9 flex items-center justify-center text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] rounded transition-colors"
            title="Settings"
          >
            <Settings className="h-[18px] w-[18px]" />
          </button>
          <button
            className="w-9 h-9 flex items-center justify-center text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] rounded transition-colors"
            title="Logout"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
