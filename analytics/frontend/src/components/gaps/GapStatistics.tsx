"use client";

import { useState, useEffect } from "react";
import { fetchGapStats, type GapStats as ApiGapStats, type GapDayStats } from "@/lib/api";

interface GapStatisticsProps {
  ticker: string;
}

export default function GapStatistics({ ticker }: GapStatisticsProps) {
  const [stats, setStats] = useState<ApiGapStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<"overview" | "gapday" | "day2">("gapday");
  const [statsMode, setStatsMode] = useState<"avg" | "median">("avg");

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

  const formatPercent = (value: number, showSign = false) => {
    const sign = showSign && value > 0 ? "+" : "";
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

  const currentDayStats: GapDayStats = viewTab === "day2" ? stats.day2 : stats.gap_day;

  // Overview tab content
  const renderOverview = () => (
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

      {/* Quick stats table */}
      <div className="bg-[#1e222d] rounded-lg border border-[#2a2e39] overflow-hidden">
        <table className="w-full text-xs">
          <tbody>
            <tr className="border-b border-[#2a2e39]/50">
              <td className="px-3 py-2 text-[#787b86]">Avg High Spike</td>
              <td className={`px-3 py-2 text-right tabular-nums ${stats.gap_day.avg_high_spike >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                {formatPercent(stats.gap_day.avg_high_spike)}
              </td>
            </tr>
            <tr className="border-b border-[#2a2e39]/50">
              <td className="px-3 py-2 text-[#787b86]">Avg Low Spike</td>
              <td className={`px-3 py-2 text-right tabular-nums ${stats.gap_day.avg_low_spike >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                {formatPercent(stats.gap_day.avg_low_spike)}
              </td>
            </tr>
            <tr className="border-b border-[#2a2e39]/50">
              <td className="px-3 py-2 text-[#787b86]">Avg Return</td>
              <td className={`px-3 py-2 text-right tabular-nums ${stats.gap_day.avg_return >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                {formatPercent(stats.gap_day.avg_return)}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-[#787b86]">Avg Range</td>
              <td className={`px-3 py-2 text-right tabular-nums text-[#26a69a]`}>
                {formatPercent(stats.gap_day.avg_range)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Close red bar */}
      <div className="bg-[#1e222d] rounded-lg p-3 border border-[#2a2e39]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#787b86]">Avg Close red</span>
          <span className="text-xs text-[#d1d4dc] tabular-nums">{stats.gap_day.avg_close_red.toFixed(2)} %</span>
        </div>
        <div className="flex h-2 rounded overflow-hidden">
          <div
            className="bg-[#26a69a]"
            style={{ width: `${100 - stats.gap_day.avg_close_red}%` }}
          />
          <div
            className="bg-[#ef5350]"
            style={{ width: `${stats.gap_day.avg_close_red}%` }}
          />
        </div>
      </div>
    </div>
  );

  // Gap Day / Day 2 detailed view with 2-column layout
  const renderDayStats = (dayStats: GapDayStats) => (
    <div className="p-3 flex-1 overflow-y-auto">
      {/* Two column layout */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left Column - Volume & Timing metrics */}
        <div className="space-y-px bg-[#1e222d] rounded-lg border border-[#2a2e39] overflow-hidden">
          <StatRow label="Avg Volume" value={dayStats.avg_volume} />
          <StatRow label="Avg $ Volume" value={dayStats.avg_dollar_volume} />
          <StatRow label="Avg Premarket Volume" value={dayStats.avg_premarket_volume} />
          <StatRow label="Avg Market Cap [open]" value={dayStats.avg_market_cap} />
          <StatRow label="Avg HOD Time" value={dayStats.avg_hod_time} />
          <StatRow label="Avg LOD Time" value={dayStats.avg_lod_time} />
          <StatRow label="Avg Premarket High Time" value={dayStats.avg_premarket_high_time} />
          <StatRow label="Avg Premarket Low Time" value={dayStats.avg_premarket_low_time} />
          <StatRow
            label="Avg Premarket High Fade"
            value={formatPercent(dayStats.avg_premarket_high_fade)}
            valueColor={dayStats.avg_premarket_high_fade >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}
          />
          {/* Close red bar */}
          <div className="px-3 py-2 border-t border-[#2a2e39]/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-[#787b86]">Avg Close red</span>
              <span className="text-[11px] text-[#d1d4dc] tabular-nums">{dayStats.avg_close_red.toFixed(2)} %</span>
            </div>
            <div className="flex h-1.5 rounded overflow-hidden">
              <div
                className="bg-[#26a69a]"
                style={{ width: `${100 - dayStats.avg_close_red}%` }}
              />
              <div
                className="bg-[#ef5350]"
                style={{ width: `${dayStats.avg_close_red}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Price metrics */}
        <div className="space-y-px bg-[#1e222d] rounded-lg border border-[#2a2e39] overflow-hidden">
          <StatRow
            label="Avg Gap Value"
            value={formatPercent(dayStats.avg_gap_value)}
            valueColor={dayStats.avg_gap_value >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}
          />
          <StatRow
            label="Avg High Spike"
            value={formatPercent(dayStats.avg_high_spike)}
            valueColor={dayStats.avg_high_spike >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}
          />
          <StatRow
            label="Avg Low Spike"
            value={formatPercent(dayStats.avg_low_spike)}
            valueColor={dayStats.avg_low_spike >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}
          />
          <StatRow
            label="Avg Range"
            value={formatPercent(dayStats.avg_range)}
            valueColor="text-[#26a69a]"
          />
          <StatRow
            label="Avg Return"
            value={formatPercent(dayStats.avg_return)}
            valueColor={dayStats.avg_return >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}
          />
          <StatRow
            label="Avg Change"
            value={formatPercent(dayStats.avg_change)}
            valueColor={dayStats.avg_change >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}
          />
          <StatRow
            label="Avg High Gap"
            value={formatPercent(dayStats.avg_high_gap)}
            valueColor={dayStats.avg_high_gap >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}
          />
          <StatRow
            label="Avg High Fade"
            value={formatPercent(dayStats.avg_high_fade)}
            valueColor={dayStats.avg_high_fade >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}
          />
          <StatRow
            label="Avg High to PMH Change"
            value={formatPercent(dayStats.avg_high_to_pmh_change)}
            valueColor="text-[#787b86]"
          />
          <StatRow
            label="Avg Close to PMH Change"
            value={formatPercent(dayStats.avg_close_to_pmh_change)}
            valueColor="text-[#787b86]"
          />
          <StatRow
            label="Avg Premarket High Gap"
            value={formatPercent(dayStats.avg_premarket_high_gap)}
            valueColor="text-[#787b86]"
          />
        </div>
      </div>

      {/* Price change from open chart placeholder */}
      <div className="mt-3 bg-[#1e222d] rounded-lg border border-[#2a2e39] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#d1d4dc] font-medium">Avg Price change from open</span>
          <span className="text-[10px] text-[#787b86]">Intraday</span>
        </div>
        <div className="h-[120px] flex items-center justify-center border border-dashed border-[#2a2e39] rounded">
          <span className="text-[11px] text-[#787b86]">Intraday chart coming soon</span>
        </div>
        {/* Time axis labels */}
        <div className="flex justify-between mt-2 text-[10px] text-[#787b86]">
          <span>4:00</span>
          <span>6:00</span>
          <span>8:00</span>
          <span>10:00</span>
          <span>12:00</span>
          <span>14:00</span>
          <span>16:00</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#131722]">
      {/* Header tabs */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2e39]">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setViewTab("overview")}
            className={`px-2.5 py-1.5 text-[11px] font-medium rounded transition-colors ${
              viewTab === "overview"
                ? "bg-[#2962ff] text-white"
                : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewTab("gapday")}
            className={`px-2.5 py-1.5 text-[11px] font-medium rounded transition-colors ${
              viewTab === "gapday"
                ? "bg-[#2962ff] text-white"
                : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
            }`}
          >
            Gap day
          </button>
          <button
            onClick={() => setViewTab("day2")}
            className={`px-2.5 py-1.5 text-[11px] font-medium rounded transition-colors ${
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
            className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
              statsMode === "avg"
                ? "bg-[#2a2e39] text-[#d1d4dc]"
                : "text-[#787b86] hover:text-[#d1d4dc]"
            }`}
          >
            Avg
          </button>
          <button
            onClick={() => setStatsMode("median")}
            className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
              statsMode === "median"
                ? "bg-[#2a2e39] text-[#d1d4dc]"
                : "text-[#787b86] hover:text-[#d1d4dc]"
            }`}
          >
            Median
          </button>
        </div>
      </div>

      {/* Number of gaps badge */}
      <div className="px-3 py-2 border-b border-[#2a2e39] flex items-center gap-2">
        <span className="text-[11px] text-[#787b86]">Gaps:</span>
        <span className="text-[11px] font-medium text-[#d1d4dc] bg-[#2a2e39] px-2 py-0.5 rounded">
          {stats.number_of_gaps}
        </span>
      </div>

      {/* Content area */}
      {viewTab === "overview" ? renderOverview() : renderDayStats(currentDayStats)}
    </div>
  );
}

// Helper component for stat rows
function StatRow({
  label,
  value,
  valueColor = "text-[#d1d4dc]"
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2a2e39]/30 last:border-b-0">
      <span className="text-[11px] text-[#787b86]">{label}</span>
      <span className={`text-[11px] tabular-nums ${valueColor}`}>{value}</span>
    </div>
  );
}
