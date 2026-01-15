"use client";

import { useEffect, useState } from "react";
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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { token } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthStats, setMonthStats] = useState<MonthlyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    if (token) {
      loadMonthData();
    }
  }, [token, year, month]);

  const loadMonthData = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const data = await dashboardApi.getCalendar(token, year, month);
      setMonthStats(data);
    } catch (error) {
      console.error("Failed to load calendar data:", error);
      setMonthStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Build calendar grid
  const buildCalendarGrid = (): (CalendarDay | null)[][] => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const calendarMap = new Map<number, CalendarDay>();
    monthStats?.calendar.forEach((day) => {
      const dayNum = new Date(day.date).getDate();
      calendarMap.set(dayNum, day);
    });

    const weeks: (CalendarDay | null)[][] = [];
    let currentWeek: (CalendarDay | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const calendarDay = calendarMap.get(day);
      currentWeek.push(calendarDay || { date: `${year}-${month}-${day}`, pnl: 0, trades: 0, win_rate: 0, is_green: true });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const weeks = buildCalendarGrid();

  return (
    <AppLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Calendar</h1>
            <p className="text-sm text-gray-400 mt-1">Track your daily trading performance</p>
          </div>
          <button
            onClick={loadMonthData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e2329] border border-[#2b3139] rounded-lg text-gray-300 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Month Navigation */}
        <div className="bg-[#1e2329] rounded-lg border border-[#2b3139] p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="flex items-center gap-2 px-4 py-2 bg-[#0b0e11] border border-[#2b3139] rounded-lg text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-green-500" />
                {MONTHS[month - 1]} {year}
              </h2>
              <button
                onClick={handleToday}
                className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                Today
              </button>
            </div>

            <button
              onClick={handleNextMonth}
              className="flex items-center gap-2 px-4 py-2 bg-[#0b0e11] border border-[#2b3139] rounded-lg text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Monthly Stats Summary */}
        {monthStats && monthStats.total_trades > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-[#1e2329] rounded-lg border border-[#2b3139] p-4">
              <p className="text-xs text-gray-500 mb-1">Monthly P&L</p>
              <p className={`text-xl font-bold ${monthStats.total_pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                {formatCurrency(monthStats.total_pnl)}
              </p>
            </div>

            <div className="bg-[#1e2329] rounded-lg border border-[#2b3139] p-4">
              <p className="text-xs text-gray-500 mb-1">Trades</p>
              <p className="text-xl font-bold text-white">{monthStats.total_trades}</p>
            </div>

            <div className="bg-[#1e2329] rounded-lg border border-[#2b3139] p-4">
              <p className="text-xs text-gray-500 mb-1">Win Rate</p>
              <p className="text-xl font-bold text-white">{monthStats.win_rate.toFixed(1)}%</p>
            </div>

            <div className="bg-[#1e2329] rounded-lg border border-[#2b3139] p-4">
              <p className="text-xs text-gray-500 mb-1">Best Day</p>
              <p className="text-xl font-bold text-green-500">{formatCurrency(monthStats.best_day)}</p>
            </div>

            <div className="bg-[#1e2329] rounded-lg border border-[#2b3139] p-4">
              <p className="text-xs text-gray-500 mb-1">Worst Day</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(monthStats.worst_day)}</p>
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="bg-[#1e2329] rounded-lg border border-[#2b3139]">
          <div className="p-4 border-b border-[#2b3139]">
            <h3 className="text-lg font-semibold text-white">Daily Performance</h3>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-green-500" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {DAYS.map((day) => (
                        <th
                          key={day}
                          className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-[#2b3139]"
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
                          if (!day) {
                            return (
                              <td
                                key={dayIdx}
                                className="p-1 border border-[#2b3139] bg-[#14171c]/50"
                              />
                            );
                          }

                          const dayNum = new Date(day.date).getDate();
                          const hasTrades = day.trades > 0;
                          const isToday = new Date().toDateString() === new Date(day.date).toDateString();

                          return (
                            <td
                              key={dayIdx}
                              className={`p-2 border border-[#2b3139] align-top transition-colors ${
                                hasTrades
                                  ? day.is_green
                                    ? "bg-green-500/10 hover:bg-green-500/20"
                                    : "bg-red-500/10 hover:bg-red-500/20"
                                  : "bg-[#14171c]/30 hover:bg-[#14171c]/50"
                              } ${isToday ? "ring-2 ring-green-500 ring-inset" : ""}`}
                            >
                              <div className="min-h-[90px]">
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-sm font-medium ${isToday ? "text-green-500" : "text-gray-400"}`}>
                                    {dayNum}
                                  </span>
                                  {hasTrades && (
                                    <span className="text-xs text-gray-500">
                                      {day.trades} {day.trades === 1 ? "trade" : "trades"}
                                    </span>
                                  )}
                                </div>

                                {hasTrades && (
                                  <div className="space-y-1">
                                    <p
                                      className={`text-lg font-bold ${
                                        day.pnl >= 0 ? "text-green-500" : "text-red-500"
                                      }`}
                                    >
                                      {formatCurrency(day.pnl)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {day.win_rate.toFixed(0)}% WR
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 justify-center mt-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500/50" />
            <span className="text-sm text-gray-400">Profitable Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50" />
            <span className="text-sm text-gray-400">Loss Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#14171c] border border-[#2b3139]" />
            <span className="text-sm text-gray-400">No Trades</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
