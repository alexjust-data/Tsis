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
  ChevronDown,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/trades', label: 'Trades', icon: FileText },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/calculator', label: 'Risk Management', icon: Shield },
  { href: '/trades/new', label: 'New Trade', icon: PlusCircle },
  { href: '/community', label: 'Community', icon: Users, badge: 'Soon' },
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
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#57aefd] to-[#2f91ef] flex items-center justify-center shrink-0 shadow-lg shadow-[#57aefd]/20">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          {!collapsed && (
            <span className="text-[#f3f3f5] font-semibold text-lg whitespace-nowrap tracking-tight">TSIS<span className="text-[#57aefd]">.ai</span></span>
          )}
        </Link>
        <button
          onClick={toggleCollapsed}
          className="w-7 h-7 rounded-md bg-[#1e2128] hover:bg-[#2d3139] flex items-center justify-center text-[#707990] hover:text-[#f3f3f5] transition-colors shrink-0 border border-[#2d3139]"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
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
                      ? 'text-[#57aefd] bg-[#57aefd]/10 border-l-2 border-[#57aefd]'
                      : 'text-[#9ba4b8] hover:text-[#f3f3f5] hover:bg-[#1e2128] border-l-2 border-transparent'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && (
                    <span className="flex-1">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[#7c51e7]/20 text-[#a78bfa] rounded">
                      {item.badge}
                    </span>
                  )}
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
          className={`flex items-center justify-center gap-2 w-full py-2.5 bg-[#2f91ef] hover:bg-[#57aefd] text-white text-[14px] font-medium rounded-md transition-colors ${
            collapsed ? 'px-2' : ''
          }`}
          title={collapsed ? 'Import Trades' : undefined}
        >
          <Upload className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Import Trades</span>}
        </Link>

        {/* Version */}
        {!collapsed && (
          <p className="text-center text-[11px] text-[#4c5263] mt-3">
            TSIS.ai v1.0
          </p>
        )}
      </div>
    </aside>
  );
}
