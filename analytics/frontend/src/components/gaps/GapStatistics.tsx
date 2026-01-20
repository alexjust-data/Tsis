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
  const [viewTab, setViewTab] = useState<"overview" | "gapday" | "day2">("overview");
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

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)} %`;
  };

  const getValueColor = (value: number) => {
    return value >= 0 ? "text-[#26a69a]" : "text-[#ef5350]";
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
            Gap overview
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
        <div className="flex items-center gap-1 text-[11px]">
          <button
            onClick={() => setStatsMode("avg")}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              statsMode === "avg"
                ? "text-[#d1d4dc]"
                : "text-[#787b86] hover:text-[#d1d4dc]"
            }`}
          >
            Avg
          </button>
          <span className="text-[#787b86]">|</span>
          <button
            onClick={() => setStatsMode("median")}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              statsMode === "median"
                ? "text-[#d1d4dc]"
                : "text-[#787b86] hover:text-[#d1d4dc]"
            }`}
          >
            Median
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-3">
        {viewTab === "overview" ? (
          // Gap Overview with 2x2 cards + two columns
          <div className="space-y-3">
            {/* Top 2x2 grid of cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#1e222d] rounded p-3 border border-[#2a2e39]">
                <p className="text-[11px] text-[#ef5350] mb-1">Number of gaps</p>
                <p className="text-xl font-bold text-[#d1d4dc]">{stats.number_of_gaps}</p>
              </div>
              <div className="bg-[#1e222d] rounded p-3 border border-[#2a2e39]">
                <p className="text-[11px] text-[#ef5350] mb-1">Avg Gap Value</p>
                <p className="text-xl font-bold text-[#d1d4dc]">{stats.avg_gap_value.toFixed(2)} %</p>
              </div>
              <div className="bg-[#1e222d] rounded p-3 border border-[#2a2e39]">
                <p className="text-[11px] text-[#26a69a] mb-1">Avg Volume</p>
                <p className="text-xl font-bold text-[#d1d4dc]">{stats.avg_volume}</p>
              </div>
              <div className="bg-[#1e222d] rounded p-3 border border-[#2a2e39]">
                <p className="text-[11px] text-[#26a69a] mb-1">Avg Premarket Volume</p>
                <p className="text-xl font-bold text-[#d1d4dc]">{stats.avg_premarket_volume}</p>
              </div>
            </div>

            {/* Gap Day / Day 2 column headers */}
            <div className="flex gap-2 mt-2">
              <div className="flex-1">
                <span className="inline-block px-2 py-1 text-[11px] font-medium bg-[#2a2e39] text-[#d1d4dc] rounded">
                  Gap Day
                </span>
              </div>
              <div className="flex-1">
                <span className="inline-block px-2 py-1 text-[11px] font-medium bg-[#2a2e39] text-[#d1d4dc] rounded">
                  Day 2
                </span>
              </div>
            </div>

            {/* Two columns: Gap Day stats | Day 2 stats */}
            <div className="grid grid-cols-2 gap-2">
              {/* Gap Day Column */}
              <div className="space-y-0 bg-[#1e222d] rounded border border-[#2a2e39] overflow-hidden">
                <StatRow label="Avg Market Cap [open]" value={stats.gap_day.avg_market_cap} />
                <StatRow label="Avg High Spike" value={formatPercent(stats.gap_day.avg_high_spike)} valueColor={getValueColor(stats.gap_day.avg_high_spike)} />
                <StatRow label="Avg Low Spike" value={formatPercent(stats.gap_day.avg_low_spike)} valueColor={getValueColor(stats.gap_day.avg_low_spike)} />
                <StatRow label="Avg Return" value={formatPercent(stats.gap_day.avg_return)} valueColor={getValueColor(stats.gap_day.avg_return)} />
                <StatRow label="Avg Change" value={formatPercent(stats.gap_day.avg_change)} valueColor={getValueColor(stats.gap_day.avg_change)} />
                <StatRow label="Avg Range" value={formatPercent(stats.gap_day.avg_range)} valueColor="text-[#26a69a]" />
                <StatRow label="Avg HOD Time" value={stats.gap_day.avg_hod_time} />
                <StatRow label="Avg LOD Time" value={stats.gap_day.avg_lod_time} />
                {/* Close red bar */}
                <div className="px-2 py-1.5 border-t border-[#2a2e39]/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#787b86]">Avg Close red</span>
                    <span className="text-[10px] text-[#d1d4dc]">{stats.gap_day.avg_close_red.toFixed(2)} %</span>
                  </div>
                  <div className="flex h-1.5 rounded overflow-hidden">
                    <div className="bg-[#ef5350]" style={{ width: `${stats.gap_day.avg_close_red}%` }} />
                    <div className="bg-[#26a69a]" style={{ width: `${100 - stats.gap_day.avg_close_red}%` }} />
                  </div>
                </div>
              </div>

              {/* Day 2 Column */}
              <div className="space-y-0 bg-[#1e222d] rounded border border-[#2a2e39] overflow-hidden">
                <StatRow label="Avg Market Cap [open]" value={stats.day2.avg_market_cap} />
                <StatRow label="Avg High Spike" value={formatPercent(stats.day2.avg_high_spike)} valueColor={getValueColor(stats.day2.avg_high_spike)} />
                <StatRow label="Avg Low Spike" value={formatPercent(stats.day2.avg_low_spike)} valueColor={getValueColor(stats.day2.avg_low_spike)} />
                <StatRow label="Avg Return" value={formatPercent(stats.day2.avg_return)} valueColor={getValueColor(stats.day2.avg_return)} />
                <StatRow label="Avg Change" value={formatPercent(stats.day2.avg_change)} valueColor={getValueColor(stats.day2.avg_change)} />
                <StatRow label="Avg Range" value={formatPercent(stats.day2.avg_range)} valueColor="text-[#26a69a]" />
                <StatRow label="Avg HOD Time" value={stats.day2.avg_hod_time} />
                <StatRow label="Avg LOD Time" value={stats.day2.avg_lod_time} />
                {/* Close red bar */}
                <div className="px-2 py-1.5 border-t border-[#2a2e39]/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#787b86]">Avg Close red</span>
                    <span className="text-[10px] text-[#d1d4dc]">{stats.day2.avg_close_red.toFixed(2)} %</span>
                  </div>
                  <div className="flex h-1.5 rounded overflow-hidden">
                    <div className="bg-[#ef5350]" style={{ width: `${stats.day2.avg_close_red}%` }} />
                    <div className="bg-[#26a69a]" style={{ width: `${100 - stats.day2.avg_close_red}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Single day detailed view (Gap day or Day 2)
          <SingleDayStats
            dayStats={viewTab === "gapday" ? stats.gap_day : stats.day2}
            title={viewTab === "gapday" ? "Gap Day" : "Day 2"}
          />
        )}
      </div>
    </div>
  );
}

// Single day detailed stats view
function SingleDayStats({ dayStats, title }: { dayStats: GapDayStats; title: string }) {
  const formatPercent = (value: number) => `${value.toFixed(2)} %`;
  const getValueColor = (value: number) => value >= 0 ? "text-[#26a69a]" : "text-[#ef5350]";

  return (
    <div className="space-y-3">
      <div className="bg-[#1e222d] rounded border border-[#2a2e39] overflow-hidden">
        <div className="px-3 py-2 border-b border-[#2a2e39] bg-[#2a2e39]/30">
          <span className="text-[11px] font-medium text-[#d1d4dc]">{title} Statistics</span>
        </div>
        <StatRow label="Avg Volume" value={dayStats.avg_volume} />
        <StatRow label="Avg $ Volume" value={dayStats.avg_dollar_volume} />
        <StatRow label="Avg Premarket Volume" value={dayStats.avg_premarket_volume} />
        <StatRow label="Avg Market Cap [open]" value={dayStats.avg_market_cap} />
        <StatRow label="Avg Gap Value" value={formatPercent(dayStats.avg_gap_value)} valueColor={getValueColor(dayStats.avg_gap_value)} />
        <StatRow label="Avg High Spike" value={formatPercent(dayStats.avg_high_spike)} valueColor={getValueColor(dayStats.avg_high_spike)} />
        <StatRow label="Avg Low Spike" value={formatPercent(dayStats.avg_low_spike)} valueColor={getValueColor(dayStats.avg_low_spike)} />
        <StatRow label="Avg Return" value={formatPercent(dayStats.avg_return)} valueColor={getValueColor(dayStats.avg_return)} />
        <StatRow label="Avg Change" value={formatPercent(dayStats.avg_change)} valueColor={getValueColor(dayStats.avg_change)} />
        <StatRow label="Avg Range" value={formatPercent(dayStats.avg_range)} valueColor="text-[#26a69a]" />
        <StatRow label="Avg High Gap" value={formatPercent(dayStats.avg_high_gap)} valueColor={getValueColor(dayStats.avg_high_gap)} />
        <StatRow label="Avg High Fade" value={formatPercent(dayStats.avg_high_fade)} valueColor={getValueColor(dayStats.avg_high_fade)} />
        <StatRow label="Avg HOD Time" value={dayStats.avg_hod_time} />
        <StatRow label="Avg LOD Time" value={dayStats.avg_lod_time} />
        <StatRow label="Avg Premarket High Time" value={dayStats.avg_premarket_high_time} />
        <StatRow label="Avg Premarket Low Time" value={dayStats.avg_premarket_low_time} />
        {/* Close red bar */}
        <div className="px-3 py-2 border-t border-[#2a2e39]/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-[#787b86]">Avg Close red</span>
            <span className="text-[11px] text-[#d1d4dc]">{dayStats.avg_close_red.toFixed(2)} %</span>
          </div>
          <div className="flex h-2 rounded overflow-hidden">
            <div className="bg-[#ef5350]" style={{ width: `${dayStats.avg_close_red}%` }} />
            <div className="bg-[#26a69a]" style={{ width: `${100 - dayStats.avg_close_red}%` }} />
          </div>
        </div>
      </div>
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
    <div className="flex items-center justify-between px-2 py-1 border-b border-[#2a2e39]/30 last:border-b-0">
      <span className="text-[10px] text-[#787b86]">{label}</span>
      <span className={`text-[10px] tabular-nums ${valueColor}`}>{value}</span>
    </div>
  );
}
