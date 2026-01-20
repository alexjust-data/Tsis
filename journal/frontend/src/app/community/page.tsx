"use client";

import AppLayout from "@/components/layout/AppLayout";
import { Users, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CommunityPage() {
  return (
    <AppLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Community</h1>
          <p className="text-[13px] text-[#787b86] mt-1">
            Connect with other traders and share insights
          </p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-[#131722] rounded border border-[#2a2e39] p-8 text-center max-w-lg mx-auto mt-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1e222d] flex items-center justify-center">
            <Users className="h-8 w-8 text-[#26a69a]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Coming Soon</h2>
          <p className="text-[14px] text-[#787b86] mb-6">
            The Community feature is currently under development. Soon you&apos;ll be
            able to share trades, follow other traders, and learn from the
            community.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[#1e222d] rounded text-left">
              <Lock className="h-5 w-5 text-[#787b86]" />
              <div>
                <p className="text-[14px] text-white font-medium">Shared Trades</p>
                <p className="text-[12px] text-[#787b86]">
                  View and learn from trades shared by other traders
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#1e222d] rounded text-left">
              <Lock className="h-5 w-5 text-[#787b86]" />
              <div>
                <p className="text-[14px] text-white font-medium">Top Performers</p>
                <p className="text-[12px] text-[#787b86]">
                  See leaderboards and most active traders
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#1e222d] rounded text-left">
              <Lock className="h-5 w-5 text-[#787b86]" />
              <div>
                <p className="text-[14px] text-white font-medium">Trade Discussions</p>
                <p className="text-[12px] text-[#787b86]">
                  Comment and discuss trading strategies
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 mt-6 text-[14px] text-[#26a69a] hover:text-[#26a69a]/80 transition-colors"
          >
            Return to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
