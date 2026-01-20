"use client";

import { use, useState, useCallback, useEffect, useRef } from "react";
import Sidebar from "@/components/layout/Sidebar";
import GapStatistics from "@/components/gaps/GapStatistics";
import GapHistory from "@/components/gaps/GapHistory";
import TickerInfo from "@/components/ticker/TickerInfo";
import GapDayChart from "@/components/charts/GapDayChart";
import { X, Star } from "lucide-react";

interface TickerPageProps {
  params: Promise<{ symbol: string }>;
}

export default function TickerPage({ params }: TickerPageProps) {
  const { symbol } = use(params);
  const [tabs, setTabs] = useState([{ symbol: symbol.toUpperCase(), active: true }]);
  const [viewMode, setViewMode] = useState<"overview" | "sec">("overview");

  // Resizable panel state (horizontal - right panel)
  const [rightPanelWidth, setRightPanelWidth] = useState(380);
  const [isResizingRight, setIsResizingRight] = useState(false);

  // Resizable panel state (horizontal - bottom left panel / Ticker Info)
  const [tickerInfoWidth, setTickerInfoWidth] = useState(400);
  const [isResizingBottom, setIsResizingBottom] = useState(false);

  // Selected gap date and price for chart navigation
  const [selectedGapDate, setSelectedGapDate] = useState<string | null>(null);
  const [selectedGapOpenPrice, setSelectedGapOpenPrice] = useState<number>(0);
  const [useIntradayChart, setUseIntradayChart] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // TradingView widget URL - with date range if gap selected
  const getTradingViewUrl = useCallback(() => {
    const baseUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${symbol.toUpperCase()}&interval=D&hidelegend=0&hidetoptoolbar=0&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=131722&studies=MASimple%409%2CMASimple%4020&theme=dark&style=1&timezone=America%2FNew_York&withdateranges=1&showpopupbutton=0&locale=en`;

    if (selectedGapDate) {
      // Center chart on the gap date (30 days before, 10 days after)
      const gapDate = new Date(selectedGapDate);
      const fromDate = new Date(gapDate);
      fromDate.setDate(fromDate.getDate() - 30);
      const toDate = new Date(gapDate);
      toDate.setDate(toDate.getDate() + 10);

      const fromTimestamp = Math.floor(fromDate.getTime() / 1000);
      const toTimestamp = Math.floor(toDate.getTime() / 1000);

      return `${baseUrl}&range=${fromTimestamp}%3A${toTimestamp}`;
    }

    return baseUrl;
  }, [symbol, selectedGapDate]);

  const tradingViewUrl = getTradingViewUrl();

  // Handle gap click from GapHistory
  const handleGapClick = useCallback((date: string, openPrice: number) => {
    setSelectedGapDate(date);
    setSelectedGapOpenPrice(openPrice);
    setUseIntradayChart(true); // Try intraday chart first
  }, []);

  // Fallback to TradingView when no intraday data
  const handleNoIntradayData = useCallback(() => {
    setUseIntradayChart(false);
  }, []);

  // Clear gap selection to go back to daily chart
  const clearGapSelection = useCallback(() => {
    setSelectedGapDate(null);
    setSelectedGapOpenPrice(0);
    setUseIntradayChart(true);
  }, []);

  const removeTab = (index: number) => {
    if (tabs.length > 1) {
      const newTabs = tabs.filter((_, i) => i !== index);
      if (tabs[index].active && newTabs.length > 0) {
        newTabs[0].active = true;
      }
      setTabs(newTabs);
    }
  };

  // Handle mouse move for right panel resizing
  const handleMouseMoveRight = useCallback((e: MouseEvent) => {
    if (!isResizingRight || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = containerRect.right - e.clientX;

    // Constrain between 280px and 600px
    const constrainedWidth = Math.min(Math.max(newWidth, 280), 600);
    setRightPanelWidth(constrainedWidth);
  }, [isResizingRight]);

  // Handle mouse move for bottom panel resizing
  const handleMouseMoveBottom = useCallback((e: MouseEvent) => {
    if (!isResizingBottom || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left - 56; // 56px is sidebar width

    // Constrain between 250px and 600px
    const constrainedWidth = Math.min(Math.max(newWidth, 250), 600);
    setTickerInfoWidth(constrainedWidth);
  }, [isResizingBottom]);

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizingRight(false);
    setIsResizingBottom(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Add/remove event listeners for right panel
  useEffect(() => {
    if (isResizingRight) {
      document.addEventListener('mousemove', handleMouseMoveRight);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveRight);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingRight, handleMouseMoveRight, handleMouseUp]);

  // Add/remove event listeners for bottom panel
  useEffect(() => {
    if (isResizingBottom) {
      document.addEventListener('mousemove', handleMouseMoveBottom);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveBottom);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingBottom, handleMouseMoveBottom, handleMouseUp]);

  // Start resizing right panel
  const startResizingRight = () => {
    setIsResizingRight(true);
  };

  // Start resizing bottom panel
  const startResizingBottom = () => {
    setIsResizingBottom(true);
  };

  const isResizing = isResizingRight || isResizingBottom;

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

          {/* Ticker name in header */}
          <div className="ml-auto mr-4 flex items-center gap-2">
            <span className="text-sm text-[#787b86]">{symbol.toUpperCase()}</span>
            <span className="text-xs text-[#4c5263]">Loading...</span>
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

        {/* Main content area - Two rows */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top row: Chart + Gap Statistics */}
          <div className="flex-1 flex min-h-0">
            {/* Chart area */}
            <div className="flex-1 bg-[#131722] min-w-0 relative">
              {selectedGapDate ? (
                <>
                  {/* Back to daily chart button */}
                  <button
                    onClick={clearGapSelection}
                    className="absolute top-2 left-2 z-20 px-2 py-1 bg-[#2a2e39] hover:bg-[#363a45] text-[#d1d4dc] text-xs rounded transition-colors"
                  >
                    ← Back to daily
                  </button>

                  {/* Show selected date indicator */}
                  <div className="absolute top-2 right-2 z-20 px-2 py-1 bg-[#1e222d] border border-[#2a2e39] rounded text-xs text-[#d1d4dc]">
                    Gap: {selectedGapDate}
                    {!useIntradayChart && <span className="text-[#787b86] ml-2">(Daily view)</span>}
                  </div>

                  {useIntradayChart ? (
                    /* Custom intraday chart with gap markers */
                    <GapDayChart
                      ticker={symbol.toUpperCase()}
                      date={selectedGapDate}
                      gapOpenPrice={selectedGapOpenPrice}
                      onNoData={handleNoIntradayData}
                    />
                  ) : (
                    /* Fallback message for old dates without intraday data */
                    <div className="h-full flex flex-col items-center justify-center bg-[#131722] text-center p-8">
                      <div className="text-[#787b86] mb-4">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-lg font-medium text-[#d1d4dc] mb-2">No chart data available</p>
                        <p className="text-sm">
                          Intraday data is not available for <span className="text-[#f59e0b]">{symbol.toUpperCase()}</span> on <span className="text-[#f59e0b]">{selectedGapDate}</span>
                        </p>
                        <p className="text-xs mt-2 text-[#4c5263]">
                          Historical intraday data is typically available for dates from 2019 onwards
                        </p>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={clearGapSelection}
                          className="px-4 py-2 bg-[#2962ff] hover:bg-[#2962ff]/80 text-white text-sm rounded transition-colors"
                        >
                          View current chart
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <iframe
                  src={tradingViewUrl}
                  className="w-full h-full border-0"
                  title={`${symbol} chart`}
                  style={{ pointerEvents: isResizing ? 'none' : 'auto' }}
                />
              )}
            </div>

            {/* Resize handle */}
            <div
              className={`w-1 cursor-col-resize transition-colors flex-shrink-0 ${
                isResizingRight ? 'bg-[#2962ff]' : 'bg-[#2a2e39] hover:bg-[#2962ff]'
              }`}
              onMouseDown={startResizingRight}
            />

            {/* Right panel: Gap Statistics */}
            <div
              className="flex-shrink-0 border-l border-[#2a2e39]"
              style={{ width: rightPanelWidth }}
            >
              <GapStatistics ticker={symbol.toUpperCase()} />
            </div>
          </div>

          {/* Bottom row: Ticker Info + Gap History */}
          <div className="h-[280px] flex border-t border-[#2a2e39]">
            {/* Ticker Info - Left side */}
            <div
              className="border-r border-[#2a2e39] flex-shrink-0"
              style={{ width: tickerInfoWidth }}
            >
              <TickerInfo
                symbol={symbol.toUpperCase()}
                companyName="Loading..."
                price={0}
                change={0}
                changePercent={0}
              />
            </div>

            {/* Resize handle for bottom row */}
            <div
              className={`w-1 cursor-col-resize transition-colors flex-shrink-0 ${
                isResizingBottom ? 'bg-[#2962ff]' : 'bg-[#2a2e39] hover:bg-[#2962ff]'
              }`}
              onMouseDown={startResizingBottom}
            />

            {/* Gap History - Spans remaining width */}
            <div className="flex-1 min-w-0">
              <GapHistory ticker={symbol.toUpperCase()} onGapClick={handleGapClick} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
