"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Filter,
  Info,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

// Accent: softer/pastel green
const ACCENT = "#48d18a";

type MainTab = "overview" | "detailed" | "winloss" | "drawdown" | "compare" | "tagbreak" | "advanced";
type TimeTab = "recent" | "ymd" | "calendar";
type DetailedGroup = "dt" | "ipv" | "ins" | "mkt" | "wl" | "liq";

function Card({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex items-start justify-between px-4 py-3 border-b border-white/10">
        <div>
          <div className="text-[13px] font-semibold tracking-wide uppercase text-white/90">{title}</div>
          {subtitle ? <div className="text-[12px] text-white/50 mt-0.5">{subtitle}</div> : null}
        </div>
        <button className="text-white/40 hover:text-white/70 transition-colors" aria-label="info">
          <Info className="h-4 w-4" />
        </button>
      </div>
      <div className="h-[220px]" />
    </div>
  );
}

function PillTabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-lg bg-white/5 border border-white/10 p-1">
      {items.map((it) => (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          className={`px-3 py-1.5 text-[12px] rounded-md transition-colors ${
            value === it.value ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function SelectLike({
  label,
  value,
  placeholder,
  width,
  onClick,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  width?: number;
  onClick?: () => void;
}) {
  return (
    <div style={{ width: width ? `${width}px` : undefined }}>
      <div className="text-[12px] text-white/55 mb-1">{label}</div>
      <button
        type="button"
        onClick={onClick}
        className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white flex items-center justify-between hover:border-white/20 transition-colors"
      >
        <span className={value ? "text-white" : "text-white/50"}>{value ?? placeholder ?? "Select"}</span>
        <ChevronDown className="h-4 w-4 text-white/50" />
      </button>
    </div>
  );
}

function StatsTable() {
  // Placeholder values: wire these to your backend later.
  const rows: Array<[string, string, string, string, string, string]> = [
    ["Total Gain/Loss", "$0.00", "Largest Gain", "n/a", "Largest Loss", "n/a"],
    ["Average Daily Gain/Loss", "$0.00", "Average Daily Volume", "0", "Average Per-share Gain/Loss", "$0.00"],
    ["Average Trade Gain/Loss", "n/a", "Average Winning Trade", "n/a", "Average Losing Trade", "n/a"],
    ["Total Number of Trades", "0", "Number of Winning Trades", "0", "Number of Losing Trades", "0"],
    ["Average Hold Time (scratch trades)", "0", "Average Hold Time (winning trades)", "0", "Average Hold Time (losing trades)", "0"],
    ["Number of Scratch Trades", "0", "Max Consecutive Wins", "n/a", "Max Consecutive Losses", "n/a"],
    ["Trade P&L Standard Deviation", "n/a", "System Quality Number (SQN)", "n/a", "Probability of Random Chance", "n/a"],
    ["Kelly Percentage", "n/a", "K-Ratio", "n/a", "Profit factor", "n/a"],
    ["Total Commissions", "$0.00", "Total Fees", "$0.00", "", ""],
    ["Average position MAE", "$0.00", "Average Position MFE", "$0.00", "", ""],
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <div className="text-[16px] font-semibold">Stats</div>
        <Info className="h-4 w-4 text-white/50" />
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-0 rounded-lg overflow-hidden border border-white/10">
          {rows.map((r, idx) => (
            <div key={idx} className="grid grid-cols-2 md:grid-cols-2 col-span-3 bg-white/0">
              <div className="grid grid-cols-2 col-span-1 border-b border-white/10 border-r border-white/10">
                <div className="px-3 py-2 text-[13px] text-white/65">{r[0]}</div>
                <div className="px-3 py-2 text-[13px] text-white font-semibold text-right">{r[1]}</div>
              </div>
              <div className="grid grid-cols-2 col-span-1 border-b border-white/10 border-r border-white/10">
                <div className="px-3 py-2 text-[13px] text-white/65">{r[2]}</div>
                <div className="px-3 py-2 text-[13px] text-white font-semibold text-right">{r[3]}</div>
              </div>
              <div className="grid grid-cols-2 col-span-1 border-b border-white/10">
                <div className="px-3 py-2 text-[13px] text-white/65">{r[4]}</div>
                <div className="px-3 py-2 text-[13px] text-white font-semibold text-right">{r[5]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [mainTab, setMainTab] = useState<MainTab>("detailed");
  const [timeTab, setTimeTab] = useState<TimeTab>("recent");
  const [range, setRange] = useState<"30" | "60" | "90">("30");
  const [detailedGroup, setDetailedGroup] = useState<DetailedGroup>("dt");

  // Filter state (UI only for now)
  const [symbol] = useState<string>("");

  const mainTabs = useMemo(
    () =>
      [
        { value: "overview", label: "Overview" },
        { value: "detailed", label: "Detailed" },
        { value: "winloss", label: "Win vs Loss Days" },
        { value: "drawdown", label: "Drawdown" },
        { value: "compare", label: "Compare" },
        { value: "tagbreak", label: "Tag Breakdown" },
        { value: "advanced", label: "Advanced" },
      ] as const,
    []
  );

  const detailedGroups: Array<{ value: DetailedGroup; label: string }> = [
    { value: "dt", label: "Days/Times" },
    { value: "ipv", label: "Price/Volume" },
    { value: "ins", label: "Instrument" },
    { value: "mkt", label: "Market Behavior" },
    { value: "wl", label: "Win/Loss/Expectation" },
    { value: "liq", label: "Liquidity" },
  ];

  return (
    <div className="p-6">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[34px] leading-none font-semibold tracking-tight">Reports</h1>
        </div>

        <button className="h-10 px-4 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white/80 hover:text-white hover:border-white/20 transition-colors flex items-center gap-2">
          Custom Filters
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="mt-6">
        <div className="grid grid-cols-12 gap-4 items-end">
          <div className="col-span-12 md:col-span-2">
            <SelectLike label="Symbol" value={symbol || undefined} placeholder="Symbol" />
          </div>
          <div className="col-span-12 md:col-span-3">
            <SelectLike label="Tags" value={"Select"} />
          </div>
          <div className="col-span-12 md:col-span-2">
            <SelectLike label="Side" value={"All"} />
          </div>
          <div className="col-span-12 md:col-span-2">
            <SelectLike label="Duration" value={"All"} />
          </div>
          <div className="col-span-12 md:col-span-3">
            <div>
              <div className="text-[12px] text-white/55 mb-1">From - To</div>
              <div className="h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white/50 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-white/45" />
                <span>From - To</span>
              </div>
            </div>
          </div>

          <div className="col-span-12 flex gap-3 mt-2">
            <button className="h-10 px-4 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white/85 hover:border-white/20 transition-colors flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-white/60" />
              Advanced
            </button>
            <button className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-colors flex items-center justify-center" aria-label="reset">
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              className="h-10 w-10 rounded-lg text-[#06130b] flex items-center justify-center"
              style={{ backgroundColor: ACCENT }}
              aria-label="apply"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="mt-6 border-b border-white/10">
        <div className="flex items-center gap-8">
          {mainTabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setMainTab(t.value)}
              className={`py-3 text-[13px] font-medium transition-colors ${
                mainTab === t.value ? "text-white" : "text-white/70 hover:text-white"
              }`}
              style={mainTab === t.value ? { borderBottom: `2px solid ${ACCENT}`, marginBottom: "-1px" } : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary controls row (Detailed-like) */}
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-6">
          <SelectLike label="P&L Type" value="Gross" width={140} />
          <SelectLike label="View mode" value="$ Value" width={140} />
          <SelectLike label="Report type" value="Aggregate P&L" width={180} />
        </div>

        <PillTabs
          value={range}
          onChange={setRange}
          items={[
            { value: "30", label: "30 Days" },
            { value: "60", label: "60 Days" },
            { value: "90", label: "90 Days" },
          ]}
        />
      </div>

      {/* Time Tabs */}
      <div className="mt-4">
        <PillTabs
          value={timeTab}
          onChange={setTimeTab}
          items={[
            { value: "recent", label: "Recent" },
            { value: "ymd", label: "Year/Month/Day" },
            { value: "calendar", label: "Calendar" },
          ]}
        />
      </div>

      {/* Content */}
      <div className="mt-6 space-y-6">
        {mainTab === "detailed" ? (
          <>
            <StatsTable />

            <div className="flex justify-center">
              <div className="inline-flex rounded-lg bg-white/5 border border-white/10 p-1">
                {detailedGroups.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setDetailedGroup(g.value)}
                    className={`px-4 py-2 text-[13px] rounded-md transition-colors ${
                      detailedGroup === g.value ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Group Panels: placeholders that match structure */}
            {detailedGroup === "liq" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="TRADE DISTRIBUTION BY ALL SHARES ADDING LIQUIDITY" />
                <Card title="PERFORMANCE BY ALL SHARES ADDING LIQUIDITY" />
              </div>
            ) : detailedGroup === "dt" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="P&L BY DAY" subtitle={`Last ${range} Days`} />
                <Card title="WIN % BY DAY" subtitle={`Last ${range} Days`} />
                <Card title="TRADES BY DAY" subtitle={`Last ${range} Days`} />
                <Card title="AVG P&L BY DAY" subtitle={`Last ${range} Days`} />
              </div>
            ) : detailedGroup === "ipv" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="P&L BY PRICE" subtitle={`Last ${range} Days`} />
                <Card title="WIN % BY PRICE" subtitle={`Last ${range} Days`} />
                <Card title="P&L BY VOLUME" subtitle={`Last ${range} Days`} />
                <Card title="TRADES BY VOLUME" subtitle={`Last ${range} Days`} />
              </div>
            ) : detailedGroup === "ins" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="P&L BY INSTRUMENT" subtitle={`Last ${range} Days`} />
                <Card title="WIN % BY INSTRUMENT" subtitle={`Last ${range} Days`} />
              </div>
            ) : detailedGroup === "mkt" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="P&L BY MARKET BEHAVIOR" subtitle={`Last ${range} Days`} />
                <Card title="TRADES BY MARKET BEHAVIOR" subtitle={`Last ${range} Days`} />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="WIN DISTRIBUTION" subtitle={`Last ${range} Days`} />
                <Card title="LOSS DISTRIBUTION" subtitle={`Last ${range} Days`} />
                <Card title="EXPECTATION" subtitle={`Last ${range} Days`} />
                <Card title="RISK / REWARD" subtitle={`Last ${range} Days`} />
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/70 text-[13px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>UI scaffold ready for: {mainTab}</span>
            </div>
            <div className="mt-2 text-white/50">
              Connect your backend metrics + charts to fill this section.
            </div>
          </div>
        )}
      </div>

      {/* Help bubble */}
      <div className="fixed bottom-6 right-6">
        <button
          className="h-12 px-5 rounded-full text-[#06130b] font-semibold flex items-center gap-2 shadow-lg"
          style={{ backgroundColor: ACCENT }}
        >
          Help
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-black/15">
            ?
          </span>
        </button>
      </div>
    </div>
  );
}
