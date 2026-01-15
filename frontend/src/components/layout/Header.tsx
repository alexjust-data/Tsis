'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search, Moon, Sun, HelpCircle, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/trades', label: 'Trades' },
  { href: '/reports', label: 'Reports' },
  { href: '/journal', label: 'Journal' },
  { href: '/calendar', label: 'Calendar' },
];

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isDark, setIsDark] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="bg-[#0b0e11] border-b border-[#1e2329]">
      {/* Top Bar */}
      <div className="h-[50px] flex items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              TSIS<span className="text-green-500">.ai</span>
            </span>
          </Link>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search ticker, trade or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[280px] h-9 pl-10 pr-4 bg-[#1e2329] border border-[#2b3139] rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1e2329] border border-[#2b3139] hover:border-gray-600 transition-colors"
          >
            <div className="relative w-10 h-5 rounded-full bg-[#2b3139] flex items-center">
              <div className={`absolute w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center transition-all ${isDark ? 'right-0.5' : 'left-0.5'}`}>
                {isDark ? (
                  <Moon className="h-3 w-3 text-white" />
                ) : (
                  <Sun className="h-3 w-3 text-yellow-500" />
                )}
              </div>
            </div>
            <span className="text-xs text-gray-400 font-medium">Theme</span>
          </button>

          {/* Help */}
          <Link
            href="/help"
            className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Help</span>
          </Link>

          {/* User Menu */}
          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-[#2b3139]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm text-gray-300 hidden sm:block">
                  {user.name || user.email?.split('@')[0]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="h-[36px] flex items-center px-4 bg-[#14171c]">
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm font-medium transition-colors rounded ${
                  isActive
                    ? 'text-green-500 bg-green-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-[#1e2329]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
