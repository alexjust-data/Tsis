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
      className="fixed z-50 bg-[#131722] border border-[#363a45] rounded-lg shadow-2xl overflow-hidden"
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
      {/* Chart container - clips the TradingView toolbar */}
      <div className="overflow-hidden" style={{ height: "280px" }}>
        <iframe
          src={chartUrl}
          className="w-full border-0"
          style={{ height: "320px", marginTop: "-38px" }}
          title={`${ticker} chart`}
        />
      </div>
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
    <div className="inline-block">
      {/* Header row - OUTSIDE the box */}
      <div className="flex text-[#787b86] text-xs font-semibold mb-1">
        <div className="w-[60px] px-3 py-1">Ticker</div>
        <div className="w-[55px] px-3 py-1 text-right">Last</div>
        <div className="w-[70px] px-3 py-1 text-right">Change</div>
        <div className="w-[70px] px-3 py-1 text-right">Volume</div>
        <div className="w-[130px] px-3 py-1">Signal</div>
        <div className="w-[70px] px-2 py-1 text-right relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-0.5 text-[#787b86] hover:text-[#d1d4dc] transition-colors text-xs ml-auto"
          >
            {timeframe === "intraday" ? "Intraday" : "Daily"}
            <ChevronDown className="h-3 w-3" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-lg z-10 min-w-[80px]">
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
      </div>

      {/* Data rows - INSIDE the bordered box */}
      <div className="border border-[#2a2e39] rounded-lg overflow-hidden">
        <table className="text-[13px]">
          <tbody>
            {sortedData.map((row, index) => (
              <tr
                key={`${row.ticker}-${index}`}
                className="border-b border-[#2a2e39]/50 last:border-b-0 hover:bg-[#1e222d] transition-colors"
              >
                <td className="w-[60px] py-1 px-3">
                  <span
                    className="text-[#00bcd4] font-medium cursor-pointer hover:underline"
                    onMouseEnter={(e) => handleMouseEnter(row.ticker, e)}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    {row.ticker}
                  </span>
                </td>
                <td className="w-[55px] py-1 px-3 text-right text-[#d1d4dc]">
                  {row.last.toFixed(2)}
                </td>
                <td className={`w-[70px] py-1 px-3 text-right ${
                  row.change >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"
                }`}>
                  {formatChange(row.change)}
                </td>
                <td className="w-[70px] py-1 px-3 text-right text-[#787b86]">
                  {row.volume}
                </td>
                <td className="w-[130px] py-1 px-3 text-[#787b86] whitespace-nowrap">
                  {formatSignal(row.signal)}
                </td>
                <td className="w-[70px] py-1 px-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ChartTooltip
        ticker={hoveredTicker || ""}
        isVisible={!!hoveredTicker}
        position={tooltipPosition}
      />
    </div>
  );
}
