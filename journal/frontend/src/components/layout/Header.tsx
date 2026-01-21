'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Bell,
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
  { href: '/calculator', label: 'Risk Calculator' },
];

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { toggleModal } = useCalculatorStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [searchExpanded, setSearchExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

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
    <header className="bg-[#0d1117]">
      {/* Top Row - Logo, Nav, Actions */}
      <div className="h-14 flex items-center px-6">
        {/* Logo - matches landing */}
        <a href="https://tsis.ai" className="flex items-baseline gap-2 shrink-0">
          <span className="text-white font-bold text-xl tracking-tight">
            TSIS<span className="text-white">.ai</span>
          </span>
          <span className="text-[#787b86] text-sm">to SmallCaps Trading</span>
        </a>

        {/* Spacer */}
        <div className="w-12" />

        {/* Navigation Tabs */}
        <div className="relative flex-1" ref={navRef}>
          <nav className="flex items-center gap-0.5">
            {NAV_ITEMS.map((item, index) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              const isHovered = hoveredIndex === index;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={(el) => { itemRefs.current[index] = el; }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`relative px-3 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-[#1e222d] rounded-t-md'
                      : isHovered
                        ? 'text-white bg-[#1e222d]/50 rounded-t-md'
                        : 'text-[#787b86] hover:text-white rounded-t-md'
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

          {/* Hover Indicator Line - only shows on hover for non-active tabs */}
          {hoveredIndex !== null && !(pathname === NAV_ITEMS[hoveredIndex]?.href ||
            (NAV_ITEMS[hoveredIndex]?.href !== '/dashboard' && pathname?.startsWith(NAV_ITEMS[hoveredIndex]?.href))) && (
            <div
              className="absolute bottom-0 h-0.5 bg-[#2962ff] transition-all duration-200 ease-out rounded-full"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
            />
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Collapsible Search */}
          <div
            ref={searchRef}
            className="relative"
            onMouseEnter={() => setSearchExpanded(true)}
            onMouseLeave={() => {
              if (!searchQuery) setSearchExpanded(false);
            }}
          >
            <div className={`flex items-center transition-all duration-300 ease-out ${
              searchExpanded ? 'w-48' : 'w-8'
            }`}>
              <button
                className="absolute left-0 p-2 text-[#787b86] hover:text-white transition-colors z-10"
                onClick={() => setSearchExpanded(true)}
              >
                <Search className="h-4 w-4" />
              </button>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-8 pl-8 pr-3 bg-[#131722] border border-[#2a2e39] rounded text-[13px] text-white placeholder-[#787b86] focus:outline-none focus:border-[#2962ff] transition-all duration-300 ${
                  searchExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />
            </div>
          </div>

          {/* Risk Calculator Button */}
          <button
            onClick={toggleModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] text-[#787b86] hover:text-white hover:bg-[#1e222d] rounded transition-colors"
            title="Risk Calculator (F2)"
          >
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Risk Calculator</span>
          </button>

          {/* Import Button */}
          <Link
            href="/trades"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2962ff] hover:bg-[#1e53e4] text-white text-[13px] font-medium rounded transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </Link>

          {/* Notifications */}
          <button className="relative p-2 text-[#787b86] hover:text-white hover:bg-[#1e222d] rounded transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#ef5350] rounded-full" />
          </button>

          {/* User Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserMenu(!showUserMenu);
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#1e222d] transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2962ff] to-[#26a69a] flex items-center justify-center">
                  <span className="text-white text-[10px] font-medium">
                    {(user.name || user.email)?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-[#787b86] transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
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
                className="px-3 py-1.5 text-[13px] bg-[#2962ff] hover:bg-[#1e53e4] text-white rounded transition-colors"
              >
                Register
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Bottom border with rounded corners for active tab */}
      <div className="relative h-[1px] bg-[#2a2e39] mx-6">
        {/* Active tab connector - creates the rounded corner effect */}
        {NAV_ITEMS.map((item, index) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const el = itemRefs.current[index];

          if (!isActive || !el || !navRef.current) return null;

          const navRect = navRef.current.getBoundingClientRect();
          const itemRect = el.getBoundingClientRect();
          const left = itemRect.left - navRect.left;
          const width = itemRect.width;

          return (
            <div key={item.href}>
              {/* Hide border under active tab */}
              <div
                className="absolute top-0 h-[1px] bg-[#1e222d]"
                style={{ left: left + 4, width: width - 8 }}
              />
              {/* Left corner */}
              <div
                className="absolute -top-[3px] w-[4px] h-[4px] bg-[#0d1117]"
                style={{ left: left }}
              >
                <div className="w-full h-full bg-[#1e222d] rounded-br-[4px]" />
              </div>
              {/* Right corner */}
              <div
                className="absolute -top-[3px] w-[4px] h-[4px] bg-[#0d1117]"
                style={{ left: left + width - 4 }}
              >
                <div className="w-full h-full bg-[#1e222d] rounded-bl-[4px]" />
              </div>
            </div>
          );
        })}
      </div>
    </header>
  );
}
