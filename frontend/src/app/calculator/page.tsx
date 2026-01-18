"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { useCalculatorStore, type CalculationHistoryItem } from "@/lib/calculator";
import { riskApi, type RiskSettings } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import VariationMatrix from "@/components/calculator/VariationMatrix";
import {
  Calculator,
  Settings,
  Save,
  History,
  TrendingUp,
  TrendingDown,
  Check,
  Copy,
  AlertTriangle,
  DollarSign,
  Percent,
  Shield,
  Target,
} from "lucide-react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CalculatorPage() {
  const { token } = useAuthStore();
  const {
    ticker,
    entryPrice,
    stopPrice,
    side,
    lastResult,
    variationMatrix,
    riskStatus,
    riskMessage,
    history,
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

  const [settings, setSettings] = useState<RiskSettings | null>(null);
  const [editedSettings, setEditedSettings] = useState<Partial<RiskSettings>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load settings on mount
  useEffect(() => {
    if (token) {
      loadRiskSettings();
      loadSettings(token);
      loadTodayPnL(token);
    }
  }, [token, loadSettings, loadTodayPnL]);

  const loadRiskSettings = async () => {
    if (!token) return;
    try {
      const data = await riskApi.get(token);
      setSettings(data);
      setEditedSettings({});
    } catch (error) {
      console.error("Failed to load risk settings:", error);
    }
  };

  const handleSettingChange = (field: keyof RiskSettings, value: number) => {
    setEditedSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSettings = async () => {
    if (!token || Object.keys(editedSettings).length === 0) return;

    setIsSaving(true);
    try {
      const updated = await riskApi.update(token, editedSettings);
      setSettings(updated);
      setEditedSettings({});
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      // Reload calculator settings
      loadSettings(token);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCalculate = () => {
    if (token) {
      calculate(token);
    }
  };

  const handleCopy = () => {
    copyToClipboard();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSettingValue = (field: keyof RiskSettings): number => {
    if (editedSettings[field] !== undefined) {
      return editedSettings[field] as number;
    }
    return settings?.[field] as number ?? 0;
  };

  const hasChanges = Object.keys(editedSettings).length > 0;

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#00a449]/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-[#00a449]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Risk Management</h1>
              <p className="text-[13px] text-[#707990]">
                Configure your risk parameters and calculate position sizes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-[#707990]">
            <kbd className="px-2 py-1 bg-[#2d3139] rounded">F2</kbd>
            <span>Quick Calculator</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Settings */}
            <div className="bg-[#14161d] rounded border border-[#2d3139]">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2d3139]">
                <Settings className="h-5 w-5 text-[#707990]" />
                <h2 className="text-lg font-semibold text-white">Configuración de Cuenta</h2>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Balance */}
                <div>
                  <label className="flex items-center gap-2 text-[13px] text-[#707990] mb-2">
                    <DollarSign className="h-4 w-4" />
                    Balance de Cuenta
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707990]">$</span>
                    <input
                      type="number"
                      value={getSettingValue("account_balance")}
                      onChange={(e) =>
                        handleSettingChange("account_balance", parseFloat(e.target.value) || 0)
                      }
                      className="w-full h-10 pl-8 pr-4 bg-[#22262f] border border-[#2d3139] rounded text-white text-[14px] font-mono focus:outline-none focus:border-[#00a449]/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Max Daily Loss */}
                <div>
                  <label className="flex items-center gap-2 text-[13px] text-[#707990] mb-2">
                    <Shield className="h-4 w-4" />
                    Pérdida Diaria Máxima
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707990]">$</span>
                      <input
                        type="number"
                        value={getSettingValue("max_loss_daily")}
                        onChange={(e) =>
                          handleSettingChange("max_loss_daily", parseFloat(e.target.value) || 0)
                        }
                        className="w-full h-10 pl-8 pr-4 bg-[#22262f] border border-[#2d3139] rounded text-white text-[14px] font-mono focus:outline-none focus:border-[#00a449]/50 transition-colors"
                      />
                    </div>
                    <div className="relative w-24">
                      <input
                        type="number"
                        step="0.01"
                        value={(getSettingValue("max_loss_daily_percent") * 100).toFixed(1)}
                        onChange={(e) =>
                          handleSettingChange(
                            "max_loss_daily_percent",
                            (parseFloat(e.target.value) || 0) / 100
                          )
                        }
                        className="w-full h-10 pl-3 pr-8 bg-[#22262f] border border-[#2d3139] rounded text-white text-[14px] font-mono focus:outline-none focus:border-[#00a449]/50 transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707990]">%</span>
                    </div>
                  </div>
                </div>

                {/* Risk Per Trade */}
                <div>
                  <label className="flex items-center gap-2 text-[13px] text-[#707990] mb-2">
                    <Target className="h-4 w-4" />
                    Riesgo por Trade
                  </label>
                  <div className="flex gap-2">
                    <div className="relative w-24">
                      <input
                        type="number"
                        step="0.01"
                        value={(getSettingValue("risk_per_trade_percent") * 100).toFixed(2)}
                        onChange={(e) =>
                          handleSettingChange(
                            "risk_per_trade_percent",
                            (parseFloat(e.target.value) || 0) / 100
                          )
                        }
                        className="w-full h-10 pl-3 pr-8 bg-[#22262f] border border-[#2d3139] rounded text-white text-[14px] font-mono focus:outline-none focus:border-[#00a449]/50 transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707990]">%</span>
                    </div>
                    <div className="flex-1 flex items-center px-3 bg-[#22262f] border border-[#2d3139] rounded text-[14px] text-[#707990]">
                      = {formatCurrency(getSettingValue("account_balance") * getSettingValue("risk_per_trade_percent"))}
                    </div>
                  </div>
                </div>

                {/* Max Trades Per Day */}
                <div>
                  <label className="flex items-center gap-2 text-[13px] text-[#707990] mb-2">
                    <Percent className="h-4 w-4" />
                    Trades por Día
                  </label>
                  <input
                    type="number"
                    value={getSettingValue("max_trades_per_day")}
                    onChange={(e) =>
                      handleSettingChange("max_trades_per_day", parseInt(e.target.value) || 0)
                    }
                    className="w-full h-10 px-4 bg-[#22262f] border border-[#2d3139] rounded text-white text-[14px] font-mono focus:outline-none focus:border-[#00a449]/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Position Limits */}
            <div className="bg-[#14161d] rounded border border-[#2d3139]">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2d3139]">
                <Shield className="h-5 w-5 text-[#707990]" />
                <h2 className="text-lg font-semibold text-white">Límites de Posición</h2>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Max Shares Per Trade */}
                <div>
                  <label className="text-[13px] text-[#707990] mb-2 block">
                    Max Shares/Trade
                  </label>
                  <input
                    type="number"
                    value={getSettingValue("max_shares_per_trade")}
                    onChange={(e) =>
                      handleSettingChange("max_shares_per_trade", parseInt(e.target.value) || 0)
                    }
                    className="w-full h-10 px-4 bg-[#22262f] border border-[#2d3139] rounded text-white text-[14px] font-mono focus:outline-none focus:border-[#00a449]/50 transition-colors"
                  />
                </div>

                {/* Max Position */}
                <div>
                  <label className="text-[13px] text-[#707990] mb-2 block">
                    Max Posición
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707990]">$</span>
                    <input
                      type="number"
                      value={getSettingValue("max_position")}
                      onChange={(e) =>
                        handleSettingChange("max_position", parseFloat(e.target.value) || 0)
                      }
                      className="w-full h-10 pl-8 pr-4 bg-[#22262f] border border-[#2d3139] rounded text-white text-[14px] font-mono focus:outline-none focus:border-[#00a449]/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Max Order */}
                <div>
                  <label className="text-[13px] text-[#707990] mb-2 block">
                    Max Order
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707990]">$</span>
                    <input
                      type="number"
                      value={getSettingValue("max_order")}
                      onChange={(e) =>
                        handleSettingChange("max_order", parseFloat(e.target.value) || 0)
                      }
                      className="w-full h-10 pl-8 pr-4 bg-[#22262f] border border-[#2d3139] rounded text-white text-[14px] font-mono focus:outline-none focus:border-[#00a449]/50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="px-5 py-4 border-t border-[#2d3139] flex items-center justify-between">
                <div className="text-[12px] text-[#707990]">
                  {hasChanges ? (
                    <span className="text-[#f59e0b]">Tienes cambios sin guardar</span>
                  ) : saveSuccess ? (
                    <span className="text-[#00a449] flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" />
                      Configuración guardada
                    </span>
                  ) : (
                    "Los cambios se aplican inmediatamente al calcular"
                  )}
                </div>
                <button
                  onClick={handleSaveSettings}
                  disabled={!hasChanges || isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00a449] hover:bg-[#00a449]/90 disabled:bg-[#2d3139] disabled:text-[#707990] text-white text-[13px] font-medium rounded transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Guardando..." : "Guardar Configuración"}
                </button>
              </div>
            </div>

            {/* Calculator Test */}
            <div className="bg-[#14161d] rounded border border-[#2d3139]">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2d3139]">
                <Calculator className="h-5 w-5 text-[#707990]" />
                <h2 className="text-lg font-semibold text-white">Calculadora de Prueba</h2>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {/* Ticker */}
                  <div>
                    <label className="text-[12px] text-[#707990] mb-1.5 block">TICKER</label>
                    <input
                      type="text"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value)}
                      placeholder="NVDA"
                      className="w-full h-10 px-3 bg-[#22262f] border border-[#2d3139] rounded text-white text-[14px] font-mono uppercase placeholder-[#707990] focus:outline-none focus:border-[#00a449]/50 transition-colors"
                    />
                  </div>

                  {/* Entry */}
                  <div>
                    <label className="text-[12px] text-[#707990] mb-1.5 block">ENTRY</label>
                    <input
                      type="number"
                      step="0.01"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-10 px-3 bg-[#22262f] border border-[#2d3139] rounded text-white text-[14px] font-mono placeholder-[#707990] focus:outline-none focus:border-[#00a449]/50 transition-colors"
                    />
                  </div>

                  {/* Stop */}
                  <div>
                    <label className="text-[12px] text-[#707990] mb-1.5 block">STOP</label>
                    <input
                      type="number"
                      step="0.01"
                      value={stopPrice}
                      onChange={(e) => setStopPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-10 px-3 bg-[#22262f] border border-[#2d3139] rounded text-white text-[14px] font-mono placeholder-[#707990] focus:outline-none focus:border-[#00a449]/50 transition-colors"
                    />
                  </div>

                  {/* Side */}
                  <div>
                    <label className="text-[12px] text-[#707990] mb-1.5 block">SIDE</label>
                    <div className="flex h-10 bg-[#22262f] border border-[#2d3139] rounded overflow-hidden">
                      <button
                        onClick={() => setSide("long")}
                        className={`flex-1 flex items-center justify-center gap-1 text-[13px] font-medium transition-colors ${
                          side === "long"
                            ? "bg-[#00a449] text-white"
                            : "text-[#707990] hover:text-white"
                        }`}
                      >
                        <TrendingUp className="h-4 w-4" />
                        LONG
                      </button>
                      <button
                        onClick={() => setSide("short")}
                        className={`flex-1 flex items-center justify-center gap-1 text-[13px] font-medium transition-colors ${
                          side === "short"
                            ? "bg-[#d91e2b] text-white"
                            : "text-[#707990] hover:text-white"
                        }`}
                      >
                        <TrendingDown className="h-4 w-4" />
                        SHORT
                      </button>
                    </div>
                  </div>
                </div>

                {/* Result */}
                {lastResult && (
                  <div className="bg-[#22262f] rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 rounded text-[12px] font-bold ${
                            side === "long"
                              ? "bg-[#00a449]/20 text-[#00a449]"
                              : "bg-[#d91e2b]/20 text-[#d91e2b]"
                          }`}
                        >
                          {side.toUpperCase()}
                        </span>
                        <span className="text-3xl font-bold text-white">
                          {lastResult.recommended_shares}
                        </span>
                        <span className="text-[#707990]">SHARES</span>
                      </div>
                      <button
                        onClick={handleCopy}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-[12px] font-medium transition-colors ${
                          copied
                            ? "bg-[#00a449] text-white"
                            : "bg-[#2d3139] text-white hover:bg-[#3d4149]"
                        }`}
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copiado" : "Copiar"}
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-[13px]">
                      <div>
                        <span className="text-[#707990]">Exposición</span>
                        <p className="font-semibold text-white">{formatCurrency(lastResult.position_value)}</p>
                      </div>
                      <div>
                        <span className="text-[#707990]">Riesgo</span>
                        <p className="font-semibold text-white">
                          {formatCurrency(lastResult.risk_amount)} ({lastResult.risk_percent}%)
                        </p>
                      </div>
                      <div>
                        <span className="text-[#707990]">Risk/Share</span>
                        <p className="font-semibold text-white">${lastResult.risk_per_share.toFixed(4)}</p>
                      </div>
                      <div>
                        <span className="text-[#707990]">Target 2:1</span>
                        <p className="font-semibold text-[#00a449]">{formatCurrency(lastResult.risk_amount * 2)}</p>
                      </div>
                    </div>

                    {/* Risk Status */}
                    <div
                      className={`mt-3 flex items-center gap-2 px-3 py-2 rounded text-[12px] ${
                        riskStatus === "GREEN"
                          ? "bg-[#00a449]/10 text-[#00a449]"
                          : riskStatus === "ORANGE"
                          ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                          : "bg-[#d91e2b]/10 text-[#d91e2b]"
                      }`}
                    >
                      {riskStatus === "GREEN" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      {riskMessage}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCalculate}
                  disabled={isCalculating || !entryPrice || !stopPrice}
                  className="w-full py-2.5 bg-[#00a449] hover:bg-[#00a449]/90 disabled:bg-[#2d3139] disabled:text-[#707990] text-white font-medium rounded transition-colors"
                >
                  {isCalculating ? "Calculando..." : "Calcular"}
                </button>

                {/* Variation Matrix */}
                {variationMatrix.length > 0 && (
                  <div className="mt-4">
                    <VariationMatrix
                      matrix={variationMatrix}
                      currentStop={parseFloat(stopPrice)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - History */}
          <div className="space-y-6">
            <div className="bg-[#14161d] rounded border border-[#2d3139]">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2d3139]">
                <History className="h-5 w-5 text-[#707990]" />
                <h2 className="text-lg font-semibold text-white">Historial</h2>
              </div>

              <div className="p-4">
                {history.length === 0 ? (
                  <p className="text-center text-[#707990] text-[13px] py-8">
                    No hay cálculos recientes
                  </p>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2.5 px-3 bg-[#22262f] rounded"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-[#707990]">
                            {formatTime(item.timestamp)}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.side === "long"
                                ? "bg-[#00a449]/20 text-[#00a449]"
                                : "bg-[#d91e2b]/20 text-[#d91e2b]"
                            }`}
                          >
                            {item.side.charAt(0).toUpperCase()}
                          </span>
                          <span className="font-mono text-white text-[13px]">
                            {item.ticker || "---"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-white text-[13px]">
                            {item.shares}
                          </span>
                          <span className="text-[11px] text-[#707990] ml-1">sh</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-[#14161d] rounded border border-[#2d3139] p-5">
              <h3 className="text-[14px] font-semibold text-white mb-3">Fórmula</h3>
              <div className="bg-[#22262f] rounded p-3 font-mono text-[12px] text-[#a0a8b8]">
                <p>Shares = Risk$ / |Entry - Stop|</p>
                <p className="mt-2 text-[#707990]">
                  Risk$ = Balance × Risk%
                </p>
              </div>

              <h3 className="text-[14px] font-semibold text-white mt-4 mb-3">Atajos</h3>
              <div className="space-y-2 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#707990]">Calculadora rápida</span>
                  <kbd className="px-2 py-0.5 bg-[#2d3139] rounded text-white">F2</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#707990]">Cerrar modal</span>
                  <kbd className="px-2 py-0.5 bg-[#2d3139] rounded text-white">ESC</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#707990]">Calcular</span>
                  <kbd className="px-2 py-0.5 bg-[#2d3139] rounded text-white">Enter</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
