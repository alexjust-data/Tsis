"use client";

import { useState, useEffect, useRef } from "react";
import { Database, Cpu, LineChart } from "lucide-react";
import ScreenerTable from "@/components/screener/ScreenerTable";

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

// CSS for animations
const styleSheet = `
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  @keyframes loadingProgress {
    0% { width: 0%; }
    10% { width: 15%; }
    30% { width: 40%; }
    50% { width: 60%; }
    70% { width: 80%; }
    90% { width: 95%; }
    100% { width: 100%; }
  }

  .cursor-blink {
    animation: blink 0.8s step-end infinite;
  }

  .loading-bar {
    animation: loadingProgress 1s ease-out forwards;
  }
`;

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
  href: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  const cursorRef = useRef<NodeJS.Timeout | null>(null);

  // Typewriter effect
  useEffect(() => {
    if (isHovered) {
      setDisplayedText("");
      setShowCursor(true);
      let index = 0;

      const startDelay = setTimeout(() => {
        typewriterRef.current = setInterval(() => {
          if (index < techTitle.length) {
            setDisplayedText(techTitle.slice(0, index + 1));
            index++;
          } else {
            if (typewriterRef.current) clearInterval(typewriterRef.current);
            cursorRef.current = setTimeout(() => {
              setShowCursor(false);
            }, 2000);
          }
        }, 50);
      }, 400);

      return () => {
        clearTimeout(startDelay);
        if (typewriterRef.current) clearInterval(typewriterRef.current);
        if (cursorRef.current) clearTimeout(cursorRef.current);
      };
    } else {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      if (cursorRef.current) clearTimeout(cursorRef.current);
      setDisplayedText("");
      setShowCursor(false);
      setIsLoading(false);
    }
  }, [isHovered, techTitle]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      window.location.href = href;
    }, 1100);
  };

  return (
    <div
      className="relative block h-[220px] cursor-pointer overflow-hidden rounded-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Front - Original dark design - slides UP and OUT when hovered */}
      <div
        className={`absolute inset-0 bg-[#131722] border border-[#2a2e39] rounded-lg p-4 transition-transform duration-500 ease-out ${
          isHovered ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <Icon className="h-5 w-5" style={{ color }} />
          <h3 className="text-white font-semibold text-sm">{title}</h3>
        </div>
        <p className="text-[#d1d4dc] text-sm mb-2">{subtitle}</p>
        <p className="text-[#787b86] text-xs leading-relaxed">{description}</p>
      </div>

      {/* Back - Slides up from bottom pushing the front */}
      <div
        className={`absolute inset-0 rounded-lg p-3 flex flex-col transition-transform duration-500 ease-out ${
          isHovered ? 'translate-y-0' : 'translate-y-full'
        }`}
          style={{
            /* Exact Sherlock 2 brushed aluminum background */
            background: `linear-gradient(180deg,
              #d4d8e0 0%,
              #c8ccd4 20%,
              #bcc0c8 40%,
              #c4c8d0 60%,
              #b8bcc4 80%,
              #aeb2ba 100%
            )`,
            /* Outer border like Sherlock window */
            boxShadow: `
              inset 0 0 0 1px #888,
              inset 1px 1px 0 rgba(255, 255, 255, 0.5),
              inset -1px -1px 0 rgba(0, 0, 0, 0.15),
              0 2px 8px rgba(0, 0, 0, 0.2)
            `,
          }}
        >
          {/* Horizontal brushed metal lines texture */}
          <div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 2px,
                rgba(255, 255, 255, 0.15) 2px,
                rgba(255, 255, 255, 0.15) 3px
              )`,
              opacity: 0.5,
            }}
          />

          {/* Content area with inset border - like Sherlock icon containers */}
          <div
            className="relative flex-1 rounded-md p-3 mb-3"
            style={{
              /* Inner content box like the icon areas in Sherlock */
              background: `linear-gradient(180deg,
                #e8ecf0 0%,
                #f4f6f8 30%,
                #ffffff 50%,
                #f4f6f8 70%,
                #e8ecf0 100%
              )`,
              boxShadow: `
                inset 1px 1px 3px rgba(0, 0, 0, 0.2),
                inset -1px -1px 1px rgba(255, 255, 255, 0.8),
                0 1px 0 rgba(255, 255, 255, 0.5)
              `,
              border: '1px solid #999',
            }}
          >
            {/* Vertical stripes texture inside content box - like Sherlock empty slots */}
            <div
              className="absolute inset-[1px] rounded pointer-events-none"
              style={{
                background: `repeating-linear-gradient(
                  90deg,
                  transparent 0px,
                  transparent 3px,
                  rgba(200, 204, 210, 0.3) 3px,
                  rgba(200, 204, 210, 0.3) 4px
                )`,
              }}
            />

            {/* Text content */}
            <div className="relative">
              {/* Tech Title with Typewriter */}
              <h4
                className="font-bold text-[14px] mb-3"
                style={{
                  color: '#1a1a1a',
                  fontFamily: 'Monaco, "Lucida Console", monospace',
                  textShadow: '0 1px 0 rgba(255, 255, 255, 0.7)',
                }}
              >
                {isHovered ? displayedText : techTitle}
                {showCursor && (
                  <span className="cursor-blink ml-0.5" style={{ color: '#1a1a1a' }}>_</span>
                )}
              </h4>

              {/* Description */}
              <p
                className="text-[11px] leading-relaxed"
                style={{
                  color: '#333',
                  fontFamily: '"Lucida Grande", "Geneva", sans-serif',
                }}
              >
                {techDescription}
              </p>
            </div>
          </div>

          {/* Bottom area with centered button */}
          <div className="relative flex justify-center">
            {/* Explorar Button - exact Mac OS 9 style like Edit... button */}
            <button
              className="relative px-6 py-1.5 text-[12px] font-medium rounded-[4px]"
              style={{
                background: `linear-gradient(180deg,
                  #fafafa 0%,
                  #e8e8e8 45%,
                  #d8d8d8 55%,
                  #c8c8c8 100%
                )`,
                boxShadow: `
                  0 1px 2px rgba(0, 0, 0, 0.25),
                  inset 0 1px 0 rgba(255, 255, 255, 0.9),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                `,
                border: '1px solid #666',
                color: '#000',
                fontFamily: '"Lucida Grande", "Geneva", sans-serif',
              }}
            >
              <span className="flex items-center gap-1">
                Explorar
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          </div>

        {/* Vintage Blue Loading Bar - appears at bottom when loading */}
        {isLoading && (
          <div
            className="absolute bottom-0 left-0 right-0 h-[6px] rounded-b-lg overflow-hidden"
            style={{
              background: '#888',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Track groove */}
            <div
              className="absolute inset-[1px] rounded-sm overflow-hidden"
              style={{
                background: `linear-gradient(180deg, #666 0%, #888 50%, #999 100%)`,
              }}
            >
              {/* Blue progress bar */}
              <div
                className="h-full loading-bar"
                style={{
                  background: `linear-gradient(180deg,
                    #6699ff 0%,
                    #3366cc 30%,
                    #0033aa 50%,
                    #3366cc 70%,
                    #6699ff 100%
                  )`,
                  boxShadow: `
                    inset 0 1px 0 rgba(255, 255, 255, 0.4),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                  `,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styleSheet }} />
      <main className="min-h-screen bg-[#0d1117]">
        <header>
          <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-baseline gap-2 ml-4">
              <span className="text-white font-bold text-xl tracking-tight">
                TSIS<span className="text-white">.ai</span>
              </span>
              <span className="text-[#787b86] text-sm">SmallCaps Trading</span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://journal.tsis.ai/login"
                className="px-4 py-2 text-sm font-medium text-white bg-[#2962ff] hover:bg-[#2962ff]/90 rounded transition-colors"
              >
                Get Started
              </a>
              <a
                href="https://journal.tsis.ai/register"
                className="px-4 py-2 text-sm font-medium text-[#2962ff] border border-[#2962ff] hover:bg-[#2962ff]/10 rounded transition-colors"
              >
                Create Account
              </a>
            </div>
          </div>
        </header>

        <div className="max-w-[1200px] mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <FeatureCard
              icon={Database}
              title="MARKET ANALYTICS"
              subtitle="Historical Intelligence"
              description="Explore our massive historical database with advanced Small Caps analytics. Identify success patterns through the study of previous behaviors, correlations and performance metrics similar to high-precision institutional research."
              techTitle="Big Data & Quant Research"
              techDescription="Not just a scanner; a quantitative analysis engine processing years of micro-movements to deliver statistical edge before market open."
              color="#2962ff"
              href="https://analytics.tsis.ai"
            />

            <FeatureCard
              icon={Cpu}
              title="STRATEGIES & STOCKS IN PLAY"
              subtitle="Real-Time Algorithmic Execution"
              description="The central app monitoring Stocks in Play. TSIS automatically applies predictive strategies on the day's hottest assets. Compare your manual trading against programmed systematic execution to detect deviations and optimize your edge."
              techTitle="Hybrid Machine Learning"
              techDescription="The system executes your same plays under rigid systematic trading rules. Comparative analysis between human intuition and algorithmic efficiency."
              color="#26a69a"
              href="https://strategy.tsis.ai"
            />

            <FeatureCard
              icon={LineChart}
              title="TRACKING PERFORMANCE"
              subtitle="Performance Journaling"
              description="Your intelligent trading journal. Import trades via CSV/Excel for deep profitability breakdown. Visualize equity curve, Sharpe ratios, and risk statistics automatically to transform data into winning decisions."
              techTitle="Feedback Loop"
              techDescription="Full integration: what you record in your journal feeds global statistics, closing the circle between theory (Analytics) and practice (Stocks in Play)."
              color="#ff9800"
              href="https://journal.tsis.ai"
            />
          </div>

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

          <div className="text-center text-[#787b86] text-xs py-4 border-t border-[#21262d]">
            Built for traders, by traders. Start tracking your performance today.
          </div>
        </div>
      </main>
    </>
  );
}
