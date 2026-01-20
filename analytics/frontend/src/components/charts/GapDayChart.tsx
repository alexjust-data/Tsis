"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickData, Time, CandlestickSeries } from "lightweight-charts";
import type { IChartApi, ISeriesApi, CandlestickSeriesOptions } from "lightweight-charts";
import { fetchIntradayData, type IntradayCandle } from "@/lib/api";

interface GapDayChartProps {
  ticker: string;
  date: string | null;
  gapOpenPrice?: number;
  onNoData?: () => void; // Called when no intraday data available
}

export default function GapDayChart({ ticker, date, gapOpenPrice, onNoData }: GapDayChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick", Time, CandlestickData<Time>, CandlestickSeriesOptions> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "#131722" },
        textColor: "#d1d4dc",
      },
      grid: {
        vertLines: { color: "#2a2e39" },
        horzLines: { color: "#2a2e39" },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "#758696",
          width: 1,
          style: 2,
        },
        horzLine: {
          color: "#758696",
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: "#2a2e39",
      },
      timeScale: {
        borderColor: "#2a2e39",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Create candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    candleSeriesRef.current = candleSeries as ISeriesApi<"Candlestick", Time, CandlestickData<Time>, CandlestickSeriesOptions>;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Load data when date changes
  useEffect(() => {
    if (!date || !candleSeriesRef.current || !chartRef.current) return;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchIntradayData(ticker, date!);

        if (!data.candles || data.candles.length === 0) {
          setError("No intraday data available for this date");
          return;
        }

        // Convert candles to lightweight-charts format
        const chartData: CandlestickData<Time>[] = data.candles.map((candle: IntradayCandle) => {
          // Parse time string (format: "HH:MM:SS" or "HH:MM")
          const timeParts = candle.time.split(":");
          const hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);

          // Create timestamp for the specific date and time
          const dateObj = new Date(date!);
          dateObj.setHours(hours, minutes, 0, 0);

          return {
            time: Math.floor(dateObj.getTime() / 1000) as Time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          };
        });

        candleSeriesRef.current!.setData(chartData);

        // Add gap open price line if available
        if (gapOpenPrice && gapOpenPrice > 0) {
          candleSeriesRef.current!.createPriceLine({
            price: gapOpenPrice,
            color: "#f59e0b",
            lineWidth: 2,
            lineStyle: 0, // Solid
            axisLabelVisible: true,
            title: "Gap day open",
          });
        }

        // Add session background markers
        // Premarket: 4:00 AM - 9:30 AM (brown)
        // Market: 9:30 AM - 4:00 PM (normal)
        const dateObj = new Date(date!);

        // Premarket start (4:00 AM)
        const premarketStart = new Date(dateObj);
        premarketStart.setHours(4, 0, 0, 0);

        // Market open (9:30 AM)
        const marketOpen = new Date(dateObj);
        marketOpen.setHours(9, 30, 0, 0);

        // Market close (4:00 PM)
        const marketClose = new Date(dateObj);
        marketClose.setHours(16, 0, 0, 0);

        // Add time scale markers for sessions
        chartRef.current!.timeScale().setVisibleRange({
          from: Math.floor(premarketStart.getTime() / 1000) as Time,
          to: Math.floor(marketClose.getTime() / 1000) as Time,
        });

        // Fit content
        chartRef.current!.timeScale().fitContent();
      } catch (err) {
        console.error("Failed to load intraday data:", err);
        const errorMsg = err instanceof Error ? err.message : "Failed to load data";
        // Check if it's a 404 (no data) - trigger fallback to TradingView
        if (errorMsg.includes("404") || errorMsg.includes("No intraday data")) {
          setNoData(true);
          onNoData?.();
        } else if (errorMsg.includes("Failed to fetch")) {
          setError("Cannot connect to server. Is the backend running?");
        } else {
          setError(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [ticker, date, gapOpenPrice]);

  if (!date) {
    return (
      <div className="h-full flex items-center justify-center bg-[#131722] text-[#787b86]">
        <p className="text-sm">Select a gap from the list to view the chart</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative bg-[#131722]">
      {/* Session legend */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-4 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-[#3d2a1f] rounded-sm" />
          <span className="text-[#787b86]">Premarket</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-[#131722] border border-[#2a2e39] rounded-sm" />
          <span className="text-[#787b86]">Market</span>
        </div>
        {gapOpenPrice && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#f59e0b]" />
            <span className="text-[#787b86]">Gap open</span>
          </div>
        )}
      </div>

      {/* Date indicator */}
      <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-[#1e222d] border border-[#2a2e39] rounded text-xs text-[#d1d4dc]">
        {date}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#131722]/80 z-20">
          <div className="w-8 h-8 border-2 border-[#2962ff] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error message */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#131722] z-20">
          <p className="text-[#ef5350] text-sm">{error}</p>
        </div>
      )}

      {/* Chart container */}
      <div ref={chartContainerRef} className="h-full w-full" />
    </div>
  );
}
