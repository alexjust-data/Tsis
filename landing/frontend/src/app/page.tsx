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

// CSS for typewriter and loading animations
const styleSheet = `
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  @keyframes loadingBar {
    0% { width: 0%; }
    20% { width: 25%; }
    40% { width: 45%; }
    60% { width: 70%; }
    80% { width: 90%; }
    100% { width: 100%; }
  }

  @keyframes loadingPulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }

  .cursor-blink {
    animation: blink 0.8s step-end infinite;
  }

  .loading-bar-fill {
    animation: loadingBar 0.8s ease-out forwards;
  }

  .loading-pulse {
    animation: loadingPulse 0.4s ease-in-out infinite;
  }
`;

function FeatureCard({
  icon: Icon,
  title,
  techTitle,
  techDescription,
  refId,
  href,
}: {
  icon: React.ElementType;
  title: string;
  techTitle: string;
  techDescription: string;
  refId: string;
  href: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(false);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  const cursorRef = useRef<NodeJS.Timeout | null>(null);

  // Typewriter effect
  useEffect(() => {
    if (isHovered) {
      setDisplayedText("");
      setShowCursor(true);
      let index = 0;

      typewriterRef.current = setInterval(() => {
        if (index < techTitle.length) {
          setDisplayedText(techTitle.slice(0, index + 1));
          index++;
        } else {
          if (typewriterRef.current) clearInterval(typewriterRef.current);
          // Keep cursor blinking for 2 more seconds
          cursorRef.current = setTimeout(() => {
            setShowCursor(false);
          }, 2000);
        }
      }, 50);
    } else {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      if (cursorRef.current) clearTimeout(cursorRef.current);
      setDisplayedText("");
      setShowCursor(false);
      setIsLoading(false);
    }

    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      if (cursorRef.current) clearTimeout(cursorRef.current);
    };
  }, [isHovered, techTitle]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setButtonPressed(true);
    setIsLoading(true);

    setTimeout(() => {
      setButtonPressed(false);
    }, 150);

    setTimeout(() => {
      window.location.href = href;
    }, 900);
  };

  // Brushed steel gradient
  const brushedSteelBg = `
    linear-gradient(
      135deg,
      #2a2d35 0%,
      #3a3d45 25%,
      #2a2d35 50%,
      #3a3d45 75%,
      #2a2d35 100%
    )
  `;

  return (
    <div
      className="group relative rounded-lg cursor-pointer transition-all duration-300"
      style={{
        background: brushedSteelBg,
        boxShadow: isHovered
          ? `
              0 0 0 2px #007AFF,
              0 0 20px rgba(0, 122, 255, 0.3),
              inset 0 2px 4px rgba(0, 0, 0, 0.4),
              inset 0 -1px 2px rgba(255, 255, 255, 0.05)
            `
          : `
              inset 0 2px 4px rgba(0, 0, 0, 0.4),
              inset 0 -1px 2px rgba(255, 255, 255, 0.05),
              0 4px 12px rgba(0, 0, 0, 0.3)
            `,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Brushed metal texture overlay */}
      <div
        className="absolute inset-0 rounded-lg opacity-30 pointer-events-none"
        style={{
          background: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 1px,
            rgba(255, 255, 255, 0.03) 1px,
            rgba(255, 255, 255, 0.03) 2px
          )`,
        }}
      />

      {/* Inner bevel effect */}
      <div
        className="absolute inset-[1px] rounded-lg pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
        }}
      />

      {/* Content container */}
      <div className="relative p-5">
        {/* Reference ID Badge - only visible on hover */}
        <div
          className={`absolute top-3 right-3 font-mono text-[10px] tracking-wider transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ color: '#007AFF' }}
        >
          {refId}
        </div>

        {/* Header with icon and title */}
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="p-1.5 rounded transition-all duration-300"
            style={{
              background: isHovered ? 'rgba(0, 122, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              boxShadow: isHovered ? '0 0 8px rgba(0, 122, 255, 0.3)' : 'none',
            }}
          >
            <Icon
              className="h-5 w-5 transition-colors duration-300"
              style={{ color: isHovered ? '#007AFF' : '#9ca3af' }}
            />
          </div>
          <h3
            className="text-sm font-semibold tracking-wide transition-colors duration-300"
            style={{
              color: isHovered ? '#ffffff' : '#d1d5db',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            }}
          >
            {title}
          </h3>
        </div>

        {/* Blue selection bar - Apple style */}
        <div
          className={`h-[2px] mb-4 rounded-full transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(90deg, #007AFF 0%, #00c6ff 100%)',
            boxShadow: '0 0 8px rgba(0, 122, 255, 0.5)',
          }}
        />

        {/* Tech Title with Typewriter effect */}
        <div className="mb-3 min-h-[24px]">
          <span
            className="font-semibold text-[13px]"
            style={{
              color: '#e5e7eb',
              fontFamily: '"SF Mono", "Fira Code", "Monaco", monospace',
            }}
          >
            {isHovered ? displayedText : techTitle}
            {showCursor && (
              <span
                className="cursor-blink ml-0.5 inline-block"
                style={{
                  color: '#007AFF',
                  fontWeight: 'bold',
                }}
              >
                _
              </span>
            )}
          </span>
        </div>

        {/* Description */}
        <p
          className="text-[12px] leading-relaxed mb-5"
          style={{
            color: '#9ca3af',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          }}
        >
          {techDescription}
        </p>

        {/* Explorar Button with physical press effect */}
        <div className="relative">
          <button
            className={`
              flex items-center gap-2 px-4 py-2 rounded text-[12px] font-medium
              transition-all duration-100
            `}
            style={{
              background: buttonPressed
                ? 'linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%)'
                : 'linear-gradient(180deg, #3a3d45 0%, #2a2d35 100%)',
              boxShadow: buttonPressed
                ? 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
                : `
                    0 2px 4px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1)
                  `,
              transform: buttonPressed ? 'translateY(1px)' : 'translateY(0)',
              color: isHovered ? '#007AFF' : '#9ca3af',
              fontFamily: '"SF Mono", monospace',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <span>Explorar</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isHovered ? 'translate-x-0.5' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Vintage Loading Bar */}
          {isLoading && (
            <div
              className="absolute -bottom-4 left-0 right-0 h-1 rounded-full overflow-hidden"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.5)',
              }}
            >
              <div
                className="h-full loading-bar-fill loading-pulse rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #007AFF 0%, #00c6ff 50%, #007AFF 100%)',
                  boxShadow: '0 0 8px rgba(0, 122, 255, 0.6)',
                }}
              />
            </div>
          )}
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <FeatureCard
              icon={Database}
              title="MARKET ANALYTICS"
              techTitle="Big Data & Quant Research"
              techDescription="Not just a scanner; a quantitative analysis engine processing years of micro-movements to deliver statistical edge before market open."
              refId="REF_ID: 001-QUANT"
              href="https://analytics.tsis.ai"
            />

            <FeatureCard
              icon={Cpu}
              title="STRATEGIES & STOCKS IN PLAY"
              techTitle="Hybrid Machine Learning"
              techDescription="The system executes your same plays under rigid systematic trading rules. Comparative analysis between human intuition and algorithmic efficiency."
              refId="REF_ID: 002-ALGO"
              href="https://strategy.tsis.ai"
            />

            <FeatureCard
              icon={LineChart}
              title="TRACKING PERFORMANCE"
              techTitle="Feedback Loop"
              techDescription="Full integration: what you record in your journal feeds global statistics, closing the circle between theory (Analytics) and practice (Stocks in Play)."
              refId="REF_ID: 003-PERF"
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
