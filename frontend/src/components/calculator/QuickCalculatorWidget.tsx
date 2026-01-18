"use client";

import { useEffect, useState } from "react";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Copy,
  Check,
  Maximize2,
  AlertTriangle,
} from "lucide-react";
import { useCalculatorStore, type RiskStatus } from "@/lib/calculator";
import { useAuthStore } from "@/lib/auth";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function RiskBadge({ status, message }: { status: RiskStatus; message?: string }) {
  const config = {
    GREEN: { bg: "bg-[#00a449]", text: "RISK OK" },
    ORANGE: { bg: "bg-[#f59e0b]", text: "ALERT" },
    RED: { bg: "bg-[#d91e2b]", text: "STOP" },
  };

  const { bg, text } = config[status];

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded ${bg}/20 border border-current`}>
      <span className={`w-2 h-2 rounded-full ${bg}`} />
      <span className={`text-[12px] font-semibold ${bg.replace('bg-', 'text-')}`}>
        {message || text}
      </span>
    </div>
  );
}

export default function QuickCalculatorWidget() {
  const { token } = useAuthStore();
  const {
    ticker,
    entryPrice,
    stopPrice,
    side,
    lastResult,
    riskStatus,
    riskMessage,
    setTicker,
    setEntryPrice,
    setStopPrice,
    setSide,
    calculate,
    copyToClipboard,
    openModal,
    loadSettings,
    loadTodayPnL,
  } = useCalculatorStore();

  const [copied, setCopied] = useState(false);

  // Load settings on mount
  useEffect(() => {
    if (token) {
      loadSettings(token);
      loadTodayPnL(token);
    }
  }, [token, loadSettings, loadTodayPnL]);

  const handleCopy = () => {
    copyToClipboard();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCalculate = () => {
    if (token) {
      calculate(token);
    }
  };

  return (
    <div className="bg-[#14161d] rounded border border-[#2d3139] h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d3139]">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-[#f59e0b]" />
          <h3 className="text-[15px] font-bold text-white">NEXT TRADE</h3>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-[#707990] hover:text-white hover:bg-[#2d3139] rounded transition-colors"
          title="Expand calculator (F2)"
        >
          <span>F2</span>
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Input Form */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Row 1: Ticker & Side */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="block text-[11px] text-[#707990] mb-1.5 uppercase tracking-wide">Ticker</label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="NVDA"
              className="w-full h-10 px-3 bg-[#22262f] border border-[#2d3139] rounded text-white text-[14px] font-mono uppercase placeholder-[#707990] focus:outline-none focus:border-[#00a449]/50 transition-colors"
            />
          </div>
          <div className="w-28">
            <label className="block text-[11px] text-[#707990] mb-1.5 uppercase tracking-wide">Side</label>
            <div className="flex h-10 bg-[#22262f] border border-[#2d3139] rounded overflow-hidden">
              <button
                onClick={() => setSide("long")}
                className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
                  side === "long"
                    ? "bg-[#00a449] text-white"
                    : "text-[#707990] hover:text-white"
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                L
              </button>
              <button
                onClick={() => setSide("short")}
                className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
                  side === "short"
                    ? "bg-[#d91e2b] text-white"
                    : "text-[#707990] hover:text-white"
                }`}
              >
                <TrendingDown className="h-3.5 w-3.5" />
                S
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Entry & Stop */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-[11px] text-[#707990] mb-1.5 uppercase tracking-wide">Entry</label>
            <input
              type="number"
              step="0.01"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="0.00"
              className="w-full h-10 px-3 bg-[#22262f] border border-[#2d3139] rounded text-white text-[14px] font-mono placeholder-[#707990] focus:outline-none focus:border-[#00a449]/50 transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] text-[#707990] mb-1.5 uppercase tracking-wide">Stop</label>
            <input
              type="number"
              step="0.01"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              placeholder="0.00"
              className="w-full h-10 px-3 bg-[#22262f] border border-[#2d3139] rounded text-white text-[14px] font-mono placeholder-[#707990] focus:outline-none focus:border-[#00a449]/50 transition-colors"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#2d3139] mb-4" />

        {/* Result Section */}
        <div className="flex-1 flex flex-col justify-center">
          {lastResult ? (
            <>
              {/* Main Result */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded text-[11px] font-bold ${
                      side === "long"
                        ? "bg-[#00a449]/20 text-[#00a449]"
                        : "bg-[#d91e2b]/20 text-[#d91e2b]"
                    }`}
                  >
                    {side.toUpperCase()}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">
                      {lastResult.recommended_shares}
                    </span>
                    <span className="text-[13px] text-[#707990]">SHARES</span>
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-colors ${
                    copied
                      ? "bg-[#00a449] text-white"
                      : "bg-[#2d3139] text-white hover:bg-[#3d4149]"
                  }`}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              {/* Risk Info */}
              <div className="text-[13px] text-[#707990] mb-3">
                Risk: <span className="text-white font-semibold">{formatCurrency(lastResult.risk_amount)}</span>
                <span className="mx-1">·</span>
                <span className="text-white">{lastResult.risk_percent}%</span>
              </div>

              {/* Risk Status Badge */}
              <RiskBadge status={riskStatus} message={riskStatus === "GREEN" ? "RISK OK" : riskMessage} />
            </>
          ) : (
            <>
              {/* Placeholder when no result */}
              <div className="text-center py-4">
                <div className="text-[13px] text-[#707990] mb-1">Shares</div>
                <div className="text-3xl font-bold text-[#3d4149]">—</div>
                <div className="text-[12px] text-[#707990] mt-1">Risk: —</div>
              </div>

              {/* Risk Status Placeholder */}
              <div className="flex items-center gap-2 px-3 py-2 rounded bg-[#2d3139]/50 border border-[#2d3139]">
                <span className="w-2 h-2 rounded-full bg-[#707990]" />
                <span className="text-[12px] text-[#707990]">Enter values to calculate</span>
              </div>
            </>
          )}
        </div>

        {/* Expand Button */}
        <button
          onClick={openModal}
          className="mt-4 w-full py-2.5 bg-[#2d3139] hover:bg-[#3d4149] text-white text-[13px] font-medium rounded transition-colors flex items-center justify-center gap-2"
        >
          <Maximize2 className="h-4 w-4" />
          Expand Calculator
        </button>
      </div>
    </div>
  );
}
