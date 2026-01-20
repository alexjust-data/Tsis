"use client";

import { useState, useEffect } from "react";
import { fetchGapStats, type GapStats as ApiGapStats } from "@/lib/api";

interface GapStatisticsProps {
  ticker: string;
}

export default function GapStatistics({ ticker }: GapStatisticsProps) {
  const [stats, setStats] = useState<ApiGapStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<"overview" | "gapday" | "day2">("overview");
  const [statsMode, setStatsMode] = useState<"avg" | "median">("avg");
  const [dayTab, setDayTab] = useState<"gapday" | "day2">("gapday");

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchGapStats(ticker);
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [ticker]);

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "" : "";
    return `${sign}${value.toFixed(2)} %`;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#131722]">
        <div className="w-8 h-8 border-2 border-[#2962ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="h-full flex items-center justify-center bg-[#131722] text-[#787b86] text-sm">
        {error || 'No data available'}
      </div>
    );
  }

  const currentDayStats = dayTab === "gapday" ? stats.gap_day : stats.day2;

  return (
    <div className="h-full flex flex-col bg-[#131722]">
      {/* Header tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2e39]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewTab("overview")}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewTab === "overview"
                ? "bg-[#2962ff] text-white"
                : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
            }`}
          >
            Gap overview
          </button>
          <button
            onClick={() => setViewTab("gapday")}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewTab === "gapday"
                ? "bg-[#2962ff] text-white"
                : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
            }`}
          >
            Gap day
          </button>
          <button
            onClick={() => setViewTab("day2")}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewTab === "day2"
                ? "bg-[#2962ff] text-white"
                : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
            }`}
          >
            Day 2
          </button>
        </div>
        <div className="flex items-center gap-0.5 bg-[#1e222d] rounded p-0.5">
          <button
            onClick={() => setStatsMode("avg")}
            className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
              statsMode === "avg"
                ? "bg-[#2a2e39] text-[#d1d4dc]"
                : "text-[#787b86] hover:text-[#d1d4dc]"
            }`}
          >
            Avg
          </button>
          <button
            onClick={() => setStatsMode("median")}
            className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
              statsMode === "median"
                ? "bg-[#2a2e39] text-[#d1d4dc]"
                : "text-[#787b86] hover:text-[#d1d4dc]"
            }`}
          >
            Median
          </button>
        </div>
      </div>

      {/* Main stats grid */}
      <div className="p-3 space-y-3 flex-1 overflow-y-auto">
        {/* Top stats cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1e222d] rounded-lg p-3 border border-[#2a2e39]">
            <p className="text-[11px] text-[#26a69a] uppercase tracking-wide mb-1">Number of gaps</p>
            <p className="text-2xl font-bold text-[#d1d4dc]">{stats.number_of_gaps}</p>
          </div>
          <div className="bg-[#1e222d] rounded-lg p-3 border border-[#2a2e39]">
            <p className="text-[11px] text-[#26a69a] uppercase tracking-wide mb-1">Avg Gap Value</p>
            <p className="text-2xl font-bold text-[#26a69a]">{stats.avg_gap_value.toFixed(2)} %</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1e222d] rounded-lg p-3 border border-[#2a2e39]">
            <p className="text-[11px] text-[#26a69a] uppercase tracking-wide mb-1">Avg Volume</p>
            <p className="text-xl font-bold text-[#d1d4dc]">{stats.avg_volume}</p>
          </div>
          <div className="bg-[#1e222d] rounded-lg p-3 border border-[#2a2e39]">
            <p className="text-[11px] text-[#26a69a] uppercase tracking-wide mb-1">Avg Premarket Volume</p>
            <p className="text-xl font-bold text-[#d1d4dc]">{stats.avg_premarket_volume}</p>
          </div>
        </div>

        {/* Day tabs */}
        <div className="flex items-center gap-1 mt-4">
          <button
            onClick={() => setDayTab("gapday")}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              dayTab === "gapday"
                ? "bg-[#2a2e39] text-[#d1d4dc]"
                : "text-[#787b86] hover:text-[#d1d4dc]"
            }`}
          >
            Gap Day
          </button>
          <button
            onClick={() => setDayTab("day2")}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              dayTab === "day2"
                ? "bg-[#2a2e39] text-[#d1d4dc]"
                : "text-[#787b86] hover:text-[#d1d4dc]"
            }`}
          >
            Day 2
          </button>
        </div>

        {/* Detailed stats table */}
        <div className="bg-[#1e222d] rounded-lg border border-[#2a2e39] overflow-hidden">
          <table className="w-full text-xs">
            <tbody>
              <tr className="border-b border-[#2a2e39]/50">
                <td className="px-3 py-2 text-[#787b86]">Avg Market Cap [open]</td>
                <td className="px-3 py-2 text-right text-[#d1d4dc] tabular-nums">{currentDayStats.avg_market_cap}</td>
              </tr>
              <tr className="border-b border-[#2a2e39]/50">
                <td className="px-3 py-2 text-[#787b86]">Avg High Spike</td>
                <td className={`px-3 py-2 text-right tabular-nums ${currentDayStats.avg_high_spike >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                  {formatPercent(currentDayStats.avg_high_spike)}
                </td>
              </tr>
              <tr className="border-b border-[#2a2e39]/50">
                <td className="px-3 py-2 text-[#787b86]">Avg Low Spike</td>
                <td className={`px-3 py-2 text-right tabular-nums ${currentDayStats.avg_low_spike >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                  {formatPercent(currentDayStats.avg_low_spike)}
                </td>
              </tr>
              <tr className="border-b border-[#2a2e39]/50">
                <td className="px-3 py-2 text-[#787b86]">Avg Return</td>
                <td className={`px-3 py-2 text-right tabular-nums ${currentDayStats.avg_return >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                  {formatPercent(currentDayStats.avg_return)}
                </td>
              </tr>
              <tr className="border-b border-[#2a2e39]/50">
                <td className="px-3 py-2 text-[#787b86]">Avg Change</td>
                <td className={`px-3 py-2 text-right tabular-nums ${currentDayStats.avg_change >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                  {formatPercent(currentDayStats.avg_change)}
                </td>
              </tr>
              <tr className="border-b border-[#2a2e39]/50">
                <td className="px-3 py-2 text-[#787b86]">Avg Range</td>
                <td className={`px-3 py-2 text-right tabular-nums ${currentDayStats.avg_range >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                  {formatPercent(currentDayStats.avg_range)}
                </td>
              </tr>
              <tr className="border-b border-[#2a2e39]/50">
                <td className="px-3 py-2 text-[#787b86]">Avg HOD Time</td>
                <td className="px-3 py-2 text-right text-[#d1d4dc] tabular-nums">{currentDayStats.avg_hod_time}</td>
              </tr>
              <tr className="border-b border-[#2a2e39]/50">
                <td className="px-3 py-2 text-[#787b86]">Avg LOD Time</td>
                <td className="px-3 py-2 text-right text-[#d1d4dc] tabular-nums">{currentDayStats.avg_lod_time}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Close red bar */}
        <div className="bg-[#1e222d] rounded-lg p-3 border border-[#2a2e39]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#787b86]">Avg Close red</span>
            <span className="text-xs text-[#d1d4dc] tabular-nums">{currentDayStats.avg_close_red.toFixed(2)} %</span>
          </div>
          <div className="flex h-2 rounded overflow-hidden">
            <div
              className="bg-[#26a69a]"
              style={{ width: `${100 - currentDayStats.avg_close_red}%` }}
            />
            <div
              className="bg-[#ef5350]"
              style={{ width: `${currentDayStats.avg_close_red}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
