"use client";

import { useState, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, Filter, Grid, ChevronDown } from "lucide-react";
import { fetchGapStats, type GapHistoryItem } from "@/lib/api";

interface GapHistoryProps {
  ticker: string;
  onGapClick?: (date: string, openPrice: number) => void;
}

export default function GapHistory({ ticker, onGapClick }: GapHistoryProps) {
  const [history, setHistory] = useState<GapHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayTab, setDayTab] = useState<"gapday" | "day2">("gapday");
  const [closeDirection, setCloseDirection] = useState<"all" | "green" | "red">("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleRowClick = (item: GapHistoryItem) => {
    setSelectedDate(item.date);
    onGapClick?.(item.date, item.open);
  };

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const getDirectionLabel = () => {
    if (closeDirection === "all") return "All gaps";
    if (closeDirection === "green") return "Green only";
    return "Red only";
  };

  return (
    <div className="h-full flex flex-col bg-[#131722]">
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

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#787b86]">Close direction:</span>
            {/* Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#1e222d] border border-[#2a2e39] rounded hover:border-[#363a45] transition-colors"
              >
                <TrendingUp className="h-3 w-3 text-[#26a69a]" />
                <TrendingDown className="h-3 w-3 text-[#ef5350]" />
                <span className="text-[#d1d4dc]">{getDirectionLabel()}</span>
                <ChevronDown className={`h-3 w-3 text-[#787b86] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-[#1e222d] border border-[#2a2e39] rounded shadow-lg z-50 min-w-[140px]">
                  <button
                    onClick={() => { setCloseDirection("all"); setDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#2a2e39] transition-colors ${closeDirection === "all" ? "text-[#2962ff]" : "text-[#d1d4dc]"}`}
                  >
                    <TrendingUp className="h-3 w-3 text-[#26a69a]" />
                    <TrendingDown className="h-3 w-3 text-[#ef5350]" />
                    All gaps
                  </button>
                  <button
                    onClick={() => { setCloseDirection("green"); setDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#2a2e39] transition-colors ${closeDirection === "green" ? "text-[#2962ff]" : "text-[#d1d4dc]"}`}
                  >
                    <TrendingUp className="h-3 w-3 text-[#26a69a]" />
                    Green only
                  </button>
                  <button
                    onClick={() => { setCloseDirection("red"); setDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#2a2e39] transition-colors ${closeDirection === "red" ? "text-[#2962ff]" : "text-[#d1d4dc]"}`}
                  >
                    <TrendingDown className="h-3 w-3 text-[#ef5350]" />
                    Red only
                  </button>
                </div>
              )}
            </div>
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
                  onClick={() => handleRowClick(item)}
                  className={`border-b border-[#2a2e39]/30 cursor-pointer transition-colors ${
                    selectedDate === item.date
                      ? 'bg-[#2962ff]/20 hover:bg-[#2962ff]/30'
                      : index % 2 === 0
                        ? 'bg-[#0d1117] hover:bg-[#1e222d]'
                        : 'bg-[#161b22] hover:bg-[#1e222d]'
                  }`}
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
