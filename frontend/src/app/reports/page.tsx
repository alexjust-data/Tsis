"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@/lib/auth";
import { dashboardApi, tradesApi, type Trade, type TickerStats, type TimingStats, type DashboardMetrics } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import { RefreshCw, BarChart3, TrendingUp, PieChart, Clock } from "lucide-react";
import {
  LineChart,
  Line,
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

export default function ReportsPage() {
  const { token } = useAuthStore();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tickers, setTickers] = useState<TickerStats[]>([]);
  const [timing, setTiming] = useState<TimingStats[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
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
      const [tradesData, tickersData, timingData, metricsData] = await Promise.all([
        tradesApi.getAll(token),
        dashboardApi.getTickers(token, 10),
        dashboardApi.getTiming(token),
        dashboardApi.getMetrics(token),
      ]);
      setTrades(tradesData);
      setTickers(tickersData);
      setTiming(timingData);
      setMetrics(metricsData);
    } catch (error) {
      console.error("Failed to load reports data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate cumulative P&L over time
  const cumulativePnL = useMemo(() => {
    if (!trades.length) return [];

    const sortedTrades = [...trades].sort((a, b) =>
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
  }, [trades]);

  // Daily P&L for bar chart
  const dailyPnLData = useMemo(() => {
    return cumulativePnL.slice(-30).map(d => ({
      ...d,
      fill: d.pnl >= 0 ? COLORS.profit : COLORS.loss,
    }));
  }, [cumulativePnL]);

  // Win/Loss pie data
  const winLossData = useMemo(() => {
    if (!metrics) return [];
    return [
      { name: 'Winners', value: metrics.winning_trades, color: COLORS.profit },
      { name: 'Losers', value: metrics.losing_trades, color: COLORS.loss },
    ];
  }, [metrics]);

  // P&L by day of week
  const dayOfWeekData = useMemo(() => {
    if (!trades.length) return [];

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayStats: Record<number, { pnl: number; trades: number }> = {};

    trades.forEach(trade => {
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
  }, [trades]);

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

  return (
    <AppLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Reports</h1>
            <p className="text-[13px] text-[#707990] mt-1">Analyze your trading performance</p>
          </div>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#14161d] border border-[#2d3139] rounded text-[#707990] hover:text-white hover:border-[#707990] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-[#00a449]" />
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-16 bg-[#14161d] rounded border border-[#2d3139]">
            <BarChart3 className="h-16 w-16 text-[#707990] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Data Available</h2>
            <p className="text-[#707990]">Import trades to see your performance reports</p>
          </div>
        ) : (
          <div className="space-y-6">
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
                    <XAxis
                      dataKey="date"
                      stroke={COLORS.muted}
                      tick={{ fill: COLORS.muted, fontSize: 12 }}
                    />
                    <YAxis
                      stroke={COLORS.muted}
                      tick={{ fill: COLORS.muted, fontSize: 12 }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      name="Cumulative P&L"
                      stroke={COLORS.profit}
                      strokeWidth={2}
                      fill="url(#colorPnl)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily P&L and Win/Loss Distribution */}
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
                      <XAxis
                        dataKey="date"
                        stroke={COLORS.muted}
                        tick={{ fill: COLORS.muted, fontSize: 10 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        stroke={COLORS.muted}
                        tick={{ fill: COLORS.muted, fontSize: 12 }}
                        tickFormatter={(v) => `$${v}`}
                      />
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
                      <Pie
                        data={winLossData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={{ stroke: COLORS.muted }}
                      >
                        {winLossData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend
                        formatter={(value) => <span style={{ color: COLORS.text }}>{value}</span>}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* P&L by Day of Week and P&L by Hour */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <XAxis
                        dataKey="name"
                        stroke={COLORS.muted}
                        tick={{ fill: COLORS.muted, fontSize: 12 }}
                      />
                      <YAxis
                        stroke={COLORS.muted}
                        tick={{ fill: COLORS.muted, fontSize: 12 }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
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
                      <XAxis
                        dataKey="hour"
                        stroke={COLORS.muted}
                        tick={{ fill: COLORS.muted, fontSize: 10 }}
                      />
                      <YAxis
                        stroke={COLORS.muted}
                        tick={{ fill: COLORS.muted, fontSize: 12 }}
                        tickFormatter={(v) => `$${v}`}
                      />
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
                    <XAxis
                      type="number"
                      stroke={COLORS.muted}
                      tick={{ fill: COLORS.muted, fontSize: 12 }}
                      tickFormatter={(v) => formatCurrency(v)}
                    />
                    <YAxis
                      type="category"
                      dataKey="ticker"
                      stroke={COLORS.muted}
                      tick={{ fill: COLORS.text, fontSize: 12, fontFamily: 'monospace' }}
                      width={60}
                    />
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
          </div>
        )}
      </div>
    </AppLayout>
  );
}
