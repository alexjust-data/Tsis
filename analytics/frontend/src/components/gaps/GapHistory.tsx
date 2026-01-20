"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Filter, Grid } from "lucide-react";
import { fetchGapStats, type GapHistoryItem } from "@/lib/api";

interface GapHistoryProps {
  ticker: string;
}

export default function GapHistory({ ticker }: GapHistoryProps) {
  const [history, setHistory] = useState<GapHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayTab, setDayTab] = useState<"gapday" | "day2">("gapday");
  const [closeDirection, setCloseDirection] = useState<"all" | "green" | "red">("all");

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        const data = await fetchGapStats(ticker);
        setHistory(data.gaps || []);
      } catch (err) {
        console.error('Failed to load gap history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [ticker]);

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "" : ""}${value.toFixed(2)} %`;
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)} M`;
    if (vol >= 1_000) return `${(vol / 1_000).toFixed(2)} K`;
    return vol.toString();
  };

  const filteredHistory = history.filter(item => {
    if (closeDirection === "all") return true;
    return item.close_direction === closeDirection;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#131722] border-t border-[#2a2e39]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2e39]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDayTab("gapday")}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              dayTab === "gapday"
                ? "bg-[#2a2e39] text-[#d1d4dc]"
                : "text-[#787b86] hover:text-[#d1d4dc]"
            }`}
          >
            Gap day
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

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#787b86]">Close direction:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCloseDirection("all")}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                closeDirection === "all"
                  ? "bg-[#2a2e39] text-[#d1d4dc]"
                  : "text-[#787b86] hover:text-[#d1d4dc]"
              }`}
            >
              <TrendingUp className="h-3 w-3 text-[#26a69a]" />
              <TrendingDown className="h-3 w-3 text-[#ef5350]" />
              All gaps
            </button>
          </div>
          <button className="p-1.5 text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] rounded">
            <Filter className="h-4 w-4" />
          </button>
          <button className="p-1.5 text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] rounded">
            <Grid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#181c25]">
            <tr>
              <th className="text-left px-3 py-2 text-[11px] text-[#787b86] uppercase tracking-wide font-semibold">
                Gap date
                <span className="ml-1 text-[#4c5263]">&#9660;</span>
              </th>
              <th className="text-right px-3 py-2 text-[11px] text-[#787b86] uppercase tracking-wide font-semibold">Gap Value</th>
              <th className="text-right px-3 py-2 text-[11px] text-[#787b86] uppercase tracking-wide font-semibold">Volume</th>
              <th className="text-right px-3 py-2 text-[11px] text-[#787b86] uppercase tracking-wide font-semibold">High Spike</th>
              <th className="text-right px-3 py-2 text-[11px] text-[#787b86] uppercase tracking-wide font-semibold">Return</th>
              <th className="text-right px-3 py-2 text-[11px] text-[#787b86] uppercase tracking-wide font-semibold">HOD Time</th>
              <th className="text-right px-3 py-2 text-[11px] text-[#787b86] uppercase tracking-wide font-semibold">Close Direction</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-[#787b86]">
                  <div className="w-6 h-6 border-2 border-[#2962ff] border-t-transparent rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-[#787b86]">
                  No gap history available
                </td>
              </tr>
            ) : (
              filteredHistory.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-[#2a2e39]/50 hover:bg-[#1e222d] transition-colors"
                >
                  <td className="px-3 py-2 text-[#d1d4dc] tabular-nums">{item.date}</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${item.gap_value >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                    {formatPercent(item.gap_value)}
                  </td>
                  <td className="px-3 py-2 text-right text-[#d1d4dc] tabular-nums">{formatVolume(item.volume)}</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${item.high_spike >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                    {formatPercent(item.high_spike)}
                  </td>
                  <td className={`px-3 py-2 text-right tabular-nums ${item.return >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                    {formatPercent(item.return)}
                  </td>
                  <td className="px-3 py-2 text-right text-[#d1d4dc] tabular-nums">--</td>
                  <td className="px-3 py-2 text-right">
                    <span className={item.close_direction === "green" ? "text-[#26a69a]" : "text-[#ef5350]"}>
                      {item.close_direction}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
