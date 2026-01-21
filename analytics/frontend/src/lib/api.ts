const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:8001'
  : 'https://steadfast-encouragement-production.up.railway.app';

// ============ CLIENT-SIDE CACHE ============
// In-flight requests cache to prevent duplicate concurrent calls
const inFlightRequests = new Map<string, Promise<unknown>>();

// Response cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const responseCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = responseCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  responseCache.set(key, { data, timestamp: Date.now() });
}

// Deduplicated fetch - prevents multiple concurrent requests for the same URL
async function fetchWithDedup<T>(url: string): Promise<T> {
  // Check response cache first
  const cached = getCached<T>(url);
  if (cached) {
    return cached;
  }

  // Check if request is already in flight
  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url) as Promise<T>;
  }

  // Make the request
  const promise = (async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setCache(url, data);
      return data as T;
    } finally {
      inFlightRequests.delete(url);
    }
  })();

  inFlightRequests.set(url, promise);
  return promise;
}

// Types
export interface GapHistoryItem {
  date: string;
  gap_value: number;
  open: number;
  close: number;
  high: number;
  low: number;
  prev_close: number;
  volume: number;
  high_spike: number;
  low_spike: number;
  return: number;
  close_direction: 'green' | 'red';
}

export interface GapDayStats {
  avg_volume: string;
  avg_dollar_volume: string;
  avg_premarket_volume: string;
  avg_market_cap: string;
  avg_hod_time: string;
  avg_lod_time: string;
  avg_premarket_high_time: string;
  avg_premarket_low_time: string;
  avg_premarket_high_fade: number;
  avg_close_red: number;
  avg_gap_value: number;
  avg_high_spike: number;
  avg_low_spike: number;
  avg_range: number;
  avg_return: number;
  avg_change: number;
  avg_high_gap: number;
  avg_high_fade: number;
  avg_high_to_pmh_change: number;
  avg_close_to_pmh_change: number;
  avg_premarket_high_gap: number;
}

export interface GapStats {
  ticker: string;
  number_of_gaps: number;
  avg_gap_value: number;
  avg_volume: string;
  avg_premarket_volume: string;
  gap_day: GapDayStats;
  day2: GapDayStats;
  gaps: GapHistoryItem[];
}

export interface Quote {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// API Functions
export async function fetchGapStats(ticker: string): Promise<GapStats> {
  const url = `${API_BASE_URL}/api/gaps/${ticker}/stats`;
  return fetchWithDedup<GapStats>(url);
}

export async function fetchGapHistory(ticker: string, limit = 50): Promise<GapHistoryItem[]> {
  const url = `${API_BASE_URL}/api/gaps/${ticker}?limit=${limit}`;
  const data = await fetchWithDedup<{ gaps: GapHistoryItem[] }>(url);
  return data.gaps;
}

export async function fetchTickerQuotes(ticker: string, limit = 100): Promise<Quote[]> {
  const url = `${API_BASE_URL}/api/tickers/${ticker}/quotes?limit=${limit}`;
  const data = await fetchWithDedup<{ quotes: Quote[] }>(url);
  return data.quotes;
}

export async function searchTickers(query: string, limit = 20): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/tickers/?search=${query}&limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to search tickers: ${response.statusText}`);
  }
  const data = await response.json();
  return data.tickers;
}

export interface IntradayCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IntradayData {
  ticker: string;
  date: string;
  candles: IntradayCandle[];
  count: number;
}

export async function fetchIntradayData(ticker: string, date: string): Promise<IntradayData> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tickers/${ticker}/intraday/${date}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `${response.status}: ${response.statusText}`);
    }
    return response.json();
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('Failed to fetch - backend may not be running');
    }
    throw err;
  }
}
