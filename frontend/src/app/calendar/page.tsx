"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { dashboardApi, type MonthlyStats, type CalendarDay } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  LogOut,
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
  const router = useRouter();
  const { token, user, logout, fetchUser } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthStats, setMonthStats] = useState<MonthlyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    fetchUser();
  }, [token]);

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

  const handleLogout = () => {
    logout();
    router.push("/login");
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

    // Fill empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }

    // Fill days
    for (let day = 1; day <= daysInMonth; day++) {
      const calendarDay = calendarMap.get(day);
      currentWeek.push(calendarDay || { date: `${year}-${month}-${day}`, pnl: 0, trades: 0, win_rate: 0, is_green: true });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill remaining cells
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  };

  if (!token) {
    return null;
  }

  const weeks = buildCalendarGrid();

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
              <Button variant="ghost" size="sm" className="bg-slate-800">
                Calendar
              </Button>
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              {user?.name || user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={loadMonthData}>
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
        <div className="space-y-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-blue-500" />
              {MONTHS[month - 1]} {year}
            </h2>

            <Button variant="outline" onClick={handleNextMonth}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Monthly Stats Summary */}
          {monthStats && monthStats.total_trades > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-400">Monthly P&L</p>
                  <p className={`text-xl font-bold ${monthStats.total_pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatCurrency(monthStats.total_pnl)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-400">Trades</p>
                  <p className="text-xl font-bold text-white">{monthStats.total_trades}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-400">Win Rate</p>
                  <p className="text-xl font-bold text-white">{monthStats.win_rate.toFixed(1)}%</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-400">Best Day</p>
                  <p className="text-xl font-bold text-green-500">{formatCurrency(monthStats.best_day)}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-400">Worst Day</p>
                  <p className="text-xl font-bold text-red-500">{formatCurrency(monthStats.worst_day)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Calendar Grid */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>Daily Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {DAYS.map((day) => (
                          <th
                            key={day}
                            className="p-2 text-center text-sm font-medium text-slate-400 border-b border-slate-700"
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
                                  className="p-1 border border-slate-700/50 bg-slate-800/30"
                                />
                              );
                            }

                            const dayNum = new Date(day.date).getDate();
                            const hasTrades = day.trades > 0;

                            return (
                              <td
                                key={dayIdx}
                                className={`p-2 border border-slate-700/50 align-top transition-colors ${
                                  hasTrades
                                    ? day.is_green
                                      ? "bg-green-500/10 hover:bg-green-500/20"
                                      : "bg-red-500/10 hover:bg-red-500/20"
                                    : "bg-slate-800/30"
                                }`}
                              >
                                <div className="min-h-[80px]">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-400">
                                      {dayNum}
                                    </span>
                                    {hasTrades && (
                                      <span className="text-xs text-slate-500">
                                        {day.trades} trades
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
                                      <p className="text-xs text-slate-400">
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
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex items-center gap-6 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500/50" />
              <span className="text-sm text-slate-400">Profitable Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50" />
              <span className="text-sm text-slate-400">Loss Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-800/50 border border-slate-700" />
              <span className="text-sm text-slate-400">No Trades</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
