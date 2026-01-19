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
  sortDirection?: "desc" | "asc";
}

// Chart tooltip - Finviz style with candlestick chart
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

  // TradingView advanced chart - candlestick style like Finviz
  const chartUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tv_chart&symbol=${ticker}&interval=D&hidelegend=1&hidetoptoolbar=1&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=131722&studies=MASimple%409%2CMASimple%4020&theme=dark&style=1&timezone=America%2FNew_York&withdateranges=0&showpopupbutton=0&locale=en&utm_source=&utm_medium=widget&utm_campaign=chart&utm_term=${ticker}`;

  return (
    <div
      className="fixed z-50 bg-[#131722] border border-[#363a45] rounded shadow-2xl overflow-hidden"
      style={{
        left: position.x + 20,
        top: position.y - 180,
        width: 550,
        height: 320,
      }}
    >
      {/* Header like Finviz */}
      <div className="bg-[#1e222d] px-4 py-2 flex items-center justify-between border-b border-[#363a45]">
        <span className="text-white font-bold text-xl">{ticker}</span>
        <span className="text-[#787b86] text-sm">Daily</span>
      </div>
      <iframe
        src={chartUrl}
        className="w-full border-0"
        style={{ height: "280px" }}
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
        return b.change - a.change;
      } else {
        return a.change - b.change;
      }
    });
  }, [data, sortDirection]);

  // Format signal based on timeframe
  const formatSignal = (signal: string) => {
    if (timeframe === "daily") {
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
    <div className="bg-[#131722] border border-[#2a2e39] rounded overflow-hidden inline-block">
      {/* Table - NO w-full, compact */}
      <table className="text-[13px]">
        <thead>
          <tr className="text-[#787b86] text-xs border-b border-[#2a2e39]">
            <th className="text-left py-2 px-3 font-normal">Ticker</th>
            <th className="text-right py-2 px-3 font-normal">Last</th>
            <th className="text-right py-2 px-3 font-normal">Change</th>
            <th className="text-right py-2 px-3 font-normal">Volume</th>
            <th className="text-left py-2 px-3 font-normal">Signal</th>
            <th className="text-right py-2 px-2 font-normal">
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
              <td className="py-1 px-3 text-right text-[#d1d4dc]">
                {row.last.toFixed(2)}
              </td>
              <td className={`py-1 px-3 text-right ${
                row.change >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"
              }`}>
                {formatChange(row.change)}
              </td>
              <td className="py-1 px-3 text-right text-[#787b86]">
                {row.volume}
              </td>
              <td className="py-1 px-3 text-[#787b86] whitespace-nowrap">
                {formatSignal(row.signal)}
              </td>
              <td className="py-1 px-2"></td>
            </tr>
          ))}
        </tbody>
      </table>

      <ChartTooltip
        ticker={hoveredTicker || ""}
        isVisible={!!hoveredTicker}
        position={tooltipPosition}
      />
    </div>
  );
}
