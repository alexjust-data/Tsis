"use client";

import { useEffect, useRef } from "react";

interface TradingViewChartProps {
  symbol: string;
}

export default function TradingViewChart({ symbol }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = "";

    // Create TradingView widget
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof window !== "undefined" && (window as any).TradingView) {
        new (window as any).TradingView.widget({
          symbol: symbol,
          interval: "D",
          container_id: "tradingview_chart",
          width: "100%",
          height: "100%",
          timezone: "America/New_York",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#131722",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          hide_volume: false,
          studies: ["MASimple@tv-basicstudies"],
          backgroundColor: "#131722",
          gridColor: "#1e222d",
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol]);

  return (
    <div className="w-full h-full bg-[#131722]">
      <div
        id="tradingview_chart"
        ref={containerRef}
        className="w-full h-full"
      />
    </div>
  );
}
