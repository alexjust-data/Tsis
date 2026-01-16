"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useAuthStore } from "@/lib/auth";
import { reportsApi, type DetailedStats, type DaysTimesData, type DayStats, type HourStats, type PriceVolumeData, type PriceRangeStats, type VolumeRangeStats } from "@/lib/api";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Filter,
  Info,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

// Accent: softer/pastel green
const ACCENT = "#48d18a";

// Info tooltip component
function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-white/40 hover:text-white/70 transition-colors"
        aria-label="info"
      >
        <Info className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-50 w-[220px] p-3 rounded-lg bg-[#2d3139] border border-white/10 shadow-xl text-[12px] text-white/80 leading-relaxed">
          {text}
        </div>
      )}
    </div>
  );
}

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

function DayBarChart({
  title,
  subtitle,
  data,
  dataKey,
  formatValue,
  colorFn,
  infoText,
}: {
  title: string;
  subtitle?: string;
  data: DayStats[];
  dataKey: "total_pnl" | "trades" | "win_rate";
  formatValue?: (v: number) => string;
  colorFn?: (v: number) => string;
  infoText?: string;
}) {
  const values = data.map((d) => d[dataKey] || 0);
  const maxVal = Math.max(...values.map(Math.abs), 1);
  const defaultFormat = (v: number) => v.toFixed(0);
  const format = formatValue || defaultFormat;
  const defaultColor = (v: number) => (v >= 0 ? "#48d18a" : "#ef4444");
  const getColor = colorFn || defaultColor;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex items-start justify-between px-4 py-3 border-b border-white/10">
        <div>
          <div className="text-[13px] font-semibold tracking-wide uppercase text-white/90">{title}</div>
          {subtitle ? <div className="text-[12px] text-white/50 mt-0.5">{subtitle}</div> : null}
        </div>
        <InfoTooltip text={infoText || "Displays aggregated data grouped by entry day of week."} />
      </div>
      <div className="p-4 h-[220px] flex items-end gap-2">
        {data.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-white/40 text-[13px]">No data</div>
        ) : (
          data.map((item, idx) => {
            const val = item[dataKey] || 0;
            const label = item.day_name;
            const heightPct = (Math.abs(val) / maxVal) * 100;
            const color = getColor(val);

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1" title={`${label}: ${format(val)}`}>
                <div className="text-[11px] text-white/70">{format(val)}</div>
                <div className="w-full h-[140px] flex items-end justify-center">
                  <div
                    className="w-full max-w-[40px] rounded-t transition-all"
                    style={{ height: `${Math.max(heightPct, 4)}%`, backgroundColor: color }}
                  />
                </div>
                <div className="text-[10px] text-white/50 truncate max-w-full">{label.slice(0, 3)}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function HourlyChart({
  title,
  subtitle,
  data,
  dataKey,
  formatValue,
  colorFn,
  infoText,
}: {
  title: string;
  subtitle?: string;
  data: HourStats[];
  dataKey: "total_pnl" | "trades" | "win_rate";
  formatValue?: (v: number) => string;
  colorFn?: (v: number) => string;
  infoText?: string;
}) {
  const values = data.map((d) => Number(d[dataKey]) || 0);
  const maxVal = Math.max(...values.map(Math.abs), 1);
  const defaultFormat = (v: number) => v.toFixed(0);
  const format = formatValue || defaultFormat;
  const defaultColor = (v: number) => (v >= 0 ? "#48d18a" : "#ef4444");
  const getColor = colorFn || defaultColor;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex items-start justify-between px-4 py-3 border-b border-white/10">
        <div>
          <div className="text-[13px] font-semibold tracking-wide uppercase text-white/90">{title}</div>
          {subtitle ? <div className="text-[12px] text-white/50 mt-0.5">{subtitle}</div> : null}
        </div>
        <InfoTooltip text={infoText || "Displays aggregated data grouped by entry hour of day."} />
      </div>
      <div className="p-4 h-[220px] flex items-end gap-1 overflow-x-auto">
        {data.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-white/40 text-[13px]">No data</div>
        ) : (
          data.map((item, idx) => {
            const val = Number(item[dataKey]) || 0;
            const heightPct = (Math.abs(val) / maxVal) * 100;
            const color = getColor(val);

            return (
              <div key={idx} className="flex-1 min-w-[24px] flex flex-col items-center gap-1" title={`${item.hour_label}: ${format(val)}`}>
                <div className="text-[9px] text-white/70 whitespace-nowrap">{format(val)}</div>
                <div className="w-full h-[140px] flex items-end justify-center">
                  <div
                    className="w-full max-w-[20px] rounded-t transition-all"
                    style={{ height: `${Math.max(heightPct, 4)}%`, backgroundColor: color }}
                  />
                </div>
                <div className="text-[9px] text-white/50 whitespace-nowrap">{item.hour_label.replace(" ", "")}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function HorizontalBarChart({
  title,
  subtitle,
  data,
  dataKey,
  labelKey,
  formatValue,
  colorFn,
  infoText,
}: {
  title: string;
  subtitle?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  dataKey: string;
  labelKey: string;
  formatValue?: (v: number) => string;
  colorFn?: (v: number) => string;
  infoText?: string;
}) {
  const values = data.map((d) => Number(d[dataKey]) || 0);
  const maxVal = Math.max(...values.map(Math.abs), 1);
  const defaultFormat = (v: number) => v.toFixed(0);
  const format = formatValue || defaultFormat;
  const defaultColor = (v: number) => (v >= 0 ? "#48d18a" : "#ef4444");
  const getColor = colorFn || defaultColor;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex items-start justify-between px-4 py-3 border-b border-white/10">
        <div>
          <div className="text-[13px] font-semibold tracking-wide uppercase text-white/90">{title}</div>
          {subtitle ? <div className="text-[12px] text-white/50 mt-0.5">{subtitle}</div> : null}
        </div>
        <InfoTooltip text={infoText || "Displays aggregated data for the selected filter."} />
      </div>
      <div className="p-4 flex flex-col gap-2">
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-white/40 text-[13px]">No data</div>
        ) : (
          data.map((item, idx) => {
            const val = Number(item[dataKey]) || 0;
            const label = String(item[labelKey]);
            const widthPct = (Math.abs(val) / maxVal) * 100;
            const color = getColor(val);

            return (
              <div key={idx} className="flex items-center gap-3" title={`${label}: ${format(val)}`}>
                <div className="w-[80px] text-[11px] text-white/60 text-right shrink-0">{label}</div>
                <div className="flex-1 h-[22px] bg-white/5 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all"
                    style={{ width: `${Math.max(widthPct, 2)}%`, backgroundColor: color }}
                  />
                </div>
                <div className="w-[60px] text-[11px] text-white/70 text-right shrink-0">{format(val)}</div>
              </div>
            );
          })
        )}
      </div>
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

function formatCurrency(value: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Math.abs(value));
  return value < 0 ? `-${formatted}` : formatted;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatHoldTime(seconds: number): string {
  if (seconds === 0) return "n/a";
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function formatValue(value: number | null | undefined, formatter: (v: number) => string = String): string {
  if (value === null || value === undefined) return "n/a";
  return formatter(value);
}

// Stats help modal - Report Statistics page
function StatsHelpModal({ onClose }: { onClose: () => void }) {
  const helpItems = [
    { title: "Total gain/loss", description: "The total aggregate P&L for all trades matching the current filter." },
    { title: "Average daily gain/loss", description: "The average daily P&L for all trades matching the current filter. This is calculated as the total aggregate P&L divided by the number of days that had trades matching the current filter." },
    { title: "Average daily volume", description: "The average daily volume for each day with trades matching the current filter." },
    { title: "Average winning trade", description: "The average P&L of trades matching the current filter with a P&L greater than zero." },
    { title: "Average losing trade", description: "The average P&L of trades matching the current filter with a P&L less than zero." },
    { title: "System Quality Number (SQN)", description: "The SQN is a calculation developed by Van K Tharp. It can be interpreted as an overall \"grade\" for your trading system, and should generally not be deemed reliable with less than 30 trades." },
    { title: "Kelly Percentage", description: "The Kelly Criterion is a formula used to determine the optimal size of a series of bets. It represents the percentage of your capital you should risk on each trade." },
    { title: "K-Ratio", description: "A measure of the consistency of returns. Higher values indicate more consistent performance." },
    { title: "Profit Factor", description: "The ratio of gross profits to gross losses. A profit factor greater than 1 indicates a profitable system." },
    { title: "Trade P&L Standard Deviation", description: "A measure of the variability of trade P&L. Lower values indicate more consistent trade results." },
    { title: "Average Hold Time", description: "The average duration of trades, calculated separately for winning, losing, and scratch trades." },
    { title: "Max Consecutive Wins/Losses", description: "The longest streak of consecutive winning or losing trades." },
    { title: "Average Position MAE/MFE", description: "Maximum Adverse Excursion (MAE) is the maximum loss experienced during a trade. Maximum Favorable Excursion (MFE) is the maximum profit during a trade before exit." },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#1a1d24] border border-white/10 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Report Statistics</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          <p className="text-white/70 text-[14px] mb-4">
            The following statistics are shown in a table at the top of the Detailed report page. Only closed trades are reflected in the report statistics.
          </p>
          <div className="bg-[#00a449]/20 border border-[#00a449]/40 rounded-lg px-4 py-2 mb-6">
            <span className="text-[#00a449] font-medium text-[13px]">Important:</span>
            <span className="text-white/80 text-[13px] ml-2">Only closed trades are reflected in the report statistics.</span>
          </div>
          <div className="space-y-4">
            {helpItems.map((item, idx) => (
              <div key={idx}>
                <h3 className="text-white font-medium text-[15px] mb-1">{item.title}</h3>
                <p className="text-white/60 text-[13px] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsTable({ stats }: { stats: DetailedStats | null }) {
  const rows: Array<[string, string, string, string, string, string]> = stats ? [
    [
      "Total Gain/Loss", formatCurrency(stats.total_gain_loss),
      "Largest Gain", formatValue(stats.largest_gain, formatCurrency),
      "Largest Loss", formatValue(stats.largest_loss, formatCurrency)
    ],
    [
      "Average Daily Gain/Loss", formatCurrency(stats.average_daily_gain_loss),
      "Average Daily Volume", stats.average_daily_volume.toFixed(1),
      "Average Per-share Gain/Loss", formatCurrency(stats.average_per_share_gain_loss)
    ],
    [
      "Average Trade Gain/Loss", formatCurrency(stats.average_trade_gain_loss),
      "Average Winning Trade", formatCurrency(stats.average_winning_trade),
      "Average Losing Trade", formatCurrency(stats.average_losing_trade)
    ],
    [
      "Total Number of Trades", String(stats.total_number_of_trades),
      "Number of Winning Trades", String(stats.number_of_winning_trades),
      "Number of Losing Trades", String(stats.number_of_losing_trades)
    ],
    [
      "Average Hold Time (scratch trades)", formatHoldTime(stats.average_hold_time_scratch_trades_seconds),
      "Average Hold Time (winning trades)", formatHoldTime(stats.average_hold_time_winning_trades_seconds),
      "Average Hold Time (losing trades)", formatHoldTime(stats.average_hold_time_losing_trades_seconds)
    ],
    [
      "Number of Scratch Trades", String(stats.number_of_scratch_trades),
      "Max Consecutive Wins", String(stats.max_consecutive_wins),
      "Max Consecutive Losses", String(stats.max_consecutive_losses)
    ],
    [
      "Trade P&L Standard Deviation", formatValue(stats.trade_pnl_standard_deviation, (v) => formatCurrency(v)),
      "System Quality Number (SQN)", formatValue(stats.system_quality_number_sqn, (v) => v.toFixed(2)),
      "Probability of Random Chance", formatValue(stats.probability_of_random_chance, (v) => `${v.toFixed(1)}%`)
    ],
    [
      "Kelly Percentage", formatValue(stats.kelly_percentage, (v) => `${v.toFixed(1)}%`),
      "K-Ratio", formatValue(stats.k_ratio, (v) => v.toFixed(2)),
      "Profit factor", formatValue(stats.profit_factor, (v) => v.toFixed(2))
    ],
    [
      "Total Commissions", formatValue(stats.total_commissions, formatCurrency),
      "Total Fees", formatValue(stats.total_fees, formatCurrency),
      "", ""
    ],
    [
      "Average position MAE", formatValue(stats.average_position_mae, formatCurrency),
      "Average Position MFE", formatValue(stats.average_position_mfe, formatCurrency),
      "", ""
    ],
  ] : [
    ["Total Gain/Loss", "$0.00", "Largest Gain", "n/a", "Largest Loss", "n/a"],
    ["Average Daily Gain/Loss", "$0.00", "Average Daily Volume", "0", "Average Per-share Gain/Loss", "$0.00"],
    ["Average Trade Gain/Loss", "n/a", "Average Winning Trade", "n/a", "Average Losing Trade", "n/a"],
    ["Total Number of Trades", "0", "Number of Winning Trades", "0", "Number of Losing Trades", "0"],
    ["Average Hold Time (scratch trades)", "n/a", "Average Hold Time (winning trades)", "n/a", "Average Hold Time (losing trades)", "n/a"],
    ["Number of Scratch Trades", "0", "Max Consecutive Wins", "n/a", "Max Consecutive Losses", "n/a"],
    ["Trade P&L Standard Deviation", "n/a", "System Quality Number (SQN)", "n/a", "Probability of Random Chance", "n/a"],
    ["Kelly Percentage", "n/a", "K-Ratio", "n/a", "Profit factor", "n/a"],
    ["Total Commissions", "$0.00", "Total Fees", "$0.00", "", ""],
    ["Average position MAE", "n/a", "Average Position MFE", "n/a", "", ""],
  ];

  const [showStatsHelp, setShowStatsHelp] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <div className="text-[16px] font-semibold">Stats</div>
        <button
          onClick={() => setShowStatsHelp(true)}
          className="text-white/50 hover:text-white/80 transition-colors"
          aria-label="View stats help"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>
      {showStatsHelp && (
        <StatsHelpModal onClose={() => setShowStatsHelp(false)} />
      )}
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
  const { token } = useAuthStore();
  const [mainTab, setMainTab] = useState<MainTab>("detailed");
  const [timeTab, setTimeTab] = useState<TimeTab>("recent");
  const [range, setRange] = useState<"30" | "60" | "90">("30");
  const [detailedGroup, setDetailedGroup] = useState<DetailedGroup>("dt");

  // Data state
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [daysTimes, setDaysTimes] = useState<DaysTimesData | null>(null);
  const [priceVolume, setPriceVolume] = useState<PriceVolumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [symbol] = useState<string>("");

  // Load data on mount and when range changes
  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, range]);

  const loadData = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      // Calculate date range based on selected range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(range));

      const params = {
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      };

      const [statsData, daysTimesData, priceVolumeData] = await Promise.all([
        reportsApi.getDetailedStats(token, params),
        reportsApi.getDaysTimes(token, params),
        reportsApi.getPriceVolume(token, params),
      ]);
      setStats(statsData);
      setDaysTimes(daysTimesData);
      setPriceVolume(priceVolumeData);
    } catch (error) {
      console.error("Failed to load reports data:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-[#48d18a]" />
          </div>
        ) : mainTab === "detailed" ? (
          <>
            <StatsTable stats={stats} />

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
                <DayBarChart
                  title="PERFORMANCE BY DAY OF WEEK"
                  subtitle={`Last ${range} Days`}
                  data={daysTimes?.by_day || []}
                  dataKey="total_pnl"
                  formatValue={(v) => `$${v.toFixed(0)}`}
                  infoText="Displays the aggregate or average P&L for trades matching the current filter, grouped by entry day of week."
                />
                <DayBarChart
                  title="TRADE DISTRIBUTION BY DAY OF WEEK"
                  subtitle={`Last ${range} Days`}
                  data={daysTimes?.by_day || []}
                  dataKey="trades"
                  colorFn={() => "#3b82f6"}
                  infoText="Displays the number of trades matching the current filter, grouped by entry day of week."
                />
                <HourlyChart
                  title="PERFORMANCE BY HOUR OF DAY"
                  subtitle={`Last ${range} Days`}
                  data={daysTimes?.by_hour || []}
                  dataKey="total_pnl"
                  formatValue={(v) => `$${v.toFixed(0)}`}
                  infoText="Displays the aggregate or average P&L for trades matching the current filter, grouped by entry hour of day. Hours are specified in US Eastern time."
                />
                <HourlyChart
                  title="TRADE DISTRIBUTION BY HOUR OF DAY"
                  subtitle={`Last ${range} Days`}
                  data={daysTimes?.by_hour || []}
                  dataKey="trades"
                  colorFn={() => "#3b82f6"}
                  infoText="Displays the number of trades matching the current filter, grouped by entry hour of day. Hours are specified in US Eastern time."
                />
              </div>
            ) : detailedGroup === "ipv" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HorizontalBarChart
                  title="TRADE DISTRIBUTION BY PRICE"
                  subtitle={`Last ${range} Days`}
                  data={priceVolume?.by_price || []}
                  dataKey="trades"
                  labelKey="range_label"
                  colorFn={() => "#3b82f6"}
                  infoText="Displays the number of trades matching the current filter, grouped by entry price range."
                />
                <HorizontalBarChart
                  title="PERFORMANCE BY PRICE"
                  subtitle={`Last ${range} Days`}
                  data={priceVolume?.by_price || []}
                  dataKey="total_pnl"
                  labelKey="range_label"
                  formatValue={(v) => `$${v.toFixed(0)}`}
                  infoText="Displays the aggregate or average P&L for trades matching the current filter, grouped by entry price range."
                />
                <HorizontalBarChart
                  title="DISTRIBUTION BY VOLUME TRADED"
                  subtitle={`Last ${range} Days`}
                  data={priceVolume?.by_volume || []}
                  dataKey="trades"
                  labelKey="range_label"
                  colorFn={() => "#3b82f6"}
                  infoText="Displays the number of trades matching the current filter, grouped by shares/volume traded."
                />
                <HorizontalBarChart
                  title="PERFORMANCE BY VOLUME TRADED"
                  subtitle={`Last ${range} Days`}
                  data={priceVolume?.by_volume || []}
                  dataKey="total_pnl"
                  labelKey="range_label"
                  formatValue={(v) => `$${v.toFixed(0)}`}
                  infoText="Displays the aggregate or average P&L for trades matching the current filter, grouped by shares/volume traded."
                />
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
