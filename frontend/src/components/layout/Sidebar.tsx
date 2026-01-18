'use client';

import { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/trades', label: 'Trades', icon: FileText },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/calculator', label: 'Risk Management', icon: Shield },
  { href: '/trades/new', label: 'New Trade', icon: PlusCircle },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/search', label: 'Search', icon: Search },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setCollapsed(saved === 'true');
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newValue = !collapsed;
    setCollapsed(newValue);
    localStorage.setItem('sidebar-collapsed', String(newValue));
  };

  return (
    <aside
      className={`bg-[#14161d] flex flex-col h-full transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Logo + Toggle */}
      <div className="h-[60px] flex items-center justify-between px-4 border-b border-[#2d3139]">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#00a449] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          {!collapsed && (
            <span className="text-white font-semibold text-lg whitespace-nowrap">TSIS.ai</span>
          )}
        </Link>
        <button
          onClick={toggleCollapsed}
          className="w-8 h-8 rounded-lg bg-[#2d3139] hover:bg-[#3d4149] flex items-center justify-center text-white/70 hover:text-white transition-colors shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 py-2.5 text-[14px] transition-colors ${
                    collapsed ? 'px-4 justify-center' : 'px-5'
                  } ${
                    isActive
                      ? 'text-[#00a449] bg-[#00a449]/10'
                      : 'text-[#707990] hover:text-white hover:bg-[#22262f]'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom - Import Button */}
      <div className={`border-t border-[#2d3139] ${collapsed ? 'p-2' : 'p-4'}`}>
        <Link
          href="/trades"
          className={`flex items-center justify-center gap-2 w-full py-2.5 bg-[#00a449] hover:bg-[#00a449]/90 text-white text-[14px] font-medium rounded transition-colors ${
            collapsed ? 'px-2' : ''
          }`}
          title={collapsed ? 'Import Trades' : undefined}
        >
          <Upload className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Import Trades</span>}
        </Link>

        {/* Version */}
        {!collapsed && (
          <p className="text-center text-[11px] text-[#707990] mt-3">
            TSIS.ai v1.0
          </p>
        )}
      </div>
    </aside>
  );
}
