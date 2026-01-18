'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { useCalculatorStore } from '@/lib/calculator';
import Header from './Header';
import Sidebar from './Sidebar';
import CalculatorModal from '@/components/calculator/CalculatorModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const { token, fetchUser } = useAuthStore();
  const { toggleModal, loadSettings, loadTodayPnL } = useCalculatorStore();

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchUser();
    // Pre-load calculator settings
    loadSettings(token);
    loadTodayPnL(token);
  }, [token, router, fetchUser, loadSettings, loadTodayPnL]);

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

  if (!token) {
    return (
      <div className="min-h-screen bg-[#14161d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00a449] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#14161d] flex">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-[#22262f]">
            {children}
          </main>
        </div>
      </div>
      {/* Global Calculator Modal - F2 to open */}
      <CalculatorModal />
    </>
  );
}
