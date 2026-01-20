import { create } from "zustand";
import { persist } from "zustand/middleware";
import { riskApi, dashboardApi, type RiskSettings, type PositionCalculation } from "./api";

// Variation matrix row for alternative stop levels
export interface VariationRow {
  stopPrice: number;
  distance: number;
  distancePercent: number;
  shares: number;
  riskAmount: number;
}

// History item for tracking calculations
export interface CalculationHistoryItem {
  id: string;
  timestamp: Date;
  ticker: string;
  side: "long" | "short";
  entryPrice: number;
  stopPrice: number;
  shares: number;
  riskAmount: number;
}

// Risk status for traffic light
export type RiskStatus = "GREEN" | "ORANGE" | "RED";

interface CalculatorState {
  // Inputs
  ticker: string;
  entryPrice: string;
  stopPrice: string;
  side: "long" | "short";

  // Results
  lastResult: PositionCalculation | null;
  variationMatrix: VariationRow[];
  riskStatus: RiskStatus;
  riskMessage: string;

  // Settings (cached from API)
  riskSettings: RiskSettings | null;
  todayPnL: number;

  // UI State
  isModalOpen: boolean;
  isCalculating: boolean;
  history: CalculationHistoryItem[];

  // Actions
  setTicker: (ticker: string) => void;
  setEntryPrice: (price: string) => void;
  setStopPrice: (price: string) => void;
  setSide: (side: "long" | "short") => void;
  calculate: (token: string) => Promise<void>;
  calculateLocal: () => void;
  copyToClipboard: () => void;
  openModal: () => void;
  closeModal: () => void;
  toggleModal: () => void;
  loadSettings: (token: string) => Promise<void>;
  loadTodayPnL: (token: string) => Promise<void>;
  clearInputs: () => void;
  generateVariationMatrix: (entryPrice: number, baseStop: number, riskAmount: number) => void;
}

// Calculate risk status based on result and settings
function calculateRiskStatus(
  result: PositionCalculation | null,
  settings: RiskSettings | null,
  todayPnL: number
): { status: RiskStatus; message: string } {
  if (!result || !settings) {
    return { status: "GREEN", message: "Ingresa datos para calcular" };
  }

  const remainingDailyRisk = settings.max_loss_daily - Math.abs(Math.min(todayPnL, 0));

  // RED: Would exceed daily loss limit
  if (result.risk_amount > remainingDailyRisk) {
    return {
      status: "RED",
      message: `Supera pérdida diaria máxima (Disponible: $${remainingDailyRisk.toFixed(0)})`,
    };
  }

  // ORANGE: Stop too far (>2% from entry)
  if (result.risk_percent > 2) {
    return {
      status: "ORANGE",
      message: `Stop a ${result.risk_percent.toFixed(1)}% - Riesgo elevado`,
    };
  }

  // ORANGE: Stop too close (<0.3% from entry) - execution risk
  const stopDistancePercent = (result.risk_per_share / result.entry_price) * 100;
  if (stopDistancePercent < 0.3) {
    return {
      status: "ORANGE",
      message: `Stop a ${stopDistancePercent.toFixed(2)}% - Riesgo de ejecución`,
    };
  }

  // ORANGE: Using more than 50% of remaining daily risk
  if (result.risk_amount > remainingDailyRisk * 0.5) {
    return {
      status: "ORANGE",
      message: `Usando ${((result.risk_amount / remainingDailyRisk) * 100).toFixed(0)}% del riesgo diario restante`,
    };
  }

  // GREEN: All good
  return { status: "GREEN", message: "Risk OK - Dentro de parámetros" };
}

// Generate variation matrix with alternative stop levels
function generateMatrix(
  entryPrice: number,
  baseStop: number,
  riskAmount: number,
  side: "long" | "short"
): VariationRow[] {
  const matrix: VariationRow[] = [];
  const baseDistance = Math.abs(entryPrice - baseStop);

  // Generate 5 variations: -20%, -10%, base, +10%, +20%
  const variations = [-0.2, -0.1, 0, 0.1, 0.2];

  for (const variation of variations) {
    const distance = baseDistance * (1 + variation);
    if (distance <= 0) continue;

    const stopPrice =
      side === "long" ? entryPrice - distance : entryPrice + distance;

    if (stopPrice <= 0) continue;

    const shares = Math.floor(riskAmount / distance);
    const distancePercent = (distance / entryPrice) * 100;

    matrix.push({
      stopPrice: Math.round(stopPrice * 100) / 100,
      distance: Math.round(distance * 100) / 100,
      distancePercent: Math.round(distancePercent * 100) / 100,
      shares,
      riskAmount: Math.round(shares * distance * 100) / 100,
    });
  }

  return matrix.sort((a, b) => a.distance - b.distance);
}

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    (set, get) => ({
      // Initial state
      ticker: "",
      entryPrice: "",
      stopPrice: "",
      side: "long",
      lastResult: null,
      variationMatrix: [],
      riskStatus: "GREEN",
      riskMessage: "Ingresa datos para calcular",
      riskSettings: null,
      todayPnL: 0,
      isModalOpen: false,
      isCalculating: false,
      history: [],

      // Setters
      setTicker: (ticker) => set({ ticker: ticker.toUpperCase() }),
      setEntryPrice: (price) => {
        set({ entryPrice: price });
        get().calculateLocal();
      },
      setStopPrice: (price) => {
        set({ stopPrice: price });
        get().calculateLocal();
      },
      setSide: (side) => {
        set({ side });
        get().calculateLocal();
      },

      // Local calculation (instant feedback without API)
      calculateLocal: () => {
        const { entryPrice, stopPrice, side, riskSettings, todayPnL } = get();
        const entry = parseFloat(entryPrice);
        const stop = parseFloat(stopPrice);

        if (isNaN(entry) || isNaN(stop) || entry <= 0 || stop <= 0) {
          set({
            lastResult: null,
            variationMatrix: [],
            riskStatus: "GREEN",
            riskMessage: "Ingresa datos para calcular",
          });
          return;
        }

        // Validate stop direction
        if (side === "long" && stop >= entry) {
          set({
            lastResult: null,
            variationMatrix: [],
            riskStatus: "RED",
            riskMessage: "Stop debe estar por debajo del Entry para LONG",
          });
          return;
        }

        if (side === "short" && stop <= entry) {
          set({
            lastResult: null,
            variationMatrix: [],
            riskStatus: "RED",
            riskMessage: "Stop debe estar por encima del Entry para SHORT",
          });
          return;
        }

        if (!riskSettings) {
          set({
            riskStatus: "ORANGE",
            riskMessage: "Cargando configuración...",
          });
          return;
        }

        // Calculate locally
        const riskPerShare = Math.abs(entry - stop);
        const riskAmount = riskSettings.account_balance * riskSettings.risk_per_trade_percent;
        let shares = Math.floor(riskAmount / riskPerShare);

        // Apply limits
        const maxSharesByPosition = Math.floor(riskSettings.max_position / entry);
        const maxSharesByOrder = Math.floor(riskSettings.max_order / entry);
        shares = Math.min(
          shares,
          riskSettings.max_shares_per_trade,
          maxSharesByPosition,
          maxSharesByOrder
        );

        const positionValue = shares * entry;
        const actualRisk = shares * riskPerShare;

        const result: PositionCalculation = {
          recommended_shares: shares,
          calculated_shares: Math.floor(riskAmount / riskPerShare),
          position_value: Math.round(positionValue * 100) / 100,
          risk_amount: Math.round(actualRisk * 100) / 100,
          risk_percent: Math.round((actualRisk / riskSettings.account_balance) * 10000) / 100,
          entry_price: entry,
          stop_price: stop,
          risk_per_share: Math.round(riskPerShare * 10000) / 10000,
          limits_applied: {
            max_shares_per_trade: riskSettings.max_shares_per_trade,
            max_position: riskSettings.max_position,
            max_order: riskSettings.max_order,
          },
        };

        const { status, message } = calculateRiskStatus(result, riskSettings, todayPnL);
        const matrix = generateMatrix(entry, stop, riskAmount, side);

        set({
          lastResult: result,
          variationMatrix: matrix,
          riskStatus: status,
          riskMessage: message,
        });
      },

      // Full calculation via API (with server-side validation)
      calculate: async (token) => {
        const { entryPrice, stopPrice, ticker, side, riskSettings, todayPnL } = get();
        const entry = parseFloat(entryPrice);
        const stop = parseFloat(stopPrice);

        if (isNaN(entry) || isNaN(stop)) {
          return;
        }

        set({ isCalculating: true });

        try {
          const result = await riskApi.calculate(token, entry, stop);

          const { status, message } = calculateRiskStatus(result, riskSettings, todayPnL);
          const riskAmount = riskSettings
            ? riskSettings.account_balance * riskSettings.risk_per_trade_percent
            : result.risk_amount;
          const matrix = generateMatrix(entry, stop, riskAmount, side);

          // Add to history
          const historyItem: CalculationHistoryItem = {
            id: Date.now().toString(),
            timestamp: new Date(),
            ticker: ticker || "???",
            side,
            entryPrice: entry,
            stopPrice: stop,
            shares: result.recommended_shares,
            riskAmount: result.risk_amount,
          };

          const newHistory = [historyItem, ...get().history].slice(0, 10);

          set({
            lastResult: result,
            variationMatrix: matrix,
            riskStatus: status,
            riskMessage: message,
            history: newHistory,
          });
        } catch (error) {
          console.error("Calculation failed:", error);
          set({
            riskStatus: "RED",
            riskMessage: "Error en el cálculo",
          });
        } finally {
          set({ isCalculating: false });
        }
      },

      // Copy shares to clipboard
      copyToClipboard: () => {
        const { lastResult } = get();
        if (lastResult) {
          navigator.clipboard.writeText(String(lastResult.recommended_shares));
        }
      },

      // Modal controls
      openModal: () => set({ isModalOpen: true }),
      closeModal: () => set({ isModalOpen: false }),
      toggleModal: () => set((state) => ({ isModalOpen: !state.isModalOpen })),

      // Load settings from API
      loadSettings: async (token) => {
        try {
          const settings = await riskApi.get(token);
          set({ riskSettings: settings });
          // Recalculate with new settings
          get().calculateLocal();
        } catch (error) {
          console.error("Failed to load risk settings:", error);
        }
      },

      // Load today's P&L for risk status calculation
      loadTodayPnL: async (token) => {
        try {
          const metrics = await dashboardApi.getMetrics(token);
          set({ todayPnL: metrics.today_pnl });
          // Recalculate with new P&L
          get().calculateLocal();
        } catch (error) {
          console.error("Failed to load today P&L:", error);
        }
      },

      // Clear inputs
      clearInputs: () =>
        set({
          ticker: "",
          entryPrice: "",
          stopPrice: "",
          lastResult: null,
          variationMatrix: [],
          riskStatus: "GREEN",
          riskMessage: "Ingresa datos para calcular",
        }),

      // Generate variation matrix
      generateVariationMatrix: (entryPrice, baseStop, riskAmount) => {
        const { side } = get();
        const matrix = generateMatrix(entryPrice, baseStop, riskAmount, side);
        set({ variationMatrix: matrix });
      },
    }),
    {
      name: "tsis-calculator",
      partialize: (state) => ({
        ticker: state.ticker,
        side: state.side,
        history: state.history,
      }),
    }
  )
);
