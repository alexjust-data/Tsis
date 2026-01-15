"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/lib/auth";
import { tradesApi, type Trade } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import {
  Upload,
  RefreshCw,
  Search,
  Trash2,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  MoreVertical,
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
  const { token } = useAuthStore();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sideFilter, setSideFilter] = useState<"all" | "long" | "short">("all");
  const [importStatus, setImportStatus] = useState<{
    show: boolean;
    success: boolean;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) {
      loadTrades();
    }
  }, [token]);

  useEffect(() => {
    let filtered = trades;

    if (searchQuery) {
      filtered = filtered.filter((t) =>
        t.ticker.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sideFilter !== "all") {
      filtered = filtered.filter((t) => t.side === sideFilter);
    }

    setFilteredTrades(filtered);
  }, [searchQuery, sideFilter, trades]);

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

  // Stats for filtered trades
  const stats = {
    total: filteredTrades.length,
    pnl: filteredTrades.reduce((sum, t) => sum + t.pnl, 0),
    winners: filteredTrades.filter((t) => t.pnl > 0).length,
    losers: filteredTrades.filter((t) => t.pnl <= 0).length,
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Trades</h1>
            <p className="text-sm text-gray-400 mt-1">View and manage your trade history</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadTrades}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e2329] border border-[#2b3139] rounded-lg text-gray-300 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-[#1e2329] rounded-lg border border-[#2b3139] p-5 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold text-white">Import Trades</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Upload a CSV or Excel file. Expected columns: date, ticker, side, entry_price, exit_price, shares, pnl
              </p>
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </button>

                {importStatus?.show && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    importStatus.success
                      ? "bg-green-500/20 text-green-500"
                      : "bg-red-500/20 text-red-500"
                  }`}>
                    {importStatus.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span className="text-sm">{importStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
            <button className="text-gray-400 hover:text-white">
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters & Stats */}
        <div className="bg-[#1e2329] rounded-lg border border-[#2b3139] mb-6">
          <div className="p-4 flex items-center justify-between border-b border-[#2b3139]">
            {/* Search & Filters */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  placeholder="Search ticker..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[200px] h-9 pl-10 pr-4 bg-[#0b0e11] border border-[#2b3139] rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#0b0e11] rounded-lg p-1">
                {["all", "long", "short"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSideFilter(filter as typeof sideFilter)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      sideFilter === filter
                        ? "bg-[#2b3139] text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-gray-500">Trades</p>
                <p className="text-sm font-bold text-white">{stats.total}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">P&L</p>
                <p className={`text-sm font-bold ${stats.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatCurrency(stats.pnl)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">W/L</p>
                <p className="text-sm font-bold text-white">
                  <span className="text-green-500">{stats.winners}</span>
                  {" / "}
                  <span className="text-red-500">{stats.losers}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-green-500" />
              </div>
            ) : filteredTrades.length === 0 ? (
              <div className="text-center py-12">
                <FileSpreadsheet className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  {trades.length === 0
                    ? "No trades yet. Import your first trades above."
                    : "No trades match your filters."}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-[#14171c]">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Ticker</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Side</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Entry</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Exit</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2b3139]">
                  {filteredTrades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-[#14171c] transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-300">
                        {formatDate(trade.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-white">
                          {trade.ticker}
                        </span>
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-sm text-gray-300 text-right font-mono">
                        ${trade.entry_price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300 text-right font-mono">
                        ${trade.exit_price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300 text-right">
                        {trade.shares.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 text-sm font-bold text-right ${
                        trade.pnl >= 0 ? "text-green-500" : "text-red-500"
                      }`}>
                        {formatCurrency(trade.pnl)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400 text-right">
                        {formatTime(trade.entry_time)} - {formatTime(trade.exit_time)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeleteTrade(trade.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-500/10 transition-colors"
                          title="Delete trade"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination placeholder */}
          {filteredTrades.length > 0 && (
            <div className="p-4 border-t border-[#2b3139] flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing {filteredTrades.length} of {trades.length} trades
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
