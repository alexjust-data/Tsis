"use client";

import { useEffect, useRef, useState } from "react";
import { X, Copy, Check, Calculator, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useCalculatorStore, type RiskStatus } from "@/lib/calculator";
import { useAuthStore } from "@/lib/auth";
import VariationMatrix from "./VariationMatrix";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function RiskStatusBadge({ status, message }: { status: RiskStatus; message: string }) {
  const config = {
    GREEN: {
      bg: "bg-[#26a69a]/20",
      border: "border-[#26a69a]/50",
      text: "text-[#26a69a]",
      icon: Check,
    },
    ORANGE: {
      bg: "bg-[#f59e0b]/20",
      border: "border-[#f59e0b]/50",
      text: "text-[#f59e0b]",
      icon: AlertTriangle,
    },
    RED: {
      bg: "bg-[#ef5350]/20",
      border: "border-[#ef5350]/50",
      text: "text-[#ef5350]",
      icon: X,
    },
  };

  const { bg, border, text, icon: Icon } = config[status];

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded ${bg} border ${border}`}>
      <Icon className={`h-4 w-4 ${text}`} />
      <span className={`text-[13px] font-medium ${text}`}>{message}</span>
    </div>
  );
}

export default function CalculatorModal() {
  const { token } = useAuthStore();
  const {
    isModalOpen,
    closeModal,
    ticker,
    entryPrice,
    stopPrice,
    side,
    lastResult,
    variationMatrix,
    riskStatus,
    riskMessage,
    isCalculating,
    setTicker,
    setEntryPrice,
    setStopPrice,
    setSide,
    calculate,
    copyToClipboard,
    loadSettings,
    loadTodayPnL,
  } = useCalculatorStore();

  const tickerRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  // Load settings when modal opens
  useEffect(() => {
    if (isModalOpen && token) {
      loadSettings(token);
      loadTodayPnL(token);
      // Focus ticker input
      setTimeout(() => tickerRef.current?.focus(), 100);
    }
  }, [isModalOpen, token, loadSettings, loadTodayPnL]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        closeModal();
      }
      if (e.key === "Enter" && isModalOpen && token) {
        e.preventDefault();
        calculate(token);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, closeModal, calculate, token]);

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

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeModal}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-[#131722] border border-[#2a2e39] rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2e39]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#26a69a]/20 flex items-center justify-center">
              <Calculator className="h-5 w-5 text-[#26a69a]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Calculadora Rápida</h2>
              <p className="text-[12px] text-[#787b86]">F2 para abrir/cerrar | ESC para cerrar</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 text-[#787b86] hover:text-white hover:bg-[#2a2e39] rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Input Row */}
          <div className="grid grid-cols-4 gap-4">
            {/* Ticker */}
            <div>
              <label className="block text-[12px] text-[#787b86] mb-1.5">TICKER</label>
              <input
                ref={tickerRef}
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="NVDA"
                className="w-full h-10 px-3 bg-[#1e222d] border border-[#2a2e39] rounded text-white text-[14px] font-mono uppercase placeholder-[#787b86] focus:outline-none focus:border-[#26a69a]/50 transition-colors"
              />
            </div>

            {/* Entry Price */}
            <div>
              <label className="block text-[12px] text-[#787b86] mb-1.5">ENTRY</label>
              <input
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 px-3 bg-[#1e222d] border border-[#2a2e39] rounded text-white text-[14px] font-mono placeholder-[#787b86] focus:outline-none focus:border-[#26a69a]/50 transition-colors"
              />
            </div>

            {/* Stop Price */}
            <div>
              <label className="block text-[12px] text-[#787b86] mb-1.5">STOP</label>
              <input
                type="number"
                step="0.01"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 px-3 bg-[#1e222d] border border-[#2a2e39] rounded text-white text-[14px] font-mono placeholder-[#787b86] focus:outline-none focus:border-[#26a69a]/50 transition-colors"
              />
            </div>

            {/* Side Toggle */}
            <div>
              <label className="block text-[12px] text-[#787b86] mb-1.5">SIDE</label>
              <div className="flex h-10 bg-[#1e222d] border border-[#2a2e39] rounded overflow-hidden">
                <button
                  onClick={() => setSide("long")}
                  className={`flex-1 flex items-center justify-center gap-1 text-[13px] font-medium transition-colors ${
                    side === "long"
                      ? "bg-[#26a69a] text-white"
                      : "text-[#787b86] hover:text-white"
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  LONG
                </button>
                <button
                  onClick={() => setSide("short")}
                  className={`flex-1 flex items-center justify-center gap-1 text-[13px] font-medium transition-colors ${
                    side === "short"
                      ? "bg-[#ef5350] text-white"
                      : "text-[#787b86] hover:text-white"
                  }`}
                >
                  <TrendingDown className="h-3.5 w-3.5" />
                  SHORT
                </button>
              </div>
            </div>
          </div>

          {/* Result Box */}
          {lastResult && (
            <div className="bg-[#1e222d] border border-[#2a2e39] rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {/* Side Badge */}
                  <span
                    className={`px-3 py-1.5 rounded text-[13px] font-bold ${
                      side === "long"
                        ? "bg-[#26a69a]/20 text-[#26a69a]"
                        : "bg-[#ef5350]/20 text-[#ef5350]"
                    }`}
                  >
                    {side.toUpperCase()}
                  </span>

                  {/* Shares Result */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">
                      {lastResult.recommended_shares}
                    </span>
                    <span className="text-[#787b86] text-lg">SHARES</span>
                  </div>
                </div>

                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-4 py-2 rounded font-medium text-[13px] transition-colors ${
                    copied
                      ? "bg-[#26a69a] text-white"
                      : "bg-[#2a2e39] text-white hover:bg-[#363a45]"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar
                    </>
                  )}
                </button>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-[#2a2e39]">
                <div>
                  <p className="text-[11px] text-[#787b86] mb-1">Exposición</p>
                  <p className="text-[15px] font-semibold text-white">
                    {formatCurrency(lastResult.position_value)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#787b86] mb-1">Riesgo Total</p>
                  <p className="text-[15px] font-semibold text-white">
                    {formatCurrency(lastResult.risk_amount)}{" "}
                    <span className="text-[#787b86] text-[12px]">
                      ({lastResult.risk_percent}%)
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#787b86] mb-1">Risk/Share</p>
                  <p className="text-[15px] font-semibold text-white">
                    ${lastResult.risk_per_share.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#787b86] mb-1">Target 2:1</p>
                  <p className="text-[15px] font-semibold text-[#26a69a]">
                    {formatCurrency(lastResult.risk_amount * 2)}
                  </p>
                </div>
              </div>

              {/* Limit Warning */}
              {lastResult.recommended_shares < lastResult.calculated_shares && (
                <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded text-[12px] text-[#f59e0b]">
                  <AlertTriangle className="h-4 w-4" />
                  Límite aplicado: {lastResult.recommended_shares} de {lastResult.calculated_shares} shares calculados
                </div>
              )}
            </div>
          )}

          {/* Risk Status */}
          <RiskStatusBadge status={riskStatus} message={riskMessage} />

          {/* Variation Matrix */}
          {variationMatrix.length > 0 && (
            <VariationMatrix
              matrix={variationMatrix}
              currentStop={parseFloat(stopPrice)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#2a2e39]">
          <a
            href="/calculator"
            className="text-[13px] text-[#787b86] hover:text-[#26a69a] transition-colors"
          >
            Configuración avanzada
          </a>
          <button
            onClick={handleCalculate}
            disabled={isCalculating || !entryPrice || !stopPrice}
            className="px-6 py-2.5 bg-[#26a69a] hover:bg-[#26a69a]/90 disabled:bg-[#2a2e39] disabled:text-[#787b86] text-white font-medium text-[14px] rounded transition-colors"
          >
            {isCalculating ? "Calculando..." : "Calcular"}
          </button>
        </div>
      </div>
    </div>
  );
}
