"use client";

import { useState, useRef } from "react";
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
}

// Chart tooltip component
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

  // TradingView widget URL for mini chart
  const chartUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${ticker}&interval=D&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=0&showpopupbutton=0&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&showpopupbutton=0&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart`;

  return (
    <div
      className="fixed z-50 bg-[#1a1d24] border border-[#2d3139] rounded-lg shadow-2xl overflow-hidden"
      style={{
        left: position.x + 20,
        top: position.y - 100,
        width: 400,
        height: 250,
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#2d3139] flex items-center justify-between">
        <span className="text-[#00a449] font-bold text-sm">{ticker}</span>
        <span className="text-[#707990] text-xs">Daily Chart</span>
      </div>

      {/* TradingView Chart */}
      <iframe
        src={chartUrl}
        className="w-full h-[210px] border-0"
        title={`${ticker} chart`}
      />
    </div>
  );
}

export default function ScreenerTable({ title, data, defaultTimeframe = "intraday" }: ScreenerTableProps) {
  const [timeframe, setTimeframe] = useState<"intraday" | "daily">(defaultTimeframe);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredTicker, setHoveredTicker] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <div className="bg-[#141619] border border-[#1e2128] rounded overflow-hidden">
      {/* Table Header */}
      <div className="px-3 py-2 border-b border-[#1e2128] flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">{title}</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#707990] text-xs border-b border-[#1e2128]">
              <th className="text-left py-2 px-3 font-medium">Ticker</th>
              <th className="text-right py-2 px-3 font-medium">Last</th>
              <th className="text-right py-2 px-3 font-medium">Change</th>
              <th className="text-right py-2 px-3 font-medium">Volume</th>
              <th className="text-left py-2 px-3 font-medium">Signal</th>
              <th className="text-right py-2 px-3 font-medium relative">
                {/* Dropdown */}
                <div className="relative inline-block" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1 text-[#707990] hover:text-white transition-colors"
                  >
                    {timeframe === "intraday" ? "Intraday" : "Daily"}
                    <ChevronDown className="h-3 w-3" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-[#1a1d24] border border-[#2d3139] rounded shadow-lg z-10 min-w-[100px]">
                      <button
                        onClick={() => {
                          setTimeframe("intraday");
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-[#2d3139] transition-colors ${
                          timeframe === "intraday" ? "text-[#00a449]" : "text-white"
                        }`}
                      >
                        Intraday
                      </button>
                      <button
                        onClick={() => {
                          setTimeframe("daily");
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-[#2d3139] transition-colors ${
                          timeframe === "daily" ? "text-[#00a449]" : "text-white"
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
            {data.map((row, index) => (
              <tr
                key={`${row.ticker}-${index}`}
                className="border-b border-[#1e2128]/50 hover:bg-[#1a1d24] transition-colors"
              >
                {/* Ticker with hover tooltip */}
                <td className="py-1.5 px-3">
                  <span
                    className="text-[#00a449] font-medium cursor-pointer hover:underline"
                    onMouseEnter={(e) => handleMouseEnter(row.ticker, e)}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    {row.ticker}
                  </span>
                </td>

                {/* Last Price */}
                <td className="py-1.5 px-3 text-right text-white font-mono">
                  {row.last.toFixed(2)}
                </td>

                {/* Change */}
                <td className={`py-1.5 px-3 text-right font-mono ${
                  row.change >= 0 ? "text-[#00a449]" : "text-[#d91e2b]"
                }`}>
                  {formatChange(row.change)}
                </td>

                {/* Volume */}
                <td className="py-1.5 px-3 text-right text-[#707990] font-mono">
                  {row.volume}
                </td>

                {/* Signal */}
                <td className="py-1.5 px-3 text-[#707990]">
                  {row.signal}
                </td>

                {/* Empty cell for alignment with dropdown header */}
                <td className="py-1.5 px-3"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chart Tooltip */}
      <ChartTooltip
        ticker={hoveredTicker || ""}
        isVisible={!!hoveredTicker}
        position={tooltipPosition}
      />
    </div>
  );
}
