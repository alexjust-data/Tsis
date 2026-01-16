"use client";

import { useEffect, useMemo, useState } from "react";
// NOTE: /reports has its own layout (src/app/reports/layout.tsx) to match the reference UI.
import { useAuthStore } from "@/lib/auth";
import { tradesApi, type Trade } from "@/lib/api";
import { CalendarDays, Check, ChevronDown, SlidersHorizontal, Trash2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

const UI = {
  // Tuned to closely match the reference UI (dark, slightly blue-tinted)
  page: "#0b1220",
  panel: "#161b24",   // cards / controls
  panel2: "#121826",  // chart wells
  border: "#273041",
  text: "#e6edf6",
  muted: "#7c889e",
  accent: "#00a449", // keep your brand green
};

function cls(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function formatCurrency(value: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value));
  return value < 0 ? `-${formatted}` : formatted;
}

function TopSelect({ label, value, onChange, options, width = 150 }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; width?: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px]" style={{ color: UI.muted }}>{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cls(
            "h-10 rounded-md px-3 pr-9 text-[13px] outline-none",
            "border",
          )}
          style={{ width, background: "#1a2232", borderColor: UI.border, color: UI.text }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2" style={{ color: UI.muted }} />
      </div>
    </div>
  );
}

function TopInput({ label, placeholder, value, onChange, width = 150 }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; width?: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px]" style={{ color: UI.muted }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-md px-3 text-[13px] outline-none border"
        style={{ width, background: "#1a2232", borderColor: UI.border, color: UI.text }}
      />
    </div>
  );
}

type MainTab = "overview" | "detailed" | "winloss" | "drawdown" | "compare" | "tags" | "advanced";
type SubMode = "recent" | "yearMonthDay" | "calendar";

export default function ReportsPage() {
  const { token } = useAuthStore();

  // Data
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [tab, setTab] = useState<MainTab>("overview");
  const [subMode, setSubMode] = useState<SubMode>("recent");

  // “Screenshot-like” filters
  const [symbol, setSymbol] = useState("");
  const [tag, setTag] = useState("all");
  const [side, setSide] = useState("all");
  const [duration, setDuration] = useState("all");
  const [dateRange, setDateRange] = useState("");
  const [daysRange, setDaysRange] = useState<30 | 60 | 90>(30);

  // “P&L type / view mode / report type” row
  const [plType, setPlType] = useState("gross");
  const [viewMode, setViewMode] = useState("value");
  const [reportType, setReportType] = useState("aggregate");

  useEffect(() => {
    if (!token) return;
    (async () => {
      setIsLoading(true);
      try {
        const data = await tradesApi.getAll(token);
        setTrades(data);
      } catch (e) {
        console.error("Failed to load trades:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token]);

  const filteredTrades = useMemo(() => {
    let out = [...trades];
    if (symbol.trim()) {
      const s = symbol.trim().toUpperCase();
      out = out.filter((t) => (t.ticker || "").toUpperCase().includes(s));
    }
    // dateRange parsing can be wired later (kept as a UI control to match reference)
    if (side !== "all") out = out.filter((t) => t.side === side);
    // duration/tag are placeholders for now (you can wire them later)
    return out;
  }, [trades, symbol, side]);

  const dailySeries = useMemo(() => {
    if (!filteredTrades.length) return [] as { date: string; pnl: number; cumulative: number; trades: number; winPct: number }[];

    // group by day
    const byDay: Record<string, { pnl: number; trades: number; winners: number }> = {};
    for (const t of filteredTrades) {
      const day = (t.date || "").split("T")[0];
      if (!day) continue;
      if (!byDay[day]) byDay[day] = { pnl: 0, trades: 0, winners: 0 };
      byDay[day].pnl += t.pnl;
      byDay[day].trades += 1;
      if (t.pnl > 0) byDay[day].winners += 1;
    }

    // sort and cum
    const days = Object.keys(byDay).sort();
    let cum = 0;
    const res = days.map((d) => {
      const v = byDay[d];
      cum += v.pnl;
      return {
        date: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        pnl: v.pnl,
        cumulative: cum,
        trades: v.trades,
        winPct: v.trades ? (v.winners / v.trades) * 100 : 0,
      };
    });
    return res;
  }, [filteredTrades]);

  const seriesN = useMemo(() => dailySeries.slice(-daysRange), [dailySeries, daysRange]);

  const resetFilters = () => {
    setSymbol("");
    setTag("all");
    setSide("all");
    setDuration("all");
    setDateRange("");
    setDaysRange(30);
  };

  return (
    <div className="min-h-screen" style={{ background: UI.page }}>
      <div className="px-8 pt-6 pb-10">
          {/* Title */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[28px] font-semibold" style={{ color: UI.text }}>Reports</h1>
            <div className="flex items-center gap-3">
              <button
                className="h-10 px-4 rounded-md border text-[13px] flex items-center gap-2"
                style={{ background: UI.panel, borderColor: UI.border, color: UI.text }}
              >
                Custom Filters <ChevronDown className="h-4 w-4" style={{ color: UI.muted }} />
              </button>
            </div>
          </div>

          {/* Filters row (screenshot-like) */}
          <div className="flex flex-wrap items-end gap-4">
            <TopInput label="Symbol" placeholder="Symbol" value={symbol} onChange={setSymbol} width={130} />
            <TopSelect
              label="Tags"
              value={tag}
              onChange={setTag}
              width={150}
              options={[
                { value: "all", label: "Select" },
                { value: "A+", label: "A+" },
                { value: "B", label: "B" },
              ]}
            />
            <TopSelect
              label="Side"
              value={side}
              onChange={setSide}
              width={150}
              options={[
                { value: "all", label: "All" },
                { value: "long", label: "Long" },
                { value: "short", label: "Short" },
              ]}
            />
            <TopSelect
              label="Duration"
              value={duration}
              onChange={setDuration}
              width={150}
              options={[
                { value: "all", label: "All" },
                { value: "intraday", label: "Intraday" },
                { value: "multiday", label: "Multi-day" },
              ]}
            />

            {/* From - To (single control like reference) */}
            <div className="flex flex-col gap-1">
              <span className="text-[12px]" style={{ color: UI.muted }}>From - To</span>
              <div className="relative">
                <CalendarDays className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.muted }} />
                <input
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  placeholder="From - To"
                  className="h-10 w-[260px] rounded-md pl-10 pr-3 text-[13px] outline-none border"
                  style={{ background: "#1a2232", borderColor: UI.border, color: UI.text }}
                />
              </div>
            </div>

            <button
              className="h-10 px-4 rounded-md border text-[13px] flex items-center gap-2"
              style={{ background: "#1a2232", borderColor: UI.border, color: UI.text }}
              type="button"
              title="Advanced"
            >
              <SlidersHorizontal className="h-4 w-4" style={{ color: UI.muted }} />
              Advanced
            </button>
            <button
              className="h-10 w-10 rounded-md border flex items-center justify-center"
              style={{ background: "#1a2232", borderColor: UI.border, color: UI.text }}
              type="button"
              onClick={resetFilters}
              title="Reset"
            >
              <Trash2 className="h-4 w-4" style={{ color: UI.muted }} />
            </button>
            <button
              className="h-10 w-10 rounded-md flex items-center justify-center"
              style={{ background: UI.accent, color: "white" }}
              type="button"
              title="Apply"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs row */}
          <div className="mt-6 border-b" style={{ borderColor: UI.border }}>
            <div className="flex items-center gap-7">
              {(
                [
                  ["overview", "Overview"],
                  ["detailed", "Detailed"],
                  ["winloss", "Win vs Loss Days"],
                  ["drawdown", "Drawdown"],
                  ["compare", "Compare"],
                  ["tags", "Tag Breakdown"],
                  ["advanced", "Advanced"],
                ] as Array<[MainTab, string]>
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cls(
                    "py-3 text-[13px] font-semibold border-b-2 -mb-px",
                    tab === key ? "" : "border-transparent",
                  )}
                  style={{
                    color: tab === key ? UI.accent : UI.text,
                    borderColor: tab === key ? UI.accent : "transparent",
                    opacity: key === "overview" || key === "detailed" ? 1 : 0.85,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* P&L control row */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <TopSelect
                label="P&L Type"
                value={plType}
                onChange={setPlType}
                width={120}
                options={[
                  { value: "gross", label: "Gross" },
                  { value: "net", label: "Net" },
                ]}
              />
              <TopSelect
                label="View mode"
                value={viewMode}
                onChange={setViewMode}
                width={120}
                options={[
                  { value: "value", label: "$ Value" },
                  { value: "percent", label: "%" },
                ]}
              />
              <TopSelect
                label="Report type"
                value={reportType}
                onChange={setReportType}
                width={170}
                options={[
                  { value: "aggregate", label: "Aggregate P&L" },
                  { value: "bySymbol", label: "By Symbol" },
                ]}
              />
            </div>
          </div>

          {/* Sub-report toggle row */}
          {/* Sub-tabs like reference */}
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center rounded-md border overflow-hidden" style={{ borderColor: UI.border, background: "#1a2232" }}>
              {(
                [
                  ["recent", "Recent"],
                  ["yearMonthDay", "Year/Month/Day"],
                  ["calendar", "Calendar"],
                ] as Array<[SubMode, string]>
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setSubMode(k)}
                  className="h-9 px-4 text-[13px] font-medium"
                  style={{
                    background: subMode === k ? "#2a3344" : "transparent",
                    color: UI.text,
                    opacity: subMode === k ? 1 : 0.85,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 30/60/90 pill group on the right (matches reference placement) */}
            <div className="flex items-center rounded-md border overflow-hidden" style={{ borderColor: UI.border, background: "#1a2232" }}>
              {[30, 60, 90].map((n) => (
                <button
                  key={n}
                  onClick={() => setDaysRange(n as 30 | 60 | 90)}
                  className="h-9 px-4 text-[13px] font-medium"
                  style={{
                    background: daysRange === n ? "#2a3344" : "transparent",
                    color: UI.text,
                    opacity: daysRange === n ? 1 : 0.85,
                  }}
                >
                  {n} Days
                </button>
              ))}
            </div>

          </div>

          {/* Cards */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ReportCard title={`GROSS DAILY P&L (${daysRange} Days)`}>
              <ChartWrap loading={isLoading} empty={!seriesN.length}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={seriesN} margin={{ left: 4, right: 16, top: 8, bottom: 8 }}>
                    <CartesianGrid stroke={UI.border} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: UI.muted, fontSize: 11 }} axisLine={{ stroke: UI.border }} tickLine={false} />
                    <YAxis tick={{ fill: UI.muted, fontSize: 11 }} axisLine={{ stroke: UI.border }} tickLine={false} tickFormatter={(v) => (typeof v === "number" ? v.toFixed(0) : String(v))} />
                    <Tooltip
                      contentStyle={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.text, fontSize: 12 }}
                      formatter={(v: any) => formatCurrency(Number(v))}
                      labelStyle={{ color: UI.muted }}
                    />
                    <Bar dataKey="pnl" fill={UI.accent} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartWrap>
            </ReportCard>

            <ReportCard title={`GROSS CUMULATIVE P&L (${daysRange} Days)`}>
              <ChartWrap loading={isLoading} empty={!seriesN.length}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={seriesN} margin={{ left: 4, right: 16, top: 8, bottom: 8 }}>
                    <CartesianGrid stroke={UI.border} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: UI.muted, fontSize: 11 }} axisLine={{ stroke: UI.border }} tickLine={false} />
                    <YAxis tick={{ fill: UI.muted, fontSize: 11 }} axisLine={{ stroke: UI.border }} tickLine={false} tickFormatter={(v) => (typeof v === "number" ? v.toFixed(0) : String(v))} />
                    <Tooltip
                      contentStyle={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.text, fontSize: 12 }}
                      formatter={(v: any) => formatCurrency(Number(v))}
                      labelStyle={{ color: UI.muted }}
                    />
                    <Line type="monotone" dataKey="cumulative" stroke={UI.accent} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartWrap>
            </ReportCard>

            <ReportCard title={`DAILY VOLUME (${daysRange} Days)`}>
              <ChartWrap loading={isLoading} empty={!seriesN.length}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={seriesN} margin={{ left: 4, right: 16, top: 8, bottom: 8 }}>
                    <CartesianGrid stroke={UI.border} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: UI.muted, fontSize: 11 }} axisLine={{ stroke: UI.border }} tickLine={false} />
                    <YAxis tick={{ fill: UI.muted, fontSize: 11 }} axisLine={{ stroke: UI.border }} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.text, fontSize: 12 }}
                      formatter={(v: any) => `${v} trades`}
                      labelStyle={{ color: UI.muted }}
                    />
                    <Bar dataKey="trades" fill={UI.accent} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartWrap>
            </ReportCard>

            <ReportCard title={`WIN % (${daysRange} Days)`}>
              <ChartWrap loading={isLoading} empty={!seriesN.length}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={seriesN} margin={{ left: 4, right: 16, top: 8, bottom: 8 }}>
                    <CartesianGrid stroke={UI.border} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: UI.muted, fontSize: 11 }} axisLine={{ stroke: UI.border }} tickLine={false} />
                    <YAxis tick={{ fill: UI.muted, fontSize: 11 }} axisLine={{ stroke: UI.border }} tickLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.text, fontSize: 12 }}
                      formatter={(v: any) => `${Number(v).toFixed(1)}%`}
                      labelStyle={{ color: UI.muted }}
                    />
                    <Line type="monotone" dataKey="winPct" stroke={UI.accent} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartWrap>
            </ReportCard>
          </div>
        </div>
      </div>
  );
}

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: UI.panel, borderColor: UI.border }}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-[13px] font-semibold tracking-wide" style={{ color: UI.text }}>{title}</div>
        <div className="w-6 h-6 rounded-full border flex items-center justify-center" style={{ borderColor: UI.border, color: UI.muted }}>
          i
        </div>
      </div>
      <div className="px-3 pb-3">{children}</div>
    </div>
  );
}

function ChartWrap({ loading, empty, children }: { loading: boolean; empty: boolean; children: React.ReactNode }) {
  if (loading) {
    return (
      <div className="h-[260px] rounded-lg border flex items-center justify-center" style={{ background: UI.panel2, borderColor: UI.border }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: UI.accent }} />
      </div>
    );
  }
  if (empty) {
    return (
      <div className="h-[260px] rounded-lg border flex items-center justify-center" style={{ background: UI.panel2, borderColor: UI.border }}>
        <div className="text-[13px]" style={{ color: UI.muted }}>
          No data for this range.
        </div>
      </div>
    );
  }
  return (
    <div className="h-[260px] rounded-lg border" style={{ background: UI.panel2, borderColor: UI.border }}>
      {children}
    </div>
  );
}
