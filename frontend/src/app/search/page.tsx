"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { tradesApi, type Trade } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import {
  Search as SearchIcon,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  X,
  RefreshCw,
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

export default function SearchPage() {
  const { token } = useAuthStore();
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Trade[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Search filters
  const [filters, setFilters] = useState({
    ticker: "",
    side: "all" as "all" | "long" | "short",
    result: "all" as "all" | "winner" | "loser",
    startDate: "",
    endDate: "",
    minPnl: "",
    maxPnl: "",
  });

  const handleSearch = async () => {
    if (!token) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      let allTrades = await tradesApi.getAll(token, {
        ticker: filters.ticker || undefined,
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
      });

      // Apply additional client-side filters
      if (filters.side !== "all") {
        allTrades = allTrades.filter((t) => t.side === filters.side);
      }

      if (filters.result !== "all") {
        allTrades = allTrades.filter((t) =>
          filters.result === "winner" ? t.pnl > 0 : t.pnl <= 0
        );
      }

      if (filters.minPnl) {
        const min = parseFloat(filters.minPnl);
        allTrades = allTrades.filter((t) => t.pnl >= min);
      }

      if (filters.maxPnl) {
        const max = parseFloat(filters.maxPnl);
        allTrades = allTrades.filter((t) => t.pnl <= max);
      }

      setResults(allTrades);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      ticker: "",
      side: "all",
      result: "all",
      startDate: "",
      endDate: "",
      minPnl: "",
      maxPnl: "",
    });
    setResults([]);
    setHasSearched(false);
  };

  const stats = {
    total: results.length,
    pnl: results.reduce((sum, t) => sum + t.pnl, 0),
    winners: results.filter((t) => t.pnl > 0).length,
    losers: results.filter((t) => t.pnl <= 0).length,
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Search</h1>
          <p className="text-[13px] text-[#707990] mt-1">
            Find trades with advanced filters
          </p>
        </div>

        {/* Search Filters */}
        <div className="bg-[#14161d] rounded border border-[#2d3139] p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-[#00a449]" />
            <h3 className="text-lg font-semibold text-white">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Ticker */}
            <div>
              <label className="block text-[12px] text-[#707990] mb-1.5">
                Ticker
              </label>
              <input
                type="text"
                placeholder="e.g., AAPL"
                value={filters.ticker}
                onChange={(e) =>
                  setFilters({ ...filters, ticker: e.target.value.toUpperCase() })
                }
                className="w-full h-9 px-3 bg-[#22262f] border border-[#2d3139] rounded text-[13px] text-white placeholder-[#707990] font-mono focus:outline-none focus:border-[#00a449]/50"
              />
            </div>

            {/* Side */}
            <div>
              <label className="block text-[12px] text-[#707990] mb-1.5">
                Side
              </label>
              <select
                value={filters.side}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    side: e.target.value as typeof filters.side,
                  })
                }
                className="w-full h-9 px-3 bg-[#22262f] border border-[#2d3139] rounded text-[13px] text-white focus:outline-none focus:border-[#00a449]/50"
              >
                <option value="all">All Sides</option>
                <option value="long">Long Only</option>
                <option value="short">Short Only</option>
              </select>
            </div>

            {/* Result */}
            <div>
              <label className="block text-[12px] text-[#707990] mb-1.5">
                Result
              </label>
              <select
                value={filters.result}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    result: e.target.value as typeof filters.result,
                  })
                }
                className="w-full h-9 px-3 bg-[#22262f] border border-[#2d3139] rounded text-[13px] text-white focus:outline-none focus:border-[#00a449]/50"
              >
                <option value="all">All Results</option>
                <option value="winner">Winners Only</option>
                <option value="loser">Losers Only</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-[12px] text-[#707990] mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="w-full h-9 px-3 bg-[#22262f] border border-[#2d3139] rounded text-[13px] text-white focus:outline-none focus:border-[#00a449]/50"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[12px] text-[#707990] mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="w-full h-9 px-3 bg-[#22262f] border border-[#2d3139] rounded text-[13px] text-white focus:outline-none focus:border-[#00a449]/50"
              />
            </div>

            {/* Min P&L */}
            <div>
              <label className="block text-[12px] text-[#707990] mb-1.5">
                Min P&L
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707990] text-[13px]">
                  $
                </span>
                <input
                  type="number"
                  placeholder="-1000"
                  value={filters.minPnl}
                  onChange={(e) =>
                    setFilters({ ...filters, minPnl: e.target.value })
                  }
                  className="w-full h-9 pl-7 pr-3 bg-[#22262f] border border-[#2d3139] rounded text-[13px] text-white placeholder-[#707990] font-mono focus:outline-none focus:border-[#00a449]/50"
                />
              </div>
            </div>

            {/* Max P&L */}
            <div>
              <label className="block text-[12px] text-[#707990] mb-1.5">
                Max P&L
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707990] text-[13px]">
                  $
                </span>
                <input
                  type="number"
                  placeholder="5000"
                  value={filters.maxPnl}
                  onChange={(e) =>
                    setFilters({ ...filters, maxPnl: e.target.value })
                  }
                  className="w-full h-9 pl-7 pr-3 bg-[#22262f] border border-[#2d3139] rounded text-[13px] text-white placeholder-[#707990] font-mono focus:outline-none focus:border-[#00a449]/50"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="flex items-center gap-2 px-4 py-2 bg-[#00a449] hover:bg-[#00a449]/90 text-white text-[14px] font-medium rounded transition-colors disabled:opacity-50"
            >
              {isSearching ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <SearchIcon className="h-4 w-4" />
              )}
              Search
            </button>
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 bg-[#22262f] border border-[#2d3139] text-[#707990] hover:text-white hover:border-[#707990] text-[14px] rounded transition-colors"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="bg-[#14161d] rounded border border-[#2d3139]">
            {/* Results Header */}
            <div className="p-4 border-b border-[#2d3139] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Results ({stats.total})
              </h3>
              {stats.total > 0 && (
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[11px] text-[#707990]">Total P&L</p>
                    <p
                      className={`text-[14px] font-bold ${
                        stats.pnl >= 0 ? "text-[#00a449]" : "text-[#d91e2b]"
                      }`}
                    >
                      {formatCurrency(stats.pnl)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-[#707990]">W/L</p>
                    <p className="text-[14px] font-bold text-white">
                      <span className="text-[#00a449]">{stats.winners}</span>
                      {" / "}
                      <span className="text-[#d91e2b]">{stats.losers}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              {isSearching ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin text-[#00a449]" />
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-12">
                  <SearchIcon className="h-12 w-12 text-[#707990] mx-auto mb-4" />
                  <p className="text-[#707990]">
                    No trades found matching your criteria
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#22262f]">
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#707990] uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#707990] uppercase tracking-wider">
                        Ticker
                      </th>
                      <th className="text-left py-3 px-4 text-[12px] font-medium text-[#707990] uppercase tracking-wider">
                        Side
                      </th>
                      <th className="text-right py-3 px-4 text-[12px] font-medium text-[#707990] uppercase tracking-wider">
                        Entry
                      </th>
                      <th className="text-right py-3 px-4 text-[12px] font-medium text-[#707990] uppercase tracking-wider">
                        Exit
                      </th>
                      <th className="text-right py-3 px-4 text-[12px] font-medium text-[#707990] uppercase tracking-wider">
                        Shares
                      </th>
                      <th className="text-right py-3 px-4 text-[12px] font-medium text-[#707990] uppercase tracking-wider">
                        P&L
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d3139]">
                    {results.map((trade) => (
                      <tr
                        key={trade.id}
                        className="hover:bg-[#22262f] transition-colors"
                      >
                        <td className="py-3 px-4 text-[14px] text-[#707990]">
                          {formatDate(trade.date)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-white">
                            {trade.ticker}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-medium ${
                              trade.side === "long"
                                ? "bg-[#00a449]/15 text-[#00a449]"
                                : "bg-[#d91e2b]/15 text-[#d91e2b]"
                            }`}
                          >
                            {trade.side === "long" ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {trade.side.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[14px] text-[#707990] text-right font-mono">
                          ${trade.entry_price.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-[14px] text-[#707990] text-right font-mono">
                          ${trade.exit_price.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-[14px] text-[#707990] text-right">
                          {trade.shares.toLocaleString()}
                        </td>
                        <td
                          className={`py-3 px-4 text-[14px] font-bold text-right ${
                            trade.pnl >= 0 ? "text-[#00a449]" : "text-[#d91e2b]"
                          }`}
                        >
                          {formatCurrency(trade.pnl)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
