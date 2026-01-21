'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { useCalculatorStore } from '@/lib/calculator';
import Header from './Header';
import CalculatorModal from '@/components/calculator/CalculatorModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const { token, fetchUser, _hasHydrated } = useAuthStore();
  const { toggleModal, loadSettings, loadTodayPnL } = useCalculatorStore();

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!_hasHydrated) return;

    if (!token) {
      router.push('/login');
      return;
    }
    fetchUser();
    // Pre-load calculator settings
    loadSettings(token);
    loadTodayPnL(token);
  }, [token, router, fetchUser, loadSettings, loadTodayPnL, _hasHydrated]);

  // Global F2 keyboard shortcut for calculator
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        toggleModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleModal]);

  // Show loading while hydrating or if no token after hydration
  if (!_hasHydrated || !token) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#26a69a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#0d1117] flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto bg-[#1e222d]">
          {children}
        </main>
      </div>
      {/* Global Calculator Modal - F2 to open */}
      <CalculatorModal />
    </>
  );
}
