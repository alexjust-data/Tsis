const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:8001'
  : 'https://steadfast-encouragement-production.up.railway.app';

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
  avg_market_cap: string;
  avg_high_spike: number;
  avg_low_spike: number;
  avg_return: number;
  avg_change: number;
  avg_range: number;
  avg_hod_time: string;
  avg_lod_time: string;
  avg_close_red: number;
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
  const response = await fetch(`${API_BASE_URL}/api/gaps/${ticker}/stats`);
  if (!response.ok) {
    throw new Error(`Failed to fetch gap stats: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchGapHistory(ticker: string, limit = 50): Promise<GapHistoryItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/gaps/${ticker}?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch gap history: ${response.statusText}`);
  }
  const data = await response.json();
  return data.gaps;
}

export async function fetchTickerQuotes(ticker: string, limit = 100): Promise<Quote[]> {
  const response = await fetch(`${API_BASE_URL}/api/tickers/${ticker}/quotes?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch quotes: ${response.statusText}`);
  }
  const data = await response.json();
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
