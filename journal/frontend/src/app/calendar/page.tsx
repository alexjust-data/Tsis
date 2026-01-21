"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@/lib/auth";
import { dashboardApi, type MonthlyStats, type CalendarDay } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";

function formatCurrency(value: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value));

  return value < 0 ? `-${formatted}` : formatted;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

interface MiniCalendarDay {
  day: number;
  isOtherMonth: boolean;
  pnl: number;
  trades: number;
  hasTrades: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isGreen: boolean;
}

export default function CalendarPage() {
  const { token } = useAuthStore();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthsData, setMonthsData] = useState<Map<number, MonthlyStats>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Load all 12 months of data for the current year
  useEffect(() => {
    if (token) {
      loadYearData();
    }
  }, [token, currentYear]);

  const loadYearData = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const promises = [];
      for (let month = 1; month <= 12; month++) {
        promises.push(
          dashboardApi.getCalendar(token, currentYear, month)
            .then(data => ({ month, data }))
            .catch(() => ({ month, data: null }))
        );
      }

      const results = await Promise.all(promises);
      const newMonthsData = new Map<number, MonthlyStats>();

      results.forEach(({ month, data }) => {
        if (data) {
          newMonthsData.set(month, data);
        }
      });

      setMonthsData(newMonthsData);
    } catch (error) {
      console.error("Failed to load calendar data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevYear = () => {
    setCurrentYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setCurrentYear(prev => prev + 1);
  };

  const handleThisYear = () => {
    setCurrentYear(new Date().getFullYear());
  };

  // Build mini calendar grid for a specific month
  const buildMiniCalendar = (year: number, month: number): MiniCalendarDay[][] => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

    const monthStats = monthsData.get(month);
    const calendarMap = new Map<number, CalendarDay>();

    monthStats?.calendar.forEach((day) => {
      const dayNum = new Date(day.date).getDate();
      calendarMap.set(dayNum, day);
    });

    const weeks: MiniCalendarDay[][] = [];
    let currentWeek: MiniCalendarDay[] = [];
    const today = new Date();

    // Fill in days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      currentWeek.push({
        day,
        isOtherMonth: true,
        pnl: 0,
        trades: 0,
        hasTrades: false,
        isToday: false,
        isWeekend: currentWeek.length === 0 || currentWeek.length === 6,
        isGreen: true,
      });
    }

    // Fill in days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const calendarDay = calendarMap.get(day);
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      const isToday = today.getFullYear() === year &&
                      today.getMonth() === month - 1 &&
                      today.getDate() === day;

      currentWeek.push({
        day,
        isOtherMonth: false,
        pnl: calendarDay?.pnl || 0,
        trades: calendarDay?.trades || 0,
        hasTrades: (calendarDay?.trades || 0) > 0,
        isToday,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isGreen: calendarDay?.is_green ?? true,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill in days from next month
    let nextDay = 1;
    while (currentWeek.length < 7 && currentWeek.length > 0) {
      currentWeek.push({
        day: nextDay++,
        isOtherMonth: true,
        pnl: 0,
        trades: 0,
        hasTrades: false,
        isToday: false,
        isWeekend: currentWeek.length === 0 || currentWeek.length === 6,
        isGreen: true,
      });
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  // Calculate yearly stats
  const yearlyStats = useMemo(() => {
    let totalPnl = 0;
    let totalTrades = 0;
    let winners = 0;
    let losers = 0;
    let bestDay = 0;
    let worstDay = 0;
    let greenDays = 0;
    let redDays = 0;

    monthsData.forEach((monthData) => {
      totalPnl += monthData.total_pnl;
      totalTrades += monthData.total_trades;

      monthData.calendar.forEach((day) => {
        if (day.trades > 0) {
          if (day.pnl > bestDay) bestDay = day.pnl;
          if (day.pnl < worstDay) worstDay = day.pnl;
          if (day.is_green) {
            greenDays++;
          } else {
            redDays++;
          }
        }
      });
    });

    // Count winners/losers from trades
    monthsData.forEach((monthData) => {
      const monthWinRate = monthData.win_rate / 100;
      const monthWinners = Math.round(monthData.total_trades * monthWinRate);
      winners += monthWinners;
      losers += monthData.total_trades - monthWinners;
    });

    const winRate = totalTrades > 0 ? (winners / totalTrades) * 100 : 0;

    return {
      totalPnl,
      totalTrades,
      winRate,
      bestDay,
      worstDay,
      greenDays,
      redDays,
    };
  }, [monthsData]);

  return (
    <AppLayout>
      <div className="p-6">
        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={loadYearData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#131722] border border-[#2a2e39] rounded text-[13px] text-[#787b86] hover:text-white hover:border-[#787b86] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Year Navigation */}
        <div className="bg-[#131722] rounded border border-[#2a2e39] p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevYear}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e222d] border border-[#2a2e39] rounded text-[#787b86] hover:text-white hover:border-[#787b86] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {currentYear - 1}
            </button>

            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-[#26a69a]" />
                {currentYear}
              </h2>
              <button
                onClick={handleThisYear}
                className="px-3 py-1 text-[12px] bg-[#26a69a] hover:bg-[#26a69a]/90 text-white rounded transition-colors"
              >
                This Year
              </button>
            </div>

            <button
              onClick={handleNextYear}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e222d] border border-[#2a2e39] rounded text-[#787b86] hover:text-white hover:border-[#787b86] transition-colors"
            >
              {currentYear + 1}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Yearly Stats Summary */}
        {yearlyStats.totalTrades > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-[#131722] rounded border border-[#2a2e39] p-4">
              <p className="text-[12px] text-[#787b86] mb-1">Yearly P&L</p>
              <p className={`text-xl font-bold ${yearlyStats.totalPnl >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                {formatCurrency(yearlyStats.totalPnl)}
              </p>
            </div>

            <div className="bg-[#131722] rounded border border-[#2a2e39] p-4">
              <p className="text-[12px] text-[#787b86] mb-1">Trades</p>
              <p className="text-xl font-bold text-white">{yearlyStats.totalTrades}</p>
            </div>

            <div className="bg-[#131722] rounded border border-[#2a2e39] p-4">
              <p className="text-[12px] text-[#787b86] mb-1">Win Rate</p>
              <p className="text-xl font-bold text-white">{yearlyStats.winRate.toFixed(1)}%</p>
            </div>

            <div className="bg-[#131722] rounded border border-[#2a2e39] p-4">
              <p className="text-[12px] text-[#787b86] mb-1">Best Day</p>
              <p className="text-xl font-bold text-[#26a69a]">{formatCurrency(yearlyStats.bestDay)}</p>
            </div>

            <div className="bg-[#131722] rounded border border-[#2a2e39] p-4">
              <p className="text-[12px] text-[#787b86] mb-1">Worst Day</p>
              <p className="text-xl font-bold text-[#ef5350]">{formatCurrency(yearlyStats.worstDay)}</p>
            </div>

            <div className="bg-[#131722] rounded border border-[#2a2e39] p-4">
              <p className="text-[12px] text-[#787b86] mb-1">Green Days</p>
              <p className="text-xl font-bold text-[#26a69a]">{yearlyStats.greenDays}</p>
            </div>

            <div className="bg-[#131722] rounded border border-[#2a2e39] p-4">
              <p className="text-[12px] text-[#787b86] mb-1">Red Days</p>
              <p className="text-xl font-bold text-[#ef5350]">{yearlyStats.redDays}</p>
            </div>
          </div>
        )}

        {/* 12 Month Calendar Grid */}
        <div className="bg-[#131722] rounded border border-[#2a2e39]">
          <div className="p-4 border-b border-[#2a2e39]">
            <h3 className="text-lg font-semibold text-white">Daily Performance</h3>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-[#26a69a]" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {MONTHS.map((monthName, index) => {
                  const month = index + 1;
                  const weeks = buildMiniCalendar(currentYear, month);
                  const monthStats = monthsData.get(month);
                  const monthPnl = monthStats?.total_pnl || 0;
                  const monthTrades = monthStats?.total_trades || 0;

                  return (
                    <div
                      key={month}
                      className="bg-[#1e222d]/50 rounded border border-[#2a2e39] overflow-hidden"
                    >
                      {/* Month Header */}
                      <div className="px-3 py-2 border-b border-[#2a2e39] flex items-center justify-between">
                        <span className="text-[14px] font-semibold text-white">
                          {monthName}
                        </span>
                        {monthTrades > 0 && (
                          <span
                            className={`text-[13px] font-bold ${
                              monthPnl >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"
                            }`}
                          >
                            {formatCurrency(monthPnl)}
                          </span>
                        )}
                      </div>

                      {/* Mini Calendar */}
                      <div className="p-2">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              {DAYS_SHORT.map((day, i) => (
                                <th
                                  key={i}
                                  className={`text-center text-[10px] font-medium py-1 ${
                                    i === 0 || i === 6
                                      ? "text-[#787b86]/70"
                                      : "text-[#787b86]"
                                  }`}
                                >
                                  {day}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {weeks.map((week, weekIdx) => (
                              <tr key={weekIdx}>
                                {week.map((day, dayIdx) => {
                                  const cellClasses = [
                                    "text-center text-[11px] p-1 relative",
                                    day.isOtherMonth
                                      ? "text-[#787b86]/30"
                                      : day.isWeekend
                                      ? "text-[#787b86]/70"
                                      : "text-[#787b86]",
                                  ];

                                  // Background for trades
                                  let bgClass = "";
                                  if (day.hasTrades && !day.isOtherMonth) {
                                    bgClass = day.isGreen
                                      ? "bg-[#26a69a]/30"
                                      : "bg-[#ef5350]/30";
                                  }

                                  // Today highlight
                                  const todayClass = day.isToday
                                    ? "ring-1 ring-[#26a69a] ring-inset rounded"
                                    : "";

                                  return (
                                    <td
                                      key={dayIdx}
                                      className={cellClasses.join(" ")}
                                      title={
                                        day.hasTrades && !day.isOtherMonth
                                          ? `${day.trades} trade${day.trades !== 1 ? "s" : ""}: ${formatCurrency(day.pnl)}`
                                          : undefined
                                      }
                                    >
                                      <div
                                        className={`w-6 h-6 mx-auto flex items-center justify-center rounded-sm ${bgClass} ${todayClass}`}
                                      >
                                        <span
                                          className={
                                            day.hasTrades && !day.isOtherMonth
                                              ? day.isGreen
                                                ? "text-[#26a69a] font-medium"
                                                : "text-[#ef5350] font-medium"
                                              : ""
                                          }
                                        >
                                          {day.day}
                                        </span>
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Month Footer Stats */}
                      {monthTrades > 0 && (
                        <div className="px-3 py-2 border-t border-[#2a2e39] flex items-center justify-between text-[11px] text-[#787b86]">
                          <span>{monthTrades} trades</span>
                          <span>{monthStats?.win_rate.toFixed(0)}% WR</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 justify-center mt-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#26a69a]/30 border border-[#26a69a]/50" />
            <span className="text-[14px] text-[#787b86]">Profitable Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#ef5350]/30 border border-[#ef5350]/50" />
            <span className="text-[14px] text-[#787b86]">Loss Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#1e222d] border border-[#2a2e39]" />
            <span className="text-[14px] text-[#787b86]">No Trades</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded ring-1 ring-[#26a69a]" />
            <span className="text-[14px] text-[#787b86]">Today</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
