'use client';

import { useState } from 'react';
import { Search, Bell, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';

export default function Header() {
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="h-14 bg-[#0d1117] border-b border-[#2a2e39] flex items-center justify-between px-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#787b86]" />
        <input
          type="text"
          placeholder="Search ticker, trade or tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[320px] h-9 pl-10 pr-4 bg-[#131722] border border-[#2a2e39] rounded text-[14px] text-white placeholder-[#787b86] focus:outline-none focus:border-[#2962ff] transition-colors"
        />
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-[#787b86] hover:text-white transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#ef5350] rounded-full" />
        </button>

        {/* User Menu */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#131722] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#2962ff] flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-[14px] text-white">
                {user.name || user.email?.split('@')[0]}
              </span>
              <ChevronDown className="h-4 w-4 text-[#787b86]" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#131722] border border-[#2a2e39] rounded shadow-lg py-1 z-50">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    window.location.href = '/settings';
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-[14px] text-[#787b86] hover:text-white hover:bg-[#1e222d] transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <div className="border-t border-[#2a2e39] my-1" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-[14px] text-[#ef5350] hover:bg-[#ef5350]/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <a
              href="/login"
              className="px-4 py-2 text-[14px] text-[#787b86] hover:text-white transition-colors"
            >
              Login
            </a>
            <a
              href="/register"
              className="px-4 py-2 text-[14px] bg-[#2962ff] hover:bg-[#2962ff]/90 text-white rounded transition-colors"
            >
              Register
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
