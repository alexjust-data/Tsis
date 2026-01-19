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
  Download,
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
            <h1 className="text-2xl font-bold text-[#f3f3f5]">Trades</h1>
            <p className="text-[13px] text-[#9ba4b8] mt-1">View and manage your trade history</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadTrades}
              disabled={isLoading}
              className="fv-button flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="fv-card p-5 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="h-5 w-5 text-[#57aefd]" />
                <h3 className="text-lg font-semibold text-[#f3f3f5]">Import Trades</h3>
              </div>
              <p className="text-[13px] text-[#9ba4b8] mb-4">
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
                  className="fv-button fv-button-primary flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </button>

                {importStatus?.show && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded ${
                    importStatus.success
                      ? "bg-[#00a449]/15 text-[#00a449]"
                      : "bg-[#d91e2b]/15 text-[#d91e2b]"
                  }`}>
                    {importStatus.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span className="text-[13px]">{importStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
            <button className="text-[#707990] hover:text-white transition-colors">
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters & Stats */}
        <div className="bg-[#14161d] rounded border border-[#2d3139] mb-6">
          <div className="p-4 flex items-center justify-between border-b border-[#2d3139]">
            {/* Search & Filters */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4c5263]" />
                <input
                  placeholder="Search ticker..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="fv-input w-[200px] pl-10 pr-4"
                />
              </div>

              <div className="flex items-center gap-0.5 bg-[#1e2128] rounded-md p-1 border border-[#2d3139]">
                {["all", "long", "short"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSideFilter(filter as typeof sideFilter)}
                    className={`px-3 py-1.5 text-[12px] font-medium rounded transition-colors ${
                      sideFilter === filter
                        ? "bg-[#57aefd] text-white"
                        : "text-[#9ba4b8] hover:text-[#f3f3f5] hover:bg-[#2d3139]"
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6">
              <div className="text-center px-3 py-1.5 rounded bg-[#1e2128]">
                <p className="text-[11px] text-[#707990] uppercase tracking-wide">Trades</p>
                <p className="text-[15px] font-bold text-[#f3f3f5] tabular-nums">{stats.total}</p>
              </div>
              <div className="text-center px-3 py-1.5 rounded bg-[#1e2128]">
                <p className="text-[11px] text-[#707990] uppercase tracking-wide">P&L</p>
                <p className={`text-[15px] font-bold tabular-nums ${stats.pnl >= 0 ? "text-[#00a449]" : "text-[#fb5057]"}`}>
                  {formatCurrency(stats.pnl)}
                </p>
              </div>
              <div className="text-center px-3 py-1.5 rounded bg-[#1e2128]">
                <p className="text-[11px] text-[#707990] uppercase tracking-wide">W/L</p>
                <p className="text-[15px] font-bold text-[#f3f3f5] tabular-nums">
                  <span className="text-[#00a449]">{stats.winners}</span>
                  <span className="text-[#4c5263] mx-0.5">/</span>
                  <span className="text-[#fb5057]">{stats.losers}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-[#00a449]" />
              </div>
            ) : filteredTrades.length === 0 ? (
              <div className="text-center py-12">
                <FileSpreadsheet className="h-12 w-12 text-[#707990] mx-auto mb-4" />
                <p className="text-[#707990]">
                  {trades.length === 0
                    ? "No trades yet. Import your first trades above."
                    : "No trades match your filters."}
                </p>
              </div>
            ) : (
              <table className="fv-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Ticker</th>
                    <th>Side</th>
                    <th className="text-right">Entry</th>
                    <th className="text-right">Exit</th>
                    <th className="text-right">Shares</th>
                    <th className="text-right">P&L</th>
                    <th className="text-right">Time</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.map((trade) => (
                    <tr key={trade.id}>
                      <td className="text-[#9ba4b8] tabular-nums">
                        {formatDate(trade.date)}
                      </td>
                      <td>
                        <span className="font-mono font-bold text-[#f3f3f5]">
                          {trade.ticker}
                        </span>
                      </td>
                      <td>
                        <span className={`fv-badge ${
                          trade.side === "long" ? "fv-badge-success" : "fv-badge-danger"
                        }`}>
                          {trade.side === "long" ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                          )}
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-right font-mono text-[#c3c6d0] tabular-nums">
                        ${trade.entry_price.toFixed(2)}
                      </td>
                      <td className="text-right font-mono text-[#c3c6d0] tabular-nums">
                        ${trade.exit_price.toFixed(2)}
                      </td>
                      <td className="text-right text-[#c3c6d0] tabular-nums">
                        {trade.shares.toLocaleString()}
                      </td>
                      <td className={`text-right font-bold tabular-nums ${
                        trade.pnl >= 0 ? "text-[#00a449]" : "text-[#fb5057]"
                      }`}>
                        {formatCurrency(trade.pnl)}
                      </td>
                      <td className="text-right text-[#9ba4b8] tabular-nums">
                        {formatTime(trade.entry_time)} - {formatTime(trade.exit_time)}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteTrade(trade.id)}
                          className="p-1.5 text-[#4c5263] hover:text-[#fb5057] rounded hover:bg-[#fb5057]/10 transition-colors"
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
            <div className="p-4 border-t border-[#2d3139] flex items-center justify-between">
              <p className="text-[13px] text-[#707990]">
                Showing {filteredTrades.length} of {trades.length} trades
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
