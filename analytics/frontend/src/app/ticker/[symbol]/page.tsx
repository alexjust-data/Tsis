"use client";

import { use, useState, useCallback, useEffect, useRef } from "react";
import Sidebar from "@/components/layout/Sidebar";
import GapStatistics from "@/components/gaps/GapStatistics";
import GapHistory from "@/components/gaps/GapHistory";
import TickerInfo from "@/components/ticker/TickerInfo";
import { X, Star } from "lucide-react";

interface TickerPageProps {
  params: Promise<{ symbol: string }>;
}

export default function TickerPage({ params }: TickerPageProps) {
  const { symbol } = use(params);
  const [tabs, setTabs] = useState([{ symbol: symbol.toUpperCase(), active: true }]);
  const [viewMode, setViewMode] = useState<"overview" | "sec">("overview");

  // Resizable panel state
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // TradingView widget URL
  const chartUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${symbol.toUpperCase()}&interval=D&hidelegend=0&hidetoptoolbar=0&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=131722&studies=MASimple%409%2CMASimple%4020&theme=dark&style=1&timezone=America%2FNew_York&withdateranges=1&showpopupbutton=0&locale=en`;

  const removeTab = (index: number) => {
    if (tabs.length > 1) {
      const newTabs = tabs.filter((_, i) => i !== index);
      if (tabs[index].active && newTabs.length > 0) {
        newTabs[0].active = true;
      }
      setTabs(newTabs);
    }
  };

  // Handle mouse move for resizing
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = containerRect.right - e.clientX;

    // Constrain between 200px and 600px
    const constrainedWidth = Math.min(Math.max(newWidth, 200), 600);
    setRightPanelWidth(constrainedWidth);
  }, [isResizing]);

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Add/remove event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Start resizing
  const startResizing = () => {
    setIsResizing(true);
  };

  return (
    <div className="h-screen flex bg-[#0d1117] overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0" ref={containerRef}>
        {/* Top banner */}
        <div className="h-8 bg-[#1e222d] flex items-center justify-between px-4 text-xs border-b border-[#2a2e39]">
          <div className="flex items-center gap-2 text-[#f59e0b]">
            <span>You&apos;re on the Free Plan - Upgrade to unlock elite features</span>
          </div>
          <button className="flex items-center gap-1 px-3 py-1 bg-[#f59e0b]/20 text-[#f59e0b] rounded hover:bg-[#f59e0b]/30 transition-colors">
            <Star className="h-3 w-3" />
            Upgrade
          </button>
        </div>

        {/* Ticker tabs */}
        <div className="h-10 bg-[#131722] flex items-center border-b border-[#2a2e39]">
          {tabs.map((tab, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 px-4 h-full border-r border-[#2a2e39] ${
                tab.active ? "bg-[#1e222d]" : "hover:bg-[#1e222d]/50"
              }`}
            >
              <span className="text-sm font-medium text-[#d1d4dc]">{tab.symbol}</span>
              <span className="text-xs text-[#787b86] truncate max-w-[80px]">Security...</span>
              <button
                onClick={() => removeTab(index)}
                className="p-0.5 text-[#787b86] hover:text-[#ef5350] rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Search box in header */}
          <div className="ml-auto mr-4 flex items-center gap-2">
            <span className="text-sm text-[#787b86]">{symbol.toUpperCase()}</span>
            <span className="text-xs text-[#4c5263]">SMX (Security Matters) Publ...</span>
          </div>
        </div>

        {/* View mode tabs */}
        <div className="h-9 bg-[#131722] flex items-center px-4 gap-2 border-b border-[#2a2e39]">
          <button
            onClick={() => setViewMode("overview")}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === "overview"
                ? "bg-[#2962ff] text-white"
                : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode("sec")}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === "sec"
                ? "bg-[#2962ff] text-white"
                : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
            }`}
          >
            SEC Filings
          </button>
        </div>

        {/* Main grid: Chart + Stats */}
        <div className="flex-1 flex min-h-0">
          {/* Chart area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* TradingView Chart */}
            <div className="flex-1 bg-[#131722]">
              <iframe
                src={chartUrl}
                className="w-full h-full border-0"
                title={`${symbol} chart`}
                style={{ pointerEvents: isResizing ? 'none' : 'auto' }}
              />
            </div>

            {/* Bottom panel: Ticker Info + Gap History */}
            <div className="h-[280px] flex border-t border-[#2a2e39]">
              {/* Ticker Info */}
              <div className="w-[400px] border-r border-[#2a2e39]">
                <TickerInfo
                  symbol={symbol.toUpperCase()}
                  companyName="Loading..."
                  price={0}
                  change={0}
                  changePercent={0}
                />
              </div>

              {/* Gap History */}
              <div className="flex-1">
                <GapHistory ticker={symbol.toUpperCase()} />
              </div>
            </div>
          </div>

          {/* Resize handle */}
          <div
            className={`w-1 cursor-col-resize transition-colors ${
              isResizing ? 'bg-[#2962ff]' : 'bg-[#2a2e39] hover:bg-[#2962ff]'
            }`}
            onMouseDown={startResizing}
          />

          {/* Right panel: Gap Statistics */}
          <div
            className="border-l border-[#2a2e39] flex-shrink-0"
            style={{ width: rightPanelWidth }}
          >
            <GapStatistics ticker={symbol.toUpperCase()} />
          </div>
        </div>
      </div>
    </div>
  );
}
