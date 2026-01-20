"use client";

import { useState } from "react";
import { ExternalLink, Tag, X } from "lucide-react";

interface TickerInfoProps {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function TickerInfo({
  symbol = "SMX",
  companyName = "SMX (Security Matters) Public Limited Company",
  price = 33.2001,
  change = 13.9201,
  changePercent = 72.20,
}: TickerInfoProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "financials" | "sec" | "notes">("overview");
  const [tags, setTags] = useState<string[]>([]);

  const isPositive = change >= 0;

  return (
    <div className="bg-[#131722] border-t border-[#2a2e39]">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#2a2e39]">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            activeTab === "overview"
              ? "bg-[#2962ff] text-white"
              : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("financials")}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            activeTab === "financials"
              ? "bg-[#2962ff] text-white"
              : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
          }`}
        >
          Financial metrics
        </button>
        <button
          onClick={() => setActiveTab("sec")}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            activeTab === "sec"
              ? "bg-[#2962ff] text-white"
              : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
          }`}
        >
          SEC Filings
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            activeTab === "notes"
              ? "bg-[#2962ff] text-white"
              : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
          }`}
        >
          Notes
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "overview" && (
          <div className="flex items-start gap-4">
            {/* Company logo placeholder */}
            <div className="w-14 h-14 bg-[#1e222d] rounded-lg flex items-center justify-center text-[#787b86] shrink-0">
              <span className="text-lg font-bold">{symbol[0]}</span>
            </div>

            <div className="flex-1 min-w-0">
              {/* Symbol and name */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-lg font-bold text-[#d1d4dc]">{symbol}</span>
                <span className="text-sm text-[#787b86] truncate">{companyName}</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-[#d1d4dc]">${price.toFixed(4)}</span>
                <span className={`text-sm font-medium ${isPositive ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                  {isPositive ? "+" : ""}{change.toFixed(4)} ({changePercent.toFixed(2)}%)
                </span>
              </div>

              {/* Tags */}
              <div className="mt-3 flex items-center gap-2">
                <button className="flex items-center gap-1 px-2 py-1 text-xs text-[#787b86] bg-[#1e222d] hover:bg-[#2a2e39] rounded transition-colors">
                  <Tag className="h-3 w-3" />
                  No tags selected
                </button>
                <button className="p-1 text-[#787b86] hover:text-[#d1d4dc]">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "financials" && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[11px] text-[#787b86] uppercase mb-1">Market Cap</p>
              <p className="text-sm text-[#d1d4dc]">--</p>
            </div>
            <div>
              <p className="text-[11px] text-[#787b86] uppercase mb-1">Shares Out</p>
              <p className="text-sm text-[#d1d4dc]">--</p>
            </div>
            <div>
              <p className="text-[11px] text-[#787b86] uppercase mb-1">Shares Float</p>
              <p className="text-sm text-[#d1d4dc]">--</p>
            </div>
          </div>
        )}

        {activeTab === "sec" && (
          <div className="text-center py-4 text-[#787b86] text-sm">
            No SEC filings available
          </div>
        )}

        {activeTab === "notes" && (
          <div>
            <textarea
              placeholder="Add your trading notes here..."
              className="w-full h-20 bg-[#1e222d] border border-[#2a2e39] rounded-lg p-3 text-sm text-[#d1d4dc] placeholder:text-[#4c5263] resize-none focus:outline-none focus:border-[#2962ff]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
