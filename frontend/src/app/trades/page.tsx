"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { tradesApi, type Trade } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  Upload,
  LogOut,
  RefreshCw,
  Search,
  Trash2,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

function formatCurrency(value: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Math.abs(value));

  return value < 0 ? `-${formatted}` : formatted;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return "-";
  return timeStr.substring(0, 5);
}

export default function TradesPage() {
  const router = useRouter();
  const { token, user, logout, fetchUser } = useAuthStore();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [importStatus, setImportStatus] = useState<{
    show: boolean;
    success: boolean;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    fetchUser();
    loadTrades();
  }, [token]);

  useEffect(() => {
    if (searchQuery) {
      setFilteredTrades(
        trades.filter((t) =>
          t.ticker.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredTrades(trades);
    }
  }, [searchQuery, trades]);

  const loadTrades = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const data = await tradesApi.getAll(token);
      setTrades(data);
      setFilteredTrades(data);
    } catch (error) {
      console.error("Failed to load trades:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setImportStatus(null);
    setIsLoading(true);

    try {
      const result = await tradesApi.import(token, file);
      setImportStatus({
        show: true,
        success: true,
        message: result.message,
      });
      loadTrades();
    } catch (error) {
      setImportStatus({
        show: true,
        success: false,
        message: error instanceof Error ? error.message : "Import failed",
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteTrade = async (id: number) => {
    if (!token) return;

    if (!confirm("Are you sure you want to delete this trade?")) return;

    try {
      await tradesApi.delete(token, id);
      setTrades(trades.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Failed to delete trade:", error);
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
              <Button variant="ghost" size="sm" className="bg-slate-800">
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
            <Button variant="ghost" size="icon" onClick={loadTrades}>
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
          {/* Import Section */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Import Trades
              </CardTitle>
              <CardDescription>
                Upload a CSV or Excel file with your trades. Expected columns: date, ticker, side (Long/Short), entry_price, exit_price, shares, pnl
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                </Button>

                {importStatus?.show && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded ${
                    importStatus.success ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                  }`}>
                    {importStatus.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {importStatus.message}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Trades List */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Trade History</CardTitle>
                  <CardDescription>
                    {trades.length} total trades
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by ticker..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : filteredTrades.length === 0 ? (
                <div className="text-center py-8">
                  <FileSpreadsheet className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">
                    {trades.length === 0
                      ? "No trades yet. Import your first trades above."
                      : "No trades match your search."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-2 text-xs font-medium text-slate-400">Date</th>
                        <th className="text-left py-3 px-2 text-xs font-medium text-slate-400">Ticker</th>
                        <th className="text-left py-3 px-2 text-xs font-medium text-slate-400">Side</th>
                        <th className="text-left py-3 px-2 text-xs font-medium text-slate-400">Entry</th>
                        <th className="text-left py-3 px-2 text-xs font-medium text-slate-400">Exit</th>
                        <th className="text-right py-3 px-2 text-xs font-medium text-slate-400">Shares</th>
                        <th className="text-right py-3 px-2 text-xs font-medium text-slate-400">P&L</th>
                        <th className="text-right py-3 px-2 text-xs font-medium text-slate-400">Time</th>
                        <th className="text-right py-3 px-2 text-xs font-medium text-slate-400"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrades.map((trade) => (
                        <tr key={trade.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                          <td className="py-3 px-2 text-sm text-slate-300">
                            {formatDate(trade.date)}
                          </td>
                          <td className="py-3 px-2">
                            <span className="font-mono font-bold text-white">
                              {trade.ticker}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                              trade.side === "long"
                                ? "bg-green-500/20 text-green-500"
                                : "bg-red-500/20 text-red-500"
                            }`}>
                              {trade.side === "long" ? (
                                <ArrowUpRight className="h-3 w-3" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3" />
                              )}
                              {trade.side.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-sm text-slate-300 font-mono">
                            ${trade.entry_price.toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-sm text-slate-300 font-mono">
                            ${trade.exit_price.toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-sm text-slate-300 text-right">
                            {trade.shares}
                          </td>
                          <td className={`py-3 px-2 text-sm font-bold text-right ${
                            trade.pnl >= 0 ? "text-green-500" : "text-red-500"
                          }`}>
                            {formatCurrency(trade.pnl)}
                          </td>
                          <td className="py-3 px-2 text-sm text-slate-400 text-right">
                            {formatTime(trade.entry_time)} - {formatTime(trade.exit_time)}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-500"
                              onClick={() => handleDeleteTrade(trade.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
