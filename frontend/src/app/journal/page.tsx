"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { journalApi, tradesApi, tagsApi, type JournalEntry, type Trade, type Tag } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import {
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Edit3,
  ArrowUpRight,
  ArrowDownRight,
  Tag as TagIcon,
  MessageSquare,
  Calendar,
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
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return "-";
  return timeStr.substring(0, 5);
}

export default function JournalPage() {
  const { token } = useAuthStore();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [editingNote, setEditingNote] = useState<{ tradeId: number; note: string } | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const [entriesData, tagsData] = await Promise.all([
        journalApi.getEntries(token),
        tagsApi.getAll(token),
      ]);
      setEntries(entriesData);
      setTags(tagsData);

      // Expand the first entry by default
      if (entriesData.length > 0) {
        setExpandedDates(new Set([entriesData[0].date]));
      }
    } catch (error) {
      console.error("Failed to load journal data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const handleSaveNote = async (tradeId: number) => {
    if (!token || !editingNote) return;

    try {
      await tradesApi.update(token, tradeId, { notes: editingNote.note });
      // Update local state
      setEntries(entries.map(entry => ({
        ...entry,
        trades: entry.trades.map(trade =>
          trade.id === tradeId ? { ...trade, notes: editingNote.note } : trade
        ),
      })));
      setEditingNote(null);
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  const handleCreateTag = async () => {
    if (!token || !newTagName.trim()) return;

    try {
      const newTag = await tagsApi.create(token, { name: newTagName.trim() });
      setTags([...tags, newTag]);
      setNewTagName("");
      setShowTagInput(false);
    } catch (error) {
      console.error("Failed to create tag:", error);
    }
  };

  // Stats summary
  const totalPnl = entries.reduce((sum, e) => sum + e.total_pnl, 0);
  const totalTrades = entries.reduce((sum, e) => sum + e.total_trades, 0);
  const tradingDays = entries.length;

  return (
    <AppLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Journal</h1>
            <p className="text-[13px] text-[#707990] mt-1">
              Review your trading days and add notes
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#14161d] border border-[#2d3139] rounded text-[#707990] hover:text-white hover:border-[#707990] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#14161d] rounded border border-[#2d3139] p-4">
            <p className="text-[12px] text-[#707990] mb-1">Trading Days</p>
            <p className="text-xl font-bold text-white">{tradingDays}</p>
          </div>
          <div className="bg-[#14161d] rounded border border-[#2d3139] p-4">
            <p className="text-[12px] text-[#707990] mb-1">Total Trades</p>
            <p className="text-xl font-bold text-white">{totalTrades}</p>
          </div>
          <div className="bg-[#14161d] rounded border border-[#2d3139] p-4">
            <p className="text-[12px] text-[#707990] mb-1">Total P&L</p>
            <p className={`text-xl font-bold ${totalPnl >= 0 ? "text-[#00a449]" : "text-[#d91e2b]"}`}>
              {formatCurrency(totalPnl)}
            </p>
          </div>
          <div className="bg-[#14161d] rounded border border-[#2d3139] p-4">
            <p className="text-[12px] text-[#707990] mb-1">Avg P&L/Day</p>
            <p className={`text-xl font-bold ${totalPnl >= 0 ? "text-[#00a449]" : "text-[#d91e2b]"}`}>
              {tradingDays > 0 ? formatCurrency(totalPnl / tradingDays) : "$0.00"}
            </p>
          </div>
        </div>

        {/* Tags Section */}
        <div className="bg-[#14161d] rounded border border-[#2d3139] p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-[#00a449]" />
              <h3 className="text-[14px] font-medium text-white">Most Common Tags</h3>
            </div>
            <button
              onClick={() => setShowTagInput(!showTagInput)}
              className="text-[#707990] hover:text-[#00a449] transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {showTagInput && (
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                placeholder="Tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                className="flex-1 h-8 px-3 bg-[#22262f] border border-[#2d3139] rounded text-[13px] text-white placeholder-[#707990] focus:outline-none focus:border-[#00a449]/50"
              />
              <button
                onClick={handleCreateTag}
                className="px-3 py-1.5 bg-[#00a449] text-white text-[12px] rounded hover:bg-[#00a449]/90"
              >
                Add
              </button>
              <button
                onClick={() => setShowTagInput(false)}
                className="p-1.5 text-[#707990] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {tags.length === 0 ? (
              <p className="text-[13px] text-[#707990]">No tags yet. Create one to categorize your trades.</p>
            ) : (
              tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-3 py-1 text-[12px] rounded-full bg-[#22262f] text-white border border-[#2d3139]"
                  style={{ borderColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Journal Entries */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 bg-[#14161d] rounded border border-[#2d3139]">
              <RefreshCw className="h-6 w-6 animate-spin text-[#00a449]" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 bg-[#14161d] rounded border border-[#2d3139]">
              <Calendar className="h-12 w-12 text-[#707990] mx-auto mb-4" />
              <p className="text-[#707990]">No journal entries yet. Import trades to start journaling.</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.date} className="bg-[#14161d] rounded border border-[#2d3139]">
                {/* Day Header */}
                <button
                  onClick={() => toggleExpand(entry.date)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#22262f]/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {expandedDates.has(entry.date) ? (
                      <ChevronDown className="h-5 w-5 text-[#707990]" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-[#707990]" />
                    )}
                    <div className="text-left">
                      <h3 className="text-[16px] font-semibold text-white">
                        {formatDate(entry.date)}
                      </h3>
                      <p className="text-[12px] text-[#707990]">
                        {entry.total_trades} trades &bull; {entry.winners}W / {entry.losers}L
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-xl font-bold ${
                        entry.total_pnl >= 0 ? "text-[#00a449]" : "text-[#d91e2b]"
                      }`}
                    >
                      {formatCurrency(entry.total_pnl)}
                    </p>
                    <p className="text-[12px] text-[#707990]">
                      {((entry.winners / entry.total_trades) * 100).toFixed(0)}% Win Rate
                    </p>
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedDates.has(entry.date) && (
                  <div className="border-t border-[#2d3139]">
                    {/* Trades Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-[#22262f]">
                            <th className="text-left py-2 px-4 text-[12px] font-medium text-[#707990]">
                              Time
                            </th>
                            <th className="text-left py-2 px-4 text-[12px] font-medium text-[#707990]">
                              Ticker
                            </th>
                            <th className="text-left py-2 px-4 text-[12px] font-medium text-[#707990]">
                              Side
                            </th>
                            <th className="text-right py-2 px-4 text-[12px] font-medium text-[#707990]">
                              Entry
                            </th>
                            <th className="text-right py-2 px-4 text-[12px] font-medium text-[#707990]">
                              Exit
                            </th>
                            <th className="text-right py-2 px-4 text-[12px] font-medium text-[#707990]">
                              Shares
                            </th>
                            <th className="text-right py-2 px-4 text-[12px] font-medium text-[#707990]">
                              P&L
                            </th>
                            <th className="text-center py-2 px-4 text-[12px] font-medium text-[#707990]">
                              Notes
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2d3139]">
                          {entry.trades.map((trade) => (
                            <tr key={trade.id} className="hover:bg-[#22262f]/50">
                              <td className="py-2 px-4 text-[13px] text-[#707990]">
                                {formatTime(trade.entry_time)} - {formatTime(trade.exit_time)}
                              </td>
                              <td className="py-2 px-4">
                                <span className="font-mono font-bold text-white">
                                  {trade.ticker}
                                </span>
                              </td>
                              <td className="py-2 px-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
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
                              <td className="py-2 px-4 text-[13px] text-[#707990] text-right font-mono">
                                ${trade.entry_price.toFixed(2)}
                              </td>
                              <td className="py-2 px-4 text-[13px] text-[#707990] text-right font-mono">
                                ${trade.exit_price.toFixed(2)}
                              </td>
                              <td className="py-2 px-4 text-[13px] text-[#707990] text-right">
                                {trade.shares.toLocaleString()}
                              </td>
                              <td
                                className={`py-2 px-4 text-[13px] font-bold text-right ${
                                  trade.pnl >= 0 ? "text-[#00a449]" : "text-[#d91e2b]"
                                }`}
                              >
                                {formatCurrency(trade.pnl)}
                              </td>
                              <td className="py-2 px-4 text-center">
                                {editingNote?.tradeId === trade.id ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editingNote.note}
                                      onChange={(e) =>
                                        setEditingNote({ ...editingNote, note: e.target.value })
                                      }
                                      onKeyDown={(e) =>
                                        e.key === "Enter" && handleSaveNote(trade.id)
                                      }
                                      className="w-32 h-7 px-2 bg-[#22262f] border border-[#2d3139] rounded text-[12px] text-white focus:outline-none focus:border-[#00a449]/50"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleSaveNote(trade.id)}
                                      className="p-1 text-[#00a449] hover:bg-[#00a449]/10 rounded"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingNote(null)}
                                      className="p-1 text-[#707990] hover:text-white"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() =>
                                      setEditingNote({
                                        tradeId: trade.id,
                                        note: trade.notes || "",
                                      })
                                    }
                                    className={`p-1.5 rounded transition-colors ${
                                      trade.notes
                                        ? "text-[#00a449] hover:bg-[#00a449]/10"
                                        : "text-[#707990] hover:text-white hover:bg-[#22262f]"
                                    }`}
                                    title={trade.notes || "Add note"}
                                  >
                                    {trade.notes ? (
                                      <MessageSquare className="h-4 w-4" />
                                    ) : (
                                      <Edit3 className="h-4 w-4" />
                                    )}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
