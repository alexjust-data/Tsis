"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import { tradesApi, type TradeCreate } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import {
  ArrowLeft,
  Save,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
} from "lucide-react";
import Link from "next/link";

export default function NewTradePage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<TradeCreate>({
    date: new Date().toISOString().split("T")[0],
    ticker: "",
    side: "long",
    entry_price: 0,
    exit_price: 0,
    shares: 0,
    pnl: 0,
    entry_time: "",
    exit_time: "",
    commissions: 0,
    notes: "",
    setup: "",
  });

  // Calculate P&L automatically
  const calculatePnl = () => {
    if (formData.entry_price && formData.exit_price && formData.shares) {
      let pnl = 0;
      if (formData.side === "long") {
        pnl = (formData.exit_price - formData.entry_price) * formData.shares;
      } else {
        pnl = (formData.entry_price - formData.exit_price) * formData.shares;
      }
      pnl -= formData.commissions || 0;
      setFormData({ ...formData, pnl: Math.round(pnl * 100) / 100 });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await tradesApi.create(token, formData);
      router.push("/trades");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trade");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    });
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/trades"
            className="p-2 text-[#707990] hover:text-white hover:bg-[#22262f] rounded transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">New Trade</h1>
            <p className="text-[13px] text-[#707990] mt-1">
              Manually add a new trade to your journal
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-3xl">
          <div className="bg-[#14161d] rounded border border-[#2d3139] p-6 space-y-6">
            {/* Date & Ticker Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-[#707990] mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full h-10 px-3 bg-[#22262f] border border-[#2d3139] rounded text-[14px] text-white focus:outline-none focus:border-[#00a449]/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] text-[#707990] mb-2">
                  Ticker
                </label>
                <input
                  type="text"
                  name="ticker"
                  value={formData.ticker}
                  onChange={handleChange}
                  placeholder="e.g., AAPL"
                  required
                  className="w-full h-10 px-3 bg-[#22262f] border border-[#2d3139] rounded text-[14px] text-white placeholder-[#707990] font-mono uppercase focus:outline-none focus:border-[#00a449]/50 transition-colors"
                />
              </div>
            </div>

            {/* Side Selection */}
            <div>
              <label className="block text-[13px] text-[#707990] mb-2">
                Side
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, side: "long" })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded border transition-colors ${
                    formData.side === "long"
                      ? "bg-[#00a449]/15 border-[#00a449] text-[#00a449]"
                      : "bg-[#22262f] border-[#2d3139] text-[#707990] hover:border-[#707990]"
                  }`}
                >
                  <ArrowUpRight className="h-5 w-5" />
                  <span className="font-medium">LONG</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, side: "short" })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded border transition-colors ${
                    formData.side === "short"
                      ? "bg-[#d91e2b]/15 border-[#d91e2b] text-[#d91e2b]"
                      : "bg-[#22262f] border-[#2d3139] text-[#707990] hover:border-[#707990]"
                  }`}
                >
                  <ArrowDownRight className="h-5 w-5" />
                  <span className="font-medium">SHORT</span>
                </button>
              </div>
            </div>

            {/* Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-[#707990] mb-2">
                  Entry Time
                </label>
                <input
                  type="time"
                  name="entry_time"
                  value={formData.entry_time}
                  onChange={handleChange}
                  className="w-full h-10 px-3 bg-[#22262f] border border-[#2d3139] rounded text-[14px] text-white focus:outline-none focus:border-[#00a449]/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] text-[#707990] mb-2">
                  Exit Time
                </label>
                <input
                  type="time"
                  name="exit_time"
                  value={formData.exit_time}
                  onChange={handleChange}
                  className="w-full h-10 px-3 bg-[#22262f] border border-[#2d3139] rounded text-[14px] text-white focus:outline-none focus:border-[#00a449]/50 transition-colors"
                />
              </div>
            </div>

            {/* Prices Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13px] text-[#707990] mb-2">
                  Entry Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707990]">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    name="entry_price"
                    value={formData.entry_price || ""}
                    onChange={handleChange}
                    onBlur={calculatePnl}
                    required
                    className="w-full h-10 pl-7 pr-3 bg-[#22262f] border border-[#2d3139] rounded text-[14px] text-white font-mono focus:outline-none focus:border-[#00a449]/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-[#707990] mb-2">
                  Exit Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707990]">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    name="exit_price"
                    value={formData.exit_price || ""}
                    onChange={handleChange}
                    onBlur={calculatePnl}
                    required
                    className="w-full h-10 pl-7 pr-3 bg-[#22262f] border border-[#2d3139] rounded text-[14px] text-white font-mono focus:outline-none focus:border-[#00a449]/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-[#707990] mb-2">
                  Shares
                </label>
                <input
                  type="number"
                  name="shares"
                  value={formData.shares || ""}
                  onChange={handleChange}
                  onBlur={calculatePnl}
                  required
                  className="w-full h-10 px-3 bg-[#22262f] border border-[#2d3139] rounded text-[14px] text-white font-mono focus:outline-none focus:border-[#00a449]/50 transition-colors"
                />
              </div>
            </div>

            {/* P&L and Commissions Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-[#707990] mb-2">
                  Commissions
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707990]">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    name="commissions"
                    value={formData.commissions || ""}
                    onChange={handleChange}
                    onBlur={calculatePnl}
                    className="w-full h-10 pl-7 pr-3 bg-[#22262f] border border-[#2d3139] rounded text-[14px] text-white font-mono focus:outline-none focus:border-[#00a449]/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-[#707990] mb-2 flex items-center gap-2">
                  P&L (Net)
                  <button
                    type="button"
                    onClick={calculatePnl}
                    className="text-[#00a449] hover:text-[#00a449]/80"
                    title="Calculate P&L"
                  >
                    <Calculator className="h-4 w-4" />
                  </button>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707990]">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    name="pnl"
                    value={formData.pnl || ""}
                    onChange={handleChange}
                    required
                    className={`w-full h-10 pl-7 pr-3 bg-[#22262f] border border-[#2d3139] rounded text-[14px] font-mono focus:outline-none focus:border-[#00a449]/50 transition-colors ${
                      formData.pnl >= 0 ? "text-[#00a449]" : "text-[#d91e2b]"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Setup */}
            <div>
              <label className="block text-[13px] text-[#707990] mb-2">
                Setup / Strategy
              </label>
              <input
                type="text"
                name="setup"
                value={formData.setup}
                onChange={handleChange}
                placeholder="e.g., Breakout, Reversal, Gap Fill"
                className="w-full h-10 px-3 bg-[#22262f] border border-[#2d3139] rounded text-[14px] text-white placeholder-[#707990] focus:outline-none focus:border-[#00a449]/50 transition-colors"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[13px] text-[#707990] mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any notes about this trade..."
                rows={4}
                className="w-full px-3 py-2 bg-[#22262f] border border-[#2d3139] rounded text-[14px] text-white placeholder-[#707990] focus:outline-none focus:border-[#00a449]/50 transition-colors resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-[#d91e2b]/15 border border-[#d91e2b]/30 rounded">
                <p className="text-[13px] text-[#d91e2b]">{error}</p>
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Link
                href="/trades"
                className="px-4 py-2 text-[14px] text-[#707990] hover:text-white transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#00a449] hover:bg-[#00a449]/90 text-white text-[14px] font-medium rounded transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Trade"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
