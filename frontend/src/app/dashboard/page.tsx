"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import { dashboardApi, tradesApi, type DashboardMetrics, type Trade, type TickerStats } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Percent,
  DollarSign,
  BarChart3,
  Calendar,
  Upload,
  LogOut,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
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
  return `${value.toFixed(2)}%`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { token, user, logout, fetchUser } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [tickers, setTickers] = useState<TickerStats[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    fetchUser();
    loadData();
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
      setRecentTrades(tradesData.slice(0, 10));
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold text-white">TSIS.ai</span>
          </div>

          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link href="/trades">
              <Button variant="ghost" size="sm">
                Trades
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant="ghost" size="sm">
                Calendar
              </Button>
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              {user?.name || user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : metrics ? (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    Total P&L
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${metrics.total_pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatCurrency(metrics.total_pnl)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {metrics.total_trades} trades
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    Win Rate
                  </CardTitle>
                  <Target className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {formatPercent(metrics.win_rate)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {metrics.winning_trades}W / {metrics.losing_trades}L
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    Profit Factor
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${metrics.profit_factor >= 1 ? "text-green-500" : "text-red-500"}`}>
                    {metrics.profit_factor.toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Avg Win: {formatCurrency(metrics.avg_win)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    Today
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${metrics.today_pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatCurrency(metrics.today_pnl)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Week: {formatCurrency(metrics.week_pnl)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Second Row - Long/Short Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5 text-green-500" />
                    Long Trades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">P&L</p>
                      <p className={`text-lg font-bold ${metrics.long_pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {formatCurrency(metrics.long_pnl)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Trades</p>
                      <p className="text-lg font-bold text-white">{metrics.long_trades}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Win Rate</p>
                      <p className="text-lg font-bold text-white">{formatPercent(metrics.long_win_rate)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowDownRight className="h-5 w-5 text-red-500" />
                    Short Trades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">P&L</p>
                      <p className={`text-lg font-bold ${metrics.short_pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {formatCurrency(metrics.short_pnl)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Trades</p>
                      <p className="text-lg font-bold text-white">{metrics.short_trades}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Win Rate</p>
                      <p className="text-lg font-bold text-white">{formatPercent(metrics.short_win_rate)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Third Row - Top Tickers & Recent Trades */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle>Top Tickers</CardTitle>
                  <CardDescription>By total P&L</CardDescription>
                </CardHeader>
                <CardContent>
                  {tickers.length === 0 ? (
                    <p className="text-slate-400 text-sm">No trades yet</p>
                  ) : (
                    <div className="space-y-3">
                      {tickers.map((ticker) => (
                        <div key={ticker.ticker} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-white">{ticker.ticker}</span>
                            <span className="text-xs text-slate-400">{ticker.trades} trades</span>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${ticker.total_pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                              {formatCurrency(ticker.total_pnl)}
                            </p>
                            <p className="text-xs text-slate-400">{formatPercent(ticker.win_rate)} WR</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Trades</CardTitle>
                    <CardDescription>Last 10 trades</CardDescription>
                  </div>
                  <Link href="/trades">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentTrades.length === 0 ? (
                    <div className="text-center py-8">
                      <Upload className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 mb-4">No trades yet</p>
                      <Link href="/trades">
                        <Button>Import Trades</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentTrades.map((trade) => (
                        <div key={trade.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              trade.side === "long" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                            }`}>
                              {trade.side.toUpperCase()}
                            </span>
                            <span className="font-mono font-bold text-white">{trade.ticker}</span>
                            <span className="text-xs text-slate-400">{trade.shares} shares</span>
                          </div>
                          <span className={`font-bold ${trade.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {formatCurrency(trade.pnl)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Best Trade</p>
                    <p className="text-xl font-bold text-green-500">{formatCurrency(metrics.best_trade)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Worst Trade</p>
                    <p className="text-xl font-bold text-red-500">{formatCurrency(metrics.worst_trade)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Best Day</p>
                    <p className="text-xl font-bold text-green-500">{formatCurrency(metrics.best_day)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Worst Day</p>
                    <p className="text-xl font-bold text-red-500">{formatCurrency(metrics.worst_day)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Streaks */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Streaks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-8">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Current Streak</p>
                    <p className={`text-3xl font-bold ${metrics.current_streak >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {metrics.current_streak >= 0 ? `${metrics.current_streak}W` : `${Math.abs(metrics.current_streak)}L`}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Max Win Streak</p>
                    <p className="text-3xl font-bold text-green-500">{metrics.max_win_streak}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Max Loss Streak</p>
                    <p className="text-3xl font-bold text-red-500">{metrics.max_loss_streak}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-16">
            <Upload className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Trading Data</h2>
            <p className="text-slate-400 mb-6">Import your trades to start tracking your performance</p>
            <Link href="/trades">
              <Button size="lg">
                <Upload className="mr-2 h-4 w-4" />
                Import Trades
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
