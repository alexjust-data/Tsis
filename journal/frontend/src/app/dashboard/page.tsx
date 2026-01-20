"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { dashboardApi, tradesApi, type DashboardMetrics, type Trade, type TickerStats } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import QuickCalculatorWidget from "@/components/calculator/QuickCalculatorWidget";
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  BarChart3,
  Calendar,
  Upload,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from "lucide-react";
import Link from "next/link";

function formatCurrency(value: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Math.abs(value));

  return value < 0 ? `-${formatted}` : formatted;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Stat Card Component - TradingView Style
function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  valueColor = "white",
}: {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  valueColor?: "white" | "profit" | "loss";
}) {
  const colorClass = {
    white: "text-white",
    profit: "text-[#26a69a]",
    loss: "text-[#ef5350]",
  };

  return (
    <div className="bg-[#131722] rounded-lg p-4 border border-[#2a2e39]">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[13px] text-[#787b86]">{title}</span>
        <Icon className="h-4 w-4 text-[#787b86]" />
      </div>
      <div className={`text-2xl font-bold ${colorClass[valueColor]}`}>
        {value}
      </div>
      {subValue && (
        <p className="text-[12px] text-[#787b86] mt-1">{subValue}</p>
      )}
    </div>
  );
}

// Mini Stat Component - TradingView Style
function MiniStat({ label, value, color }: { label: string; value: string; color: "profit" | "loss" | "white" }) {
  const colorClass = {
    profit: "text-[#26a69a]",
    loss: "text-[#ef5350]",
    white: "text-white",
  };

  return (
    <div className="text-center">
      <p className="text-[12px] text-[#787b86] mb-1">{label}</p>
      <p className={`text-lg font-bold ${colorClass[color]}`}>{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { token } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [tickers, setTickers] = useState<TickerStats[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const [metricsData, tickersData, tradesData] = await Promise.all([
        dashboardApi.getMetrics(token),
        dashboardApi.getTickers(token, 5),
        tradesApi.getAll(token),
      ]);

      setMetrics(metricsData);
      setTickers(tickersData);
      setRecentTrades(tradesData.slice(0, 8));
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-[13px] text-[#787b86] mt-1">Your trading performance overview</p>
          </div>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#131722] border border-[#2a2e39] rounded text-[#787b86] hover:text-white hover:border-[#787b86] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-[#26a69a]" />
          </div>
        ) : metrics ? (
          <div className="space-y-6">
            {/* Calculator Widget + Summary Stats - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Calculator Widget - Left Side */}
              <div>
                <QuickCalculatorWidget />
              </div>

              {/* Summary Stats - Right Side 2x2 Grid */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  title="Total P&L"
                  value={formatCurrency(metrics.total_pnl)}
                  subValue={`${metrics.total_trades} trades`}
                  icon={DollarSign}
                  valueColor={metrics.total_pnl >= 0 ? "profit" : "loss"}
                />
                <StatCard
                  title="Win Rate"
                  value={formatPercent(metrics.win_rate)}
                  subValue={`${metrics.winning_trades}W / ${metrics.losing_trades}L`}
                  icon={Target}
                  valueColor={metrics.win_rate >= 50 ? "profit" : "loss"}
                />
                <StatCard
                  title="Profit Factor"
                  value={metrics.profit_factor.toFixed(2)}
                  subValue={`Avg Win: ${formatCurrency(metrics.avg_win)}`}
                  icon={BarChart3}
                  valueColor={metrics.profit_factor >= 1 ? "profit" : "loss"}
                />
                <StatCard
                  title="Today"
                  value={formatCurrency(metrics.today_pnl)}
                  subValue={`Week: ${formatCurrency(metrics.week_pnl)}`}
                  icon={Calendar}
                  valueColor={metrics.today_pnl >= 0 ? "profit" : "loss"}
                />
              </div>
            </div>

            {/* Long/Short Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#131722] rounded-lg border border-[#2a2e39] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowUpRight className="h-5 w-5 text-[#26a69a]" />
                  <h3 className="text-lg font-semibold text-white">Long Trades</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <MiniStat
                    label="P&L"
                    value={formatCurrency(metrics.long_pnl)}
                    color={metrics.long_pnl >= 0 ? "profit" : "loss"}
                  />
                  <MiniStat
                    label="Trades"
                    value={String(metrics.long_trades)}
                    color="white"
                  />
                  <MiniStat
                    label="Win Rate"
                    value={formatPercent(metrics.long_win_rate)}
                    color={metrics.long_win_rate >= 50 ? "profit" : "loss"}
                  />
                </div>
              </div>

              <div className="bg-[#131722] rounded-lg border border-[#2a2e39] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowDownRight className="h-5 w-5 text-[#ef5350]" />
                  <h3 className="text-lg font-semibold text-white">Short Trades</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <MiniStat
                    label="P&L"
                    value={formatCurrency(metrics.short_pnl)}
                    color={metrics.short_pnl >= 0 ? "profit" : "loss"}
                  />
                  <MiniStat
                    label="Trades"
                    value={String(metrics.short_trades)}
                    color="white"
                  />
                  <MiniStat
                    label="Win Rate"
                    value={formatPercent(metrics.short_win_rate)}
                    color={metrics.short_win_rate >= 50 ? "profit" : "loss"}
                  />
                </div>
              </div>
            </div>

            {/* Tickers & Recent Trades */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Tickers */}
              <div className="bg-[#131722] rounded-lg border border-[#2a2e39]">
                <div className="p-4 border-b border-[#2a2e39]">
                  <h3 className="text-lg font-semibold text-white">Top Tickers</h3>
                  <p className="text-[12px] text-[#787b86]">By total P&L</p>
                </div>
                <div className="p-4">
                  {tickers.length === 0 ? (
                    <p className="text-[#787b86] text-[14px] text-center py-4">No trades yet</p>
                  ) : (
                    <div className="space-y-3">
                      {tickers.map((ticker, index) => (
                        <div key={ticker.ticker} className="flex items-center justify-between py-2 border-b border-[#2a2e39] last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 flex items-center justify-center text-[12px] font-medium text-[#787b86] bg-[#1e222d] rounded">
                              {index + 1}
                            </span>
                            <div>
                              <span className="font-mono font-bold text-white">{ticker.ticker}</span>
                              <span className="text-[12px] text-[#787b86] ml-2">{ticker.trades} trades</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${ticker.total_pnl >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                              {formatCurrency(ticker.total_pnl)}
                            </p>
                            <p className="text-[12px] text-[#787b86]">{formatPercent(ticker.win_rate)} WR</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Trades */}
              <div className="bg-[#131722] rounded-lg border border-[#2a2e39]">
                <div className="p-4 border-b border-[#2a2e39] flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Recent Trades</h3>
                    <p className="text-[12px] text-[#787b86]">Last 8 trades</p>
                  </div>
                  <Link
                    href="/trades"
                    className="text-[14px] text-[#2962ff] hover:text-[#2962ff]/80 transition-colors"
                  >
                    View All
                  </Link>
                </div>
                <div className="p-4">
                  {recentTrades.length === 0 ? (
                    <div className="text-center py-8">
                      <Upload className="h-10 w-10 text-[#787b86] mx-auto mb-3" />
                      <p className="text-[#787b86] mb-3 text-[14px]">No trades yet</p>
                      <Link
                        href="/trades"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#2962ff] hover:bg-[#2962ff]/90 text-white text-[14px] rounded transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        Import Trades
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentTrades.map((trade) => (
                        <div key={trade.id} className="flex items-center justify-between py-2 border-b border-[#2a2e39] last:border-0">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${
                              trade.side === "long"
                                ? "bg-[#26a69a]/15 text-[#26a69a]"
                                : "bg-[#ef5350]/15 text-[#ef5350]"
                            }`}>
                              {trade.side.toUpperCase()}
                            </span>
                            <span className="font-mono font-bold text-white">{trade.ticker}</span>
                            <span className="text-[12px] text-[#787b86]">{trade.shares} shares</span>
                          </div>
                          <span className={`font-bold ${trade.pnl >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                            {formatCurrency(trade.pnl)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Extremes & Streaks */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#131722] rounded-lg border border-[#2a2e39] p-4 text-center">
                <p className="text-[12px] text-[#787b86] mb-2">Best Trade</p>
                <p className="text-xl font-bold text-[#26a69a]">{formatCurrency(metrics.best_trade)}</p>
              </div>
              <div className="bg-[#131722] rounded-lg border border-[#2a2e39] p-4 text-center">
                <p className="text-[12px] text-[#787b86] mb-2">Worst Trade</p>
                <p className="text-xl font-bold text-[#ef5350]">{formatCurrency(metrics.worst_trade)}</p>
              </div>
              <div className="bg-[#131722] rounded-lg border border-[#2a2e39] p-4 text-center">
                <p className="text-[12px] text-[#787b86] mb-2">Best Day</p>
                <p className="text-xl font-bold text-[#26a69a]">{formatCurrency(metrics.best_day)}</p>
              </div>
              <div className="bg-[#131722] rounded-lg border border-[#2a2e39] p-4 text-center">
                <p className="text-[12px] text-[#787b86] mb-2">Worst Day</p>
                <p className="text-xl font-bold text-[#ef5350]">{formatCurrency(metrics.worst_day)}</p>
              </div>
            </div>

            {/* Streaks */}
            <div className="bg-[#131722] rounded-lg border border-[#2a2e39] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-[#2962ff]" />
                <h3 className="text-lg font-semibold text-white">Streaks</h3>
              </div>
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <p className="text-[12px] text-[#787b86] mb-2">Current Streak</p>
                  <p className={`text-3xl font-bold ${metrics.current_streak >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                    {metrics.current_streak >= 0 ? `${metrics.current_streak}W` : `${Math.abs(metrics.current_streak)}L`}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[12px] text-[#787b86] mb-2">Max Win Streak</p>
                  <p className="text-3xl font-bold text-[#26a69a]">{metrics.max_win_streak}</p>
                </div>
                <div className="text-center">
                  <p className="text-[12px] text-[#787b86] mb-2">Max Loss Streak</p>
                  <p className="text-3xl font-bold text-[#ef5350]">{metrics.max_loss_streak}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-[#131722] rounded-lg border border-[#2a2e39]">
            <Upload className="h-16 w-16 text-[#787b86] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Trading Data</h2>
            <p className="text-[#787b86] mb-6">Import your trades to start tracking your performance</p>
            <Link
              href="/trades"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2962ff] hover:bg-[#2962ff]/90 text-white rounded transition-colors"
            >
              <Upload className="h-5 w-5" />
              Import Trades
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
