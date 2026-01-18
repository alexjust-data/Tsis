"use client";

import { useEffect, useState } from "react";
import {
  Calculator,
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

function RiskBadge({ status }: { status: RiskStatus }) {
  const config = {
    GREEN: { bg: "bg-[#00a449]", text: "RISK OK" },
    ORANGE: { bg: "bg-[#f59e0b]", text: "ALERTA" },
    RED: { bg: "bg-[#d91e2b]", text: "STOP" },
  };

  const { bg, text } = config[status];

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${bg}`}>
      {text}
    </span>
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
    <div className="bg-[#14161d] rounded border border-[#2d3139] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d3139]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#00a449]/20 flex items-center justify-center">
            <Calculator className="h-4 w-4 text-[#00a449]" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-white">Próximo Trade</h3>
            <p className="text-[10px] text-[#707990]">F2 para expandir</p>
          </div>
        </div>
        <button
          onClick={openModal}
          className="p-1.5 text-[#707990] hover:text-white hover:bg-[#2d3139] rounded transition-colors"
          title="Expandir calculadora (F2)"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Input Form */}
      <div className="p-4 space-y-3">
        {/* Ticker & Side */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[10px] text-[#707990] mb-1">TICKER</label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="NVDA"
              className="w-full h-8 px-2 bg-[#22262f] border border-[#2d3139] rounded text-white text-[13px] font-mono uppercase placeholder-[#707990] focus:outline-none focus:border-[#00a449]/50 transition-colors"
            />
          </div>
          <div className="w-24">
            <label className="block text-[10px] text-[#707990] mb-1">SIDE</label>
            <div className="flex h-8 bg-[#22262f] border border-[#2d3139] rounded overflow-hidden">
              <button
                onClick={() => setSide("long")}
                className={`flex-1 flex items-center justify-center text-[10px] font-medium transition-colors ${
                  side === "long"
                    ? "bg-[#00a449] text-white"
                    : "text-[#707990] hover:text-white"
                }`}
              >
                <TrendingUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => setSide("short")}
                className={`flex-1 flex items-center justify-center text-[10px] font-medium transition-colors ${
                  side === "short"
                    ? "bg-[#d91e2b] text-white"
                    : "text-[#707990] hover:text-white"
                }`}
              >
                <TrendingDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Entry & Stop */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[10px] text-[#707990] mb-1">ENTRY</label>
            <input
              type="number"
              step="0.01"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="0.00"
              className="w-full h-8 px-2 bg-[#22262f] border border-[#2d3139] rounded text-white text-[13px] font-mono placeholder-[#707990] focus:outline-none focus:border-[#00a449]/50 transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] text-[#707990] mb-1">STOP</label>
            <input
              type="number"
              step="0.01"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              placeholder="0.00"
              className="w-full h-8 px-2 bg-[#22262f] border border-[#2d3139] rounded text-white text-[13px] font-mono placeholder-[#707990] focus:outline-none focus:border-[#00a449]/50 transition-colors"
            />
          </div>
        </div>

        {/* Result */}
        {lastResult && (
          <div className="pt-3 border-t border-[#2d3139]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    side === "long"
                      ? "bg-[#00a449]/20 text-[#00a449]"
                      : "bg-[#d91e2b]/20 text-[#d91e2b]"
                  }`}
                >
                  {side.toUpperCase()}
                </span>
                <span className="text-2xl font-bold text-white">
                  {lastResult.recommended_shares}
                </span>
                <span className="text-[12px] text-[#707990]">shares</span>
              </div>
              <button
                onClick={handleCopy}
                className={`p-1.5 rounded transition-colors ${
                  copied
                    ? "bg-[#00a449] text-white"
                    : "bg-[#2d3139] text-[#707990] hover:text-white"
                }`}
                title="Copiar shares"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#707990]">
                Risk: {formatCurrency(lastResult.risk_amount)} ({lastResult.risk_percent}%)
              </span>
              <RiskBadge status={riskStatus} />
            </div>

            {/* Risk message if not green */}
            {riskStatus !== "GREEN" && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#f59e0b]">
                <AlertTriangle className="h-3 w-3" />
                {riskMessage}
              </div>
            )}
          </div>
        )}

        {/* Calculate Button (only if no result yet or inputs changed) */}
        {!lastResult && (
          <button
            onClick={handleCalculate}
            disabled={!entryPrice || !stopPrice}
            className="w-full py-2 bg-[#00a449] hover:bg-[#00a449]/90 disabled:bg-[#2d3139] disabled:text-[#707990] text-white text-[12px] font-medium rounded transition-colors"
          >
            Calcular
          </button>
        )}
      </div>
    </div>
  );
}
