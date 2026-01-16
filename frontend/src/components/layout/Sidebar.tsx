'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  BookOpen,
  PlusCircle,
  Users,
  Search,
  Calendar,
  Upload,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/trades', label: 'Trades', icon: FileText },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/trades/new', label: 'New Trade', icon: PlusCircle },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/search', label: 'Search', icon: Search },
];

const SECONDARY_ITEMS: NavItem[] = [
  { href: '/calendar', label: 'Calendar', icon: Calendar },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[260px] bg-[#14161d] flex flex-col h-full">
      {/* Logo */}
      <div className="h-[60px] flex items-center px-5 border-b border-[#2d3139]">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#00a449] flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-white font-semibold text-lg">TSIS.ai</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-5 py-2.5 text-[14px] transition-colors ${
                    isActive
                      ? 'text-[#00a449] bg-[#00a449]/10'
                      : 'text-[#707990] hover:text-white hover:bg-[#22262f]'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="my-4 mx-5 border-t border-[#2d3139]" />

        {/* Secondary Items */}
        <ul className="space-y-0.5">
          {SECONDARY_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-5 py-2.5 text-[14px] transition-colors ${
                    isActive
                      ? 'text-[#00a449] bg-[#00a449]/10'
                      : 'text-[#707990] hover:text-white hover:bg-[#22262f]'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom - Import Button */}
      <div className="p-4 border-t border-[#2d3139]">
        <Link
          href="/trades"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#00a449] hover:bg-[#00a449]/90 text-white text-[14px] font-medium rounded transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span>Import Trades</span>
        </Link>

        {/* Version */}
        <p className="text-center text-[11px] text-[#707990] mt-3">
          TSIS.ai v1.0
        </p>
      </div>
    </aside>
  );
}
