"use client";

import { useState, useRef, useMemo } from "react";
import { ChevronDown } from "lucide-react";

interface ScreenerData {
  ticker: string;
  last: number;
  change: number;
  volume: string;
  signal: string;
}

interface ScreenerTableProps {
  title: string;
  data: ScreenerData[];
  defaultTimeframe?: "intraday" | "daily";
  sortDirection?: "desc" | "asc"; // desc for LONG (highest first), asc for SHORT (lowest first)
}

// Chart tooltip component - Clean minimal style like Finviz
function ChartTooltip({
  ticker,
  isVisible,
  position
}: {
  ticker: string;
  isVisible: boolean;
  position: { x: number; y: number }
}) {
  if (!isVisible) return null;

  // TradingView mini chart - minimal clean version
  const chartUrl = `https://s.tradingview.com/embed-widget/mini-symbol-overview/?locale=en#%7B%22symbol%22%3A%22${ticker}%22%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22dateRange%22%3A%221M%22%2C%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Atrue%2C%22autosize%22%3Atrue%2C%22largeChartUrl%22%3A%22%22%2C%22noTimeScale%22%3Atrue%2C%22chartOnly%22%3Atrue%7D`;

  return (
    <div
      className="fixed z-50 bg-[#131722] border border-[#2a2e39] rounded shadow-2xl overflow-hidden"
      style={{
        left: position.x + 15,
        top: position.y - 80,
        width: 320,
        height: 180,
      }}
    >
      <iframe
        src={chartUrl}
        className="w-full h-full border-0"
        title={`${ticker} chart`}
      />
    </div>
  );
}

export default function ScreenerTable({
  title,
  data,
  defaultTimeframe = "intraday",
  sortDirection = "desc"
}: ScreenerTableProps) {
  const [timeframe, setTimeframe] = useState<"intraday" | "daily">(defaultTimeframe);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredTicker, setHoveredTicker] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sort data by change
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (sortDirection === "desc") {
        return b.change - a.change; // Highest change first (for LONG)
      } else {
        return a.change - b.change; // Lowest change first (for SHORT)
      }
    });
  }, [data, sortDirection]);

  // Format signal based on timeframe
  const formatSignal = (signal: string) => {
    if (timeframe === "daily") {
      // Remove timeframe suffix like " 1M", " 15M", " 1H", " 4H"
      return signal.replace(/\s+(1M|15M|1H|4H)$/, "");
    }
    return signal;
  };

  const handleMouseEnter = (ticker: string, event: React.MouseEvent) => {
    setHoveredTicker(ticker);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredTicker(null);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <div className="bg-[#131722] border border-[#2a2e39] rounded overflow-hidden w-full">
      {/* Table */}
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-[#787b86] text-xs border-b border-[#2a2e39]">
            <th className="text-left py-2 px-3 font-normal">Ticker</th>
            <th className="text-right py-2 px-3 font-normal">Last</th>
            <th className="text-right py-2 px-3 font-normal">Change</th>
            <th className="text-right py-2 px-3 font-normal">Volume</th>
            <th className="text-left py-2 px-3 font-normal">Signal</th>
            <th className="text-right py-2 px-2 font-normal">
              {/* Dropdown */}
              <div className="relative inline-block" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-0.5 text-[#2962ff] hover:text-[#5b8def] transition-colors text-xs"
                >
                  {timeframe === "intraday" ? "Intraday" : "Daily"}
                  <ChevronDown className="h-3 w-3" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-[#1e222d] border border-[#2a2e39] rounded shadow-lg z-10 min-w-[80px]">
                    <button
                      onClick={() => {
                        setTimeframe("intraday");
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#2a2e39] transition-colors ${
                        timeframe === "intraday" ? "text-[#2962ff]" : "text-[#d1d4dc]"
                      }`}
                    >
                      Intraday
                    </button>
                    <button
                      onClick={() => {
                        setTimeframe("daily");
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#2a2e39] transition-colors ${
                        timeframe === "daily" ? "text-[#2962ff]" : "text-[#d1d4dc]"
                      }`}
                    >
                      Daily
                    </button>
                  </div>
                )}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr
              key={`${row.ticker}-${index}`}
              className="border-b border-[#2a2e39]/50 hover:bg-[#1e222d] transition-colors"
            >
              {/* Ticker - Cyan color like Finviz */}
              <td className="py-1 px-3">
                <span
                  className="text-[#00bcd4] font-medium cursor-pointer hover:underline"
                  onMouseEnter={(e) => handleMouseEnter(row.ticker, e)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  {row.ticker}
                </span>
              </td>

              {/* Last Price */}
              <td className="py-1 px-3 text-right text-[#d1d4dc]">
                {row.last.toFixed(2)}
              </td>

              {/* Change */}
              <td className={`py-1 px-3 text-right ${
                row.change >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"
              }`}>
                {formatChange(row.change)}
              </td>

              {/* Volume */}
              <td className="py-1 px-3 text-right text-[#787b86]">
                {row.volume}
              </td>

              {/* Signal */}
              <td className="py-1 px-3 text-[#787b86] whitespace-nowrap">
                {formatSignal(row.signal)}
              </td>

              {/* Empty alignment cell */}
              <td className="py-1 px-2"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Chart Tooltip */}
      <ChartTooltip
        ticker={hoveredTicker || ""}
        isVisible={!!hoveredTicker}
        position={tooltipPosition}
      />
    </div>
  );
}
