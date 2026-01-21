'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Upload,
  Calculator
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { useCalculatorStore } from '@/lib/calculator';

interface NavItem {
  href: string;
  label: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/reports', label: 'Reports' },
  { href: '/trades', label: 'Trades' },
  { href: '/journal', label: 'Journal' },
  { href: '/calculator', label: 'Risk' },
];

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { toggleModal } = useCalculatorStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Calculate indicator position for active/hovered item
  useEffect(() => {
    const activeIndex = NAV_ITEMS.findIndex(item =>
      pathname === item.href ||
      (item.href !== '/dashboard' && pathname?.startsWith(item.href))
    );

    const targetIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;
    const targetElement = itemRefs.current[targetIndex];

    if (targetElement && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const itemRect = targetElement.getBoundingClientRect();
      setIndicatorStyle({
        left: itemRect.left - navRect.left,
        width: itemRect.width,
      });
    }
  }, [pathname, hoveredIndex]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showUserMenu) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  return (
    <header className="bg-[#0d1117] border-b border-[#2a2e39]">
      {/* Top Row - Logo, Search, User */}
      <div className="h-14 flex items-center justify-between px-6">
        {/* Logo */}
        <a href="https://tsis.ai" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#2962ff] to-[#2962ff]/70 flex items-center justify-center shadow-lg shadow-[#2962ff]/20">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            TSIS<span className="text-[#2962ff]">.ai</span>
          </span>
        </a>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#787b86]" />
            <input
              type="text"
              placeholder="Search ticker, trade or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-10 pr-4 bg-[#131722] border border-[#2a2e39] rounded-lg text-[14px] text-white placeholder-[#787b86] focus:outline-none focus:border-[#2962ff] transition-colors"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Calculator Button */}
          <button
            onClick={toggleModal}
            className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-[#787b86] hover:text-white hover:bg-[#1e222d] rounded-md transition-colors"
            title="Position Calculator (F2)"
          >
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Calculator</span>
          </button>

          {/* Import Button */}
          <Link
            href="/trades"
            className="flex items-center gap-2 px-3 py-1.5 bg-[#2962ff] hover:bg-[#1e53e4] text-white text-[13px] font-medium rounded-md transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </Link>

          {/* Notifications */}
          <button className="relative p-2 text-[#787b86] hover:text-white hover:bg-[#1e222d] rounded-md transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ef5350] rounded-full" />
          </button>

          {/* User Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserMenu(!showUserMenu);
                }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#1e222d] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2962ff] to-[#26a69a] flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {(user.name || user.email)?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-[#787b86] transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-xl py-1 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-3 border-b border-[#2a2e39]">
                    <p className="text-sm font-medium text-white">{user.name || 'User'}</p>
                    <p className="text-xs text-[#787b86] truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        window.location.href = '/settings';
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-[13px] text-[#d1d4dc] hover:text-white hover:bg-[#2a2e39] transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                  </div>
                  <div className="border-t border-[#2a2e39] py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2 text-[13px] text-[#ef5350] hover:bg-[#ef5350]/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="/login"
                className="px-3 py-1.5 text-[13px] text-[#787b86] hover:text-white transition-colors"
              >
                Login
              </a>
              <a
                href="/register"
                className="px-3 py-1.5 text-[13px] bg-[#2962ff] hover:bg-[#1e53e4] text-white rounded-md transition-colors"
              >
                Register
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row - Navigation Tabs */}
      <div className="relative px-6" ref={navRef}>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item, index) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(el) => { itemRefs.current[index] = el; }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`relative px-3 py-2.5 text-[13px] font-medium transition-colors rounded-md ${
                  isActive
                    ? 'text-white'
                    : 'text-[#787b86] hover:text-white hover:bg-[#1e222d]'
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-[#ff9800]/20 text-[#ff9800] rounded">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Active Indicator Line */}
        <div
          className="absolute bottom-0 h-0.5 bg-[#2962ff] transition-all duration-200 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      </div>
    </header>
  );
}
