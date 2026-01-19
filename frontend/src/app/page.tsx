"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, Cpu, LineChart } from "lucide-react";
import ScreenerTable from "@/components/screener/ScreenerTable";

// Mock data for screeners
const SCREEN_LONG_DATA = [
  { ticker: "JAGX", last: 1.43, change: 87.05, volume: "160.40M", signal: "Top Gainers 1M" },
  { ticker: "AUUD", last: 0.94, change: -7.43, volume: "1.06M", signal: "Top Gainers 1M" },
  { ticker: "OCG", last: 1.80, change: -18.99, volume: "11.00M", signal: "Top Gainers 1M" },
  { ticker: "TII", last: 4.07, change: 3.56, volume: "6.83M", signal: "Top Gainers 1M" },
  { ticker: "ICON", last: 1.94, change: -19.50, volume: "5.16M", signal: "Top Gainers 15M" },
  { ticker: "PN", last: 0.75, change: -7.57, volume: "31.43M", signal: "Top Gainers 15M" },
  { ticker: "SPHL", last: 7.43, change: -57.32, volume: "4.07M", signal: "Top Gainers 15M" },
  { ticker: "SBEV", last: 0.89, change: 15.47, volume: "10.67M", signal: "Top Gainers 15M" },
  { ticker: "CCHH", last: 0.45, change: 1.78, volume: "3.59M", signal: "Top Gainers 1H" },
  { ticker: "POLA", last: 1.68, change: 16.67, volume: "4.07M", signal: "Top Gainers 1H" },
  { ticker: "IVF", last: 0.81, change: 0.11, volume: "61.51M", signal: "Top Gainers 4H" },
  { ticker: "NTCL", last: 0.36, change: -9.42, volume: "3.25M", signal: "Top Gainers 4H" },
  { ticker: "ABAT", last: 4.83, change: -0.72, volume: "5.45M", signal: "Short Sale Restricted" },
  { ticker: "ABUS", last: 4.06, change: -13.62, volume: "8.52M", signal: "Short Sale Restricted" },
  { ticker: "ACCL", last: 2.50, change: -16.39, volume: "24.52M", signal: "Short Sale Restricted" },
];

const SCREEN_SHORT_DATA = [
  { ticker: "CCHH", last: 0.45, change: 1.78, volume: "3.59M", signal: "Top Losers 1M" },
  { ticker: "CISS", last: 0.13, change: -6.64, volume: "8.13M", signal: "Top Losers 1M" },
  { ticker: "GIBO", last: 1.98, change: -5.71, volume: "2.22M", signal: "Top Losers 1M" },
  { ticker: "VERO", last: 8.00, change: 459.44, volume: "308.92M", signal: "Top Losers 1M" },
  { ticker: "PTLE", last: 0.13, change: 20.65, volume: "161.51M", signal: "Top Losers 15M" },
  { ticker: "TNMG", last: 3.91, change: 65.68, volume: "27.76M", signal: "Top Losers 15M" },
  { ticker: "CELZ", last: 2.00, change: 5.26, volume: "267.67K", signal: "Top Losers 15M" },
  { ticker: "DXST", last: 1.50, change: 0.00, volume: "4.15M", signal: "Top Losers 15M" },
  { ticker: "HWH", last: 1.78, change: -5.82, volume: "601.51K", signal: "Top Losers 1H" },
  { ticker: "AUID", last: 1.51, change: -11.70, volume: "12.92M", signal: "Top Losers 1H" },
  { ticker: "SVRE", last: 1.67, change: 15.97, volume: "40.11M", signal: "Top Losers 4H" },
  { ticker: "TRNR", last: 0.94, change: 10.46, volume: "46.57M", signal: "Top Losers 4H" },
  { ticker: "BTOG", last: 0.09, change: -19.83, volume: "13.12M", signal: "Halted" },
  { ticker: "FTFT", last: 0.67, change: -6.52, volume: "69.26K", signal: "Halted" },
  { ticker: "FYBR", last: 38.49, change: 0.13, volume: "13.03M", signal: "Halted" },
];

// Feature Card with floating tooltip - ONLY icon has color
function FeatureCard({
  icon: Icon,
  title,
  subtitle,
  description,
  techTitle,
  techDescription,
  color,
  href,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  techTitle: string;
  techDescription: string;
  color: string;
  href?: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleClick = () => {
    if (href) {
      window.location.href = href;
    }
  };

  return (
    <div
      className={`bg-[#131722] border border-[#2a2e39] rounded-lg p-4 transition-colors ${href ? 'cursor-pointer' : ''}`}
      style={{ borderColor: showTooltip ? color : undefined }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5" style={{ color }} />
        <h3 className="text-white font-semibold text-sm">{title}</h3>
      </div>
      <p className="text-[#d1d4dc] text-sm mb-2">{subtitle}</p>
      <p className="text-[#787b86] text-xs leading-relaxed">
        {description}
      </p>

      {/* Floating Tooltip - position fixed like chart tooltip */}
      {showTooltip && (
        <div
          className="fixed z-50 px-4 py-3 rounded-lg shadow-2xl text-xs max-w-[350px]"
          style={{
            left: tooltipPos.x + 15,
            top: tooltipPos.y + 15,
            backgroundColor: "#1e222d",
            border: `1px solid #363a45`,
            borderLeftColor: "#d1d4dc",
            borderLeftWidth: "3px",
          }}
        >
          <span className="font-semibold text-[#d1d4dc]">{techTitle}</span>
          <span className="text-[#9ba4b8]"> — </span>
          <span className="text-[#9ba4b8]">{techDescription}</span>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0d1117]">
      {/* Header - NO border */}
      <header>
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <Link href="/" className="text-white font-bold text-xl tracking-tight">
              TSIS<span className="text-white">.ai</span>
            </Link>
            <span className="text-[#787b86] text-sm">to SmallCaps Trading</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-[#2962ff] hover:bg-[#2962ff]/90 rounded transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium text-[#2962ff] border border-[#2962ff] hover:bg-[#2962ff]/10 rounded transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <FeatureCard
            icon={Database}
            title="MARKET ANALYTICS"
            subtitle="Historical Intelligence"
            description="Explore our massive historical database with advanced Small Caps analytics. Identify success patterns through the study of previous behaviors, correlations and performance metrics similar to high-precision institutional research."
            techTitle="Big Data & Quant Research"
            techDescription="Not just a scanner; a quantitative analysis engine processing years of micro-movements to deliver statistical edge before market open."
            color="#2962ff"
          />

          <FeatureCard
            icon={Cpu}
            title="STRATEGIES & STOCKS IN PLAY"
            subtitle="Real-Time Algorithmic Execution"
            description="The central app monitoring Stocks in Play. TSIS automatically applies predictive strategies on the day's hottest assets. Compare your manual trading against programmed systematic execution to detect deviations and optimize your edge."
            techTitle="Hybrid Machine Learning"
            techDescription="The system executes your same plays under rigid systematic trading rules. Comparative analysis between human intuition and algorithmic efficiency."
            color="#26a69a"
          />

          <FeatureCard
            icon={LineChart}
            title="TRACKING PERFORMANCE"
            subtitle="Performance Journaling"
            description="Your intelligent trading journal. Import trades via CSV/Excel for deep profitability breakdown. Visualize equity curve, Sharpe ratios, and risk statistics automatically to transform data into winning decisions."
            techTitle="Feedback Loop"
            techDescription="Full integration: what you record in your journal feeds global statistics, closing the circle between theory (Analytics) and practice (Stocks in Play)."
            color="#ff9800"
            href="/dashboard"
          />
        </div>

        {/* Screeners - Centered, compact, not full width */}
        <div className="flex justify-center gap-8 mb-6">
          <ScreenerTable
            title="SCREEN LONG"
            data={SCREEN_LONG_DATA}
            defaultTimeframe="intraday"
            sortDirection="desc"
          />
          <ScreenerTable
            title="SCREEN SHORT"
            data={SCREEN_SHORT_DATA}
            defaultTimeframe="intraday"
            sortDirection="asc"
          />
        </div>

        {/* Footer */}
        <div className="text-center text-[#787b86] text-xs py-4 border-t border-[#21262d]">
          Built for traders, by traders. Start tracking your performance today.
        </div>
      </div>
    </main>
  );
}
