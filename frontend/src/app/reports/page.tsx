"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@/lib/auth";
import { dashboardApi, tradesApi, type Trade, type TickerStats, type TimingStats, type DashboardMetrics } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import { RefreshCw, BarChart3, TrendingUp, PieChart, Clock, Filter, Download, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import Link from "next/link";

// Finviz colors
const COLORS = {
  profit: "#00a449",
  loss: "#d91e2b",
  blue: "#2f91ef",
  muted: "#707990",
  bg: "#14161d",
  bgLight: "#22262f",
  border: "#2d3139",
  text: "#ffffff",
};

function formatCurrency(value: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value));
  return value < 0 ? `-${formatted}` : formatted;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#22262f] border border-[#2d3139] rounded p-3 shadow-lg">
        <p className="text-[12px] text-[#707990] mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-[14px] font-bold" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

type TabType = "overview" | "detailed" | "winloss" | "compare";

export default function ReportsPage() {
  const { token } = useAuthStore();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [tickers, setTickers] = useState<TickerStats[]>([]);
  const [timing, setTiming] = useState<TimingStats[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Filters
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    side: "all" as "all" | "long" | "short",
    duration: "all" as "all" | "intraday" | "multiday",
    plType: "gross" as "gross" | "net",
  });

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  // Apply filters to trades
  useEffect(() => {
    let filtered = [...trades];

    if (filters.startDate) {
      filtered = filtered.filter(t => t.date >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(t => t.date <= filters.endDate);
    }
    if (filters.side !== "all") {
      filtered = filtered.filter(t => t.side === filters.side);
    }
    // Duration filter would require entry/exit time comparison
    // For now, we'll skip it as it needs more backend support

    setFilteredTrades(filtered);
  }, [trades, filters]);

  const loadData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [tradesData, tickersData, timingData, metricsData] = await Promise.all([
        tradesApi.getAll(token),
        dashboardApi.getTickers(token, 10),
        dashboardApi.getTiming(token),
        dashboardApi.getMetrics(token),
      ]);
      setTrades(tradesData);
      setFilteredTrades(tradesData);
      setTickers(tickersData);
      setTiming(timingData);
      setMetrics(metricsData);
    } catch (error) {
      console.error("Failed to load reports data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats from filtered trades
  const filteredStats = useMemo(() => {
    const total = filteredTrades.length;
    const winners = filteredTrades.filter(t => t.pnl > 0).length;
    const losers = filteredTrades.filter(t => t.pnl <= 0).length;
    const totalPnl = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossProfit = filteredTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = filteredTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0);
    const avgWin = winners > 0 ? grossProfit / winners : 0;
    const avgLoss = losers > 0 ? Math.abs(grossLoss) / losers : 0;
    const profitFactor = grossLoss !== 0 ? grossProfit / Math.abs(grossLoss) : 0;
    const winRate = total > 0 ? (winners / total) * 100 : 0;

    return {
      total,
      winners,
      losers,
      totalPnl,
      grossProfit,
      grossLoss,
      avgWin,
      avgLoss,
      profitFactor,
      winRate,
    };
  }, [filteredTrades]);

  // Calculate cumulative P&L over time
  const cumulativePnL = useMemo(() => {
    if (!filteredTrades.length) return [];

    const sortedTrades = [...filteredTrades].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let cumulative = 0;
    const dailyPnL: Record<string, number> = {};

    sortedTrades.forEach(trade => {
      const dateKey = trade.date.split('T')[0];
      dailyPnL[dateKey] = (dailyPnL[dateKey] || 0) + trade.pnl;
    });

    const result: { date: string; pnl: number; cumulative: number }[] = [];
    Object.entries(dailyPnL)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, pnl]) => {
        cumulative += pnl;
        result.push({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          pnl,
          cumulative,
        });
      });

    return result;
  }, [filteredTrades]);

  // Daily P&L for bar chart
  const dailyPnLData = useMemo(() => {
    return cumulativePnL.slice(-30).map(d => ({
      ...d,
      fill: d.pnl >= 0 ? COLORS.profit : COLORS.loss,
    }));
  }, [cumulativePnL]);

  // Win/Loss pie data
  const winLossData = useMemo(() => {
    return [
      { name: 'Winners', value: filteredStats.winners, color: COLORS.profit },
      { name: 'Losers', value: filteredStats.losers, color: COLORS.loss },
    ];
  }, [filteredStats]);

  // P&L by day of week
  const dayOfWeekData = useMemo(() => {
    if (!filteredTrades.length) return [];

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayStats: Record<number, { pnl: number; trades: number }> = {};

    filteredTrades.forEach(trade => {
      const day = new Date(trade.date).getDay();
      if (!dayStats[day]) dayStats[day] = { pnl: 0, trades: 0 };
      dayStats[day].pnl += trade.pnl;
      dayStats[day].trades += 1;
    });

    return days.map((name, index) => ({
      name,
      pnl: dayStats[index]?.pnl || 0,
      trades: dayStats[index]?.trades || 0,
      fill: (dayStats[index]?.pnl || 0) >= 0 ? COLORS.profit : COLORS.loss,
    }));
  }, [filteredTrades]);

  // Timing data formatted
  const timingData = useMemo(() => {
    return timing.map(t => ({
      hour: `${t.hour}:00`,
      pnl: t.total_pnl,
      trades: t.trades,
      fill: t.total_pnl >= 0 ? COLORS.profit : COLORS.loss,
    }));
  }, [timing]);

  // Ticker data formatted
  const tickerData = useMemo(() => {
    return tickers.slice(0, 8).map(t => ({
      ticker: t.ticker,
      pnl: t.total_pnl,
      trades: t.trades,
      fill: t.total_pnl >= 0 ? COLORS.profit : COLORS.loss,
    }));
  }, [tickers]);

  // Win vs Loss days analysis
  const winLossDays = useMemo(() => {
    const dailyMap = new Map<string, number>();
    filteredTrades.forEach(t => {
      const key = t.date.split('T')[0];
      dailyMap.set(key, (dailyMap.get(key) || 0) + t.pnl);
    });

    const days = Array.from(dailyMap.entries()).map(([date, pnl]) => ({ date, pnl }));
    const winningDays = days.filter(d => d.pnl > 0);
    const losingDays = days.filter(d => d.pnl <= 0);

    return {
      winningDays: winningDays.length,
      losingDays: losingDays.length,
      avgWinDay: winningDays.length > 0 ? winningDays.reduce((s, d) => s + d.pnl, 0) / winningDays.length : 0,
      avgLossDay: losingDays.length > 0 ? Math.abs(losingDays.reduce((s, d) => s + d.pnl, 0) / losingDays.length) : 0,
      bestDay: Math.max(...days.map(d => d.pnl), 0),
      worstDay: Math.min(...days.map(d => d.pnl), 0),
    };
  }, [filteredTrades]);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "detailed", label: "Detailed" },
    { id: "winloss", label: "Win vs Loss Days" },
    { id: "compare", label: "Compare" },
  ];

  return (
    <AppLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Reports</h1>
            <p className="text-[13px] text-[#707990] mt-1">Analyze your trading performance</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/calendar"
              className="flex items-center gap-2 px-4 py-2 bg-[#14161d] border border-[#2d3139] rounded text-[#707990] hover:text-white hover:border-[#707990] transition-colors"
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </Link>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[#14161d] border border-[#2d3139] rounded text-[#707990] hover:text-white hover:border-[#707990] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#14161d] rounded border border-[#2d3139] mb-6">
          <div className="flex border-b border-[#2d3139]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-6 py-3 text-[14px] font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-[#00a449] border-b-2 border-[#00a449] -mb-[2px]"
                    : "text-[#707990] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-[#2d3139]">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-[#00a449]" />
              <span className="text-[13px] text-white font-medium">Filters</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-[12px] text-[#707990]">From</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="h-8 px-2 bg-[#22262f] border border-[#2d3139] rounded text-[12px] text-white focus:outline-none focus:border-[#00a449]/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[12px] text-[#707990]">To</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="h-8 px-2 bg-[#22262f] border border-[#2d3139] rounded text-[12px] text-white focus:outline-none focus:border-[#00a449]/50"
                />
              </div>
              <select
                value={filters.side}
                onChange={(e) => setFilters({ ...filters, side: e.target.value as any })}
                className="h-8 px-2 bg-[#22262f] border border-[#2d3139] rounded text-[12px] text-white focus:outline-none focus:border-[#00a449]/50"
              >
                <option value="all">All Sides</option>
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
              <select
                value={filters.duration}
                onChange={(e) => setFilters({ ...filters, duration: e.target.value as any })}
                className="h-8 px-2 bg-[#22262f] border border-[#2d3139] rounded text-[12px] text-white focus:outline-none focus:border-[#00a449]/50"
              >
                <option value="all">All Durations</option>
                <option value="intraday">Intraday</option>
                <option value="multiday">Multiday</option>
              </select>
              <div className="flex items-center gap-1 bg-[#22262f] rounded p-1">
                <button
                  onClick={() => setFilters({ ...filters, plType: "gross" })}
                  className={`px-3 py-1 text-[12px] rounded transition-colors ${
                    filters.plType === "gross"
                      ? "bg-[#14161d] text-white"
                      : "text-[#707990] hover:text-white"
                  }`}
                >
                  Gross
                </button>
                <button
                  onClick={() => setFilters({ ...filters, plType: "net" })}
                  className={`px-3 py-1 text-[12px] rounded transition-colors ${
                    filters.plType === "net"
                      ? "bg-[#14161d] text-white"
                      : "text-[#707990] hover:text-white"
                  }`}
                >
                  Net
                </button>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-px bg-[#2d3139]">
            <div className="bg-[#14161d] p-3 text-center">
              <p className="text-[11px] text-[#707990]">Total P&L</p>
              <p className={`text-[14px] font-bold ${filteredStats.totalPnl >= 0 ? "text-[#00a449]" : "text-[#d91e2b]"}`}>
                {formatCurrency(filteredStats.totalPnl)}
              </p>
            </div>
            <div className="bg-[#14161d] p-3 text-center">
              <p className="text-[11px] text-[#707990]">Trades</p>
              <p className="text-[14px] font-bold text-white">{filteredStats.total}</p>
            </div>
            <div className="bg-[#14161d] p-3 text-center">
              <p className="text-[11px] text-[#707990]">Win Rate</p>
              <p className={`text-[14px] font-bold ${filteredStats.winRate >= 50 ? "text-[#00a449]" : "text-[#d91e2b]"}`}>
                {filteredStats.winRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-[#14161d] p-3 text-center">
              <p className="text-[11px] text-[#707990]">Profit Factor</p>
              <p className={`text-[14px] font-bold ${filteredStats.profitFactor >= 1 ? "text-[#00a449]" : "text-[#d91e2b]"}`}>
                {filteredStats.profitFactor.toFixed(2)}
              </p>
            </div>
            <div className="bg-[#14161d] p-3 text-center">
              <p className="text-[11px] text-[#707990]">Avg Win</p>
              <p className="text-[14px] font-bold text-[#00a449]">{formatCurrency(filteredStats.avgWin)}</p>
            </div>
            <div className="bg-[#14161d] p-3 text-center">
              <p className="text-[11px] text-[#707990]">Avg Loss</p>
              <p className="text-[14px] font-bold text-[#d91e2b]">-{formatCurrency(filteredStats.avgLoss)}</p>
            </div>
            <div className="bg-[#14161d] p-3 text-center">
              <p className="text-[11px] text-[#707990]">Winners</p>
              <p className="text-[14px] font-bold text-[#00a449]">{filteredStats.winners}</p>
            </div>
            <div className="bg-[#14161d] p-3 text-center">
              <p className="text-[11px] text-[#707990]">Losers</p>
              <p className="text-[14px] font-bold text-[#d91e2b]">{filteredStats.losers}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-[#00a449]" />
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="text-center py-16 bg-[#14161d] rounded border border-[#2d3139]">
            <BarChart3 className="h-16 w-16 text-[#707990] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Data Available</h2>
            <p className="text-[#707990]">Import trades to see your performance reports</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <>
                {/* Cumulative P&L Chart */}
                <div className="bg-[#14161d] rounded border border-[#2d3139]">
                  <div className="p-4 border-b border-[#2d3139] flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#00a449]" />
                    <h3 className="text-lg font-semibold text-white">Cumulative P&L</h3>
                  </div>
                  <div className="p-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={cumulativePnL}>
                        <defs>
                          <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.profit} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={COLORS.profit} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                        <XAxis dataKey="date" stroke={COLORS.muted} tick={{ fill: COLORS.muted, fontSize: 12 }} />
                        <YAxis stroke={COLORS.muted} tick={{ fill: COLORS.muted, fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="cumulative" name="Cumulative P&L" stroke={COLORS.profit} strokeWidth={2} fill="url(#colorPnl)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Daily P&L */}
                  <div className="bg-[#14161d] rounded border border-[#2d3139]">
                    <div className="p-4 border-b border-[#2d3139] flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-[#2f91ef]" />
                      <h3 className="text-lg font-semibold text-white">Daily P&L (Last 30 Days)</h3>
                    </div>
                    <div className="p-4">
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={dailyPnLData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                          <XAxis dataKey="date" stroke={COLORS.muted} tick={{ fill: COLORS.muted, fontSize: 10 }} interval="preserveStartEnd" />
                          <YAxis stroke={COLORS.muted} tick={{ fill: COLORS.muted, fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="pnl" name="P&L" radius={[2, 2, 0, 0]}>
                            {dailyPnLData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Win/Loss Pie */}
                  <div className="bg-[#14161d] rounded border border-[#2d3139]">
                    <div className="p-4 border-b border-[#2d3139] flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-[#00a449]" />
                      <h3 className="text-lg font-semibold text-white">Win/Loss Distribution</h3>
                    </div>
                    <div className="p-4">
                      <ResponsiveContainer width="100%" height={250}>
                        <RechartsPie>
                          <Pie data={winLossData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: COLORS.muted }}>
                            {winLossData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend formatter={(value) => <span style={{ color: COLORS.text }}>{value}</span>} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* By Day of Week */}
                  <div className="bg-[#14161d] rounded border border-[#2d3139]">
                    <div className="p-4 border-b border-[#2d3139] flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-[#2f91ef]" />
                      <h3 className="text-lg font-semibold text-white">P&L by Day of Week</h3>
                    </div>
                    <div className="p-4">
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={dayOfWeekData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                          <XAxis dataKey="name" stroke={COLORS.muted} tick={{ fill: COLORS.muted, fontSize: 12 }} />
                          <YAxis stroke={COLORS.muted} tick={{ fill: COLORS.muted, fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                            {dayOfWeekData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* By Hour */}
                  <div className="bg-[#14161d] rounded border border-[#2d3139]">
                    <div className="p-4 border-b border-[#2d3139] flex items-center gap-2">
                      <Clock className="h-5 w-5 text-[#2f91ef]" />
                      <h3 className="text-lg font-semibold text-white">P&L by Hour</h3>
                    </div>
                    <div className="p-4">
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={timingData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                          <XAxis dataKey="hour" stroke={COLORS.muted} tick={{ fill: COLORS.muted, fontSize: 10 }} />
                          <YAxis stroke={COLORS.muted} tick={{ fill: COLORS.muted, fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                            {timingData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* P&L by Ticker */}
                <div className="bg-[#14161d] rounded border border-[#2d3139]">
                  <div className="p-4 border-b border-[#2d3139] flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#00a449]" />
                    <h3 className="text-lg font-semibold text-white">P&L by Ticker</h3>
                  </div>
                  <div className="p-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={tickerData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                        <XAxis type="number" stroke={COLORS.muted} tick={{ fill: COLORS.muted, fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} />
                        <YAxis type="category" dataKey="ticker" stroke={COLORS.muted} tick={{ fill: COLORS.text, fontSize: 12, fontFamily: 'monospace' }} width={60} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="pnl" name="P&L" radius={[0, 4, 4, 0]}>
                          {tickerData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* Detailed Tab */}
            {activeTab === "detailed" && (
              <div className="bg-[#14161d] rounded border border-[#2d3139]">
                <div className="p-4 border-b border-[#2d3139]">
                  <h3 className="text-lg font-semibold text-white">Detailed Statistics</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-[14px] font-medium text-[#00a449]">Performance</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-[13px] text-[#707990]">Total P&L</span>
                          <span className={`text-[13px] font-bold ${filteredStats.totalPnl >= 0 ? "text-[#00a449]" : "text-[#d91e2b]"}`}>{formatCurrency(filteredStats.totalPnl)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[13px] text-[#707990]">Gross Profit</span>
                          <span className="text-[13px] font-bold text-[#00a449]">{formatCurrency(filteredStats.grossProfit)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[13px] text-[#707990]">Gross Loss</span>
                          <span className="text-[13px] font-bold text-[#d91e2b]">{formatCurrency(filteredStats.grossLoss)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[13px] text-[#707990]">Profit Factor</span>
                          <span className="text-[13px] font-bold text-white">{filteredStats.profitFactor.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[14px] font-medium text-[#2f91ef]">Trades</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-[13px] text-[#707990]">Total Trades</span>
                          <span className="text-[13px] font-bold text-white">{filteredStats.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[13px] text-[#707990]">Winning Trades</span>
                          <span className="text-[13px] font-bold text-[#00a449]">{filteredStats.winners}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[13px] text-[#707990]">Losing Trades</span>
                          <span className="text-[13px] font-bold text-[#d91e2b]">{filteredStats.losers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[13px] text-[#707990]">Win Rate</span>
                          <span className="text-[13px] font-bold text-white">{filteredStats.winRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[14px] font-medium text-[#707990]">Averages</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-[13px] text-[#707990]">Avg Win</span>
                          <span className="text-[13px] font-bold text-[#00a449]">{formatCurrency(filteredStats.avgWin)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[13px] text-[#707990]">Avg Loss</span>
                          <span className="text-[13px] font-bold text-[#d91e2b]">-{formatCurrency(filteredStats.avgLoss)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[13px] text-[#707990]">Avg Trade</span>
                          <span className={`text-[13px] font-bold ${filteredStats.totalPnl / filteredStats.total >= 0 ? "text-[#00a449]" : "text-[#d91e2b]"}`}>
                            {formatCurrency(filteredStats.total > 0 ? filteredStats.totalPnl / filteredStats.total : 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[13px] text-[#707990]">Expectancy</span>
                          <span className={`text-[13px] font-bold ${filteredStats.totalPnl / filteredStats.total >= 0 ? "text-[#00a449]" : "text-[#d91e2b]"}`}>
                            {formatCurrency(filteredStats.total > 0 ? filteredStats.totalPnl / filteredStats.total : 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Win vs Loss Days Tab */}
            {activeTab === "winloss" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Winning Days */}
                  <div className="bg-[#14161d] rounded border border-[#2d3139]">
                    <div className="p-4 border-b border-[#2d3139] bg-[#00a449]/10">
                      <h3 className="text-lg font-semibold text-[#00a449]">{winLossDays.winningDays} Winning Days</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[13px] text-[#707990]">Average Win Day</span>
                        <span className="text-[13px] font-bold text-[#00a449]">{formatCurrency(winLossDays.avgWinDay)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[13px] text-[#707990]">Best Day</span>
                        <span className="text-[13px] font-bold text-[#00a449]">{formatCurrency(winLossDays.bestDay)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Losing Days */}
                  <div className="bg-[#14161d] rounded border border-[#2d3139]">
                    <div className="p-4 border-b border-[#2d3139] bg-[#d91e2b]/10">
                      <h3 className="text-lg font-semibold text-[#d91e2b]">{winLossDays.losingDays} Losing Days</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[13px] text-[#707990]">Average Loss Day</span>
                        <span className="text-[13px] font-bold text-[#d91e2b]">-{formatCurrency(winLossDays.avgLossDay)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[13px] text-[#707990]">Worst Day</span>
                        <span className="text-[13px] font-bold text-[#d91e2b]">{formatCurrency(winLossDays.worstDay)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Compare Tab */}
            {activeTab === "compare" && (
              <div className="bg-[#14161d] rounded border border-[#2d3139] p-8 text-center">
                <BarChart3 className="h-12 w-12 text-[#707990] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Compare Feature</h3>
                <p className="text-[13px] text-[#707990]">
                  Compare different trading periods, strategies, or setups. Coming soon.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
