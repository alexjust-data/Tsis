// Force HTTPS - env var was causing issues
const API_URL = "https://gracious-enjoyment-production.up.railway.app/api/v1";
console.log("🔵 API_URL:", API_URL);

interface ApiOptions extends RequestInit {
  token?: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const fullUrl = `${API_URL}${endpoint}`;
  console.log("🔴 FETCH URL:", fullUrl);
  const response = await fetch(fullUrl, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, data);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    fetchApi<{ id: number; email: string; name: string | null }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const loginUrl = `${API_URL}/auth/login`;
    console.log("🟡 LOGIN URL:", loginUrl);
    return fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new ApiError(res.status, res.statusText, data);
      }
      return res.json() as Promise<{ access_token: string; token_type: string }>;
    });
  },

  me: (token: string) =>
    fetchApi<{ id: number; email: string; name: string | null; is_active: boolean }>(
      "/auth/me",
      { token }
    ),
};

// Trades API
export const tradesApi = {
  getAll: (token: string, params?: { ticker?: string; start_date?: string; end_date?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.ticker) searchParams.append("ticker", params.ticker);
    if (params?.start_date) searchParams.append("start_date", params.start_date);
    if (params?.end_date) searchParams.append("end_date", params.end_date);

    const query = searchParams.toString();
    return fetchApi<Trade[]>(`/trades${query ? `?${query}` : ""}`, { token });
  },

  create: (token: string, data: TradeCreate) =>
    fetchApi<Trade>("/trades", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  update: (token: string, id: number, data: Partial<TradeCreate>) =>
    fetchApi<Trade>(`/trades/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    }),

  delete: (token: string, id: number) =>
    fetchApi<void>(`/trades/${id}`, { method: "DELETE", token }),

  import: async (token: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/trades/import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new ApiError(response.status, response.statusText, data);
    }

    return response.json() as Promise<{
      message: string;
      trades_created: number;
      errors: string[];
    }>;
  },
};

// Dashboard API
export const dashboardApi = {
  getMetrics: (token: string, params?: { start_date?: string; end_date?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.append("start_date", params.start_date);
    if (params?.end_date) searchParams.append("end_date", params.end_date);

    const query = searchParams.toString();
    return fetchApi<DashboardMetrics>(`/dashboard/metrics${query ? `?${query}` : ""}`, { token });
  },

  getCalendar: (token: string, year: number, month: number) =>
    fetchApi<MonthlyStats>(`/dashboard/calendar/${year}/${month}`, { token }),

  getTickers: (token: string, limit?: number) =>
    fetchApi<TickerStats[]>(`/dashboard/tickers${limit ? `?limit=${limit}` : ""}`, { token }),

  getTiming: (token: string) =>
    fetchApi<TimingStats[]>("/dashboard/timing", { token }),
};

// Tags API
export const tagsApi = {
  getAll: (token: string) =>
    fetchApi<Tag[]>("/tags", { token }),

  create: (token: string, data: TagCreate) =>
    fetchApi<Tag>("/tags", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  delete: (token: string, id: number) =>
    fetchApi<void>(`/tags/${id}`, { method: "DELETE", token }),
};

// Journal API (uses trades grouped by date)
export const journalApi = {
  getEntries: async (token: string, params?: { start_date?: string; end_date?: string }) => {
    const trades = await tradesApi.getAll(token, params);

    // Group trades by date
    const entriesMap = new Map<string, JournalEntry>();

    trades.forEach(trade => {
      const dateKey = trade.date;
      if (!entriesMap.has(dateKey)) {
        entriesMap.set(dateKey, {
          date: dateKey,
          trades: [],
          total_pnl: 0,
          total_trades: 0,
          winners: 0,
          losers: 0,
        });
      }
      const entry = entriesMap.get(dateKey)!;
      entry.trades.push(trade);
      entry.total_pnl += trade.pnl;
      entry.total_trades += 1;
      if (trade.pnl > 0) entry.winners += 1;
      else entry.losers += 1;
    });

    // Sort by date descending
    return Array.from(entriesMap.values()).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },
};

// Risk Settings API
export const riskApi = {
  get: (token: string) =>
    fetchApi<RiskSettings>("/risk-settings", { token }),

  update: (token: string, data: Partial<RiskSettings>) =>
    fetchApi<RiskSettings>("/risk-settings", {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    }),

  calculate: (token: string, entryPrice: number, stopPrice: number) =>
    fetchApi<PositionCalculation>(
      `/risk-settings/calculator?entry_price=${entryPrice}&stop_price=${stopPrice}`,
      { token }
    ),
};

// Reports API
export const reportsApi = {
  getDetailedStats: (
    token: string,
    params?: { ticker?: string; side?: "long" | "short"; start_date?: string; end_date?: string }
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.ticker) searchParams.append("ticker", params.ticker);
    if (params?.side) searchParams.append("side", params.side);
    if (params?.start_date) searchParams.append("start_date", params.start_date);
    if (params?.end_date) searchParams.append("end_date", params.end_date);

    const query = searchParams.toString();
    return fetchApi<DetailedStats>(`/reports/detailed/stats${query ? `?${query}` : ""}`, { token });
  },
};

// Types
export interface Trade {
  id: number;
  user_id: number;
  date: string;
  ticker: string;
  side: "long" | "short";
  entry_time: string | null;
  exit_time: string | null;
  duration_seconds: number | null;
  entry_price: number;
  exit_price: number;
  shares: number;
  pnl: number;
  pnl_percent: number | null;
  commissions: number;
  net_pnl: number | null;
  notes: string | null;
  setup: string | null;
  created_at: string;
  is_winner: boolean;
}

export interface TradeCreate {
  date: string;
  ticker: string;
  side: "long" | "short";
  entry_time?: string;
  exit_time?: string;
  entry_price: number;
  exit_price: number;
  shares: number;
  pnl: number;
  commissions?: number;
  notes?: string;
  setup?: string;
}

export interface DashboardMetrics {
  total_pnl: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
  avg_pnl_per_trade: number;
  profit_factor: number;
  best_trade: number;
  worst_trade: number;
  best_day: number;
  worst_day: number;
  long_pnl: number;
  long_trades: number;
  long_win_rate: number;
  short_pnl: number;
  short_trades: number;
  short_win_rate: number;
  today_pnl: number;
  week_pnl: number;
  month_pnl: number;
  current_streak: number;
  max_win_streak: number;
  max_loss_streak: number;
}

export interface CalendarDay {
  date: string;
  pnl: number;
  trades: number;
  win_rate: number;
  is_green: boolean;
}

export interface MonthlyStats {
  month: number;
  year: number;
  total_pnl: number;
  total_trades: number;
  win_rate: number;
  trading_days: number;
  avg_daily_pnl: number;
  best_day: number;
  worst_day: number;
  calendar: CalendarDay[];
}

export interface TickerStats {
  ticker: string;
  total_pnl: number;
  trades: number;
  win_rate: number;
  avg_pnl: number;
}

export interface TimingStats {
  hour: number;
  total_pnl: number;
  trades: number;
  win_rate: number;
  avg_duration_minutes: number;
}

export interface RiskSettings {
  id: number;
  user_id: number;
  account_balance: number;
  max_loss_daily: number;
  max_loss_daily_percent: number;
  max_position: number;
  max_position_percent: number;
  max_shares_per_trade: number;
  max_order: number;
  max_buying_power: number;
  risk_per_trade_percent: number;
  max_trades_per_day: number;
  alert_threshold_1: number;
  alert_threshold_2: number;
  alert_threshold_3: number;
}

export interface PositionCalculation {
  recommended_shares: number;
  calculated_shares: number;
  position_value: number;
  risk_amount: number;
  risk_percent: number;
  entry_price: number;
  stop_price: number;
  risk_per_share: number;
  limits_applied: {
    max_shares_per_trade: number;
    max_position: number;
    max_order: number;
  };
}

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface TagCreate {
  name: string;
  color?: string;
}

export interface JournalEntry {
  date: string;
  trades: Trade[];
  total_pnl: number;
  total_trades: number;
  winners: number;
  losers: number;
}

// Reports Types - matches backend DetailedStatsResponse
export interface DetailedStats {
  total_gain_loss: number;
  largest_gain: number | null;
  largest_loss: number | null;
  average_daily_gain_loss: number;
  average_daily_volume: number;
  average_per_share_gain_loss: number;
  average_trade_gain_loss: number;
  average_winning_trade: number;
  average_losing_trade: number;
  total_number_of_trades: number;
  number_of_winning_trades: number;
  number_of_losing_trades: number;
  average_hold_time_scratch_trades_seconds: number;
  average_hold_time_winning_trades_seconds: number;
  average_hold_time_losing_trades_seconds: number;
  number_of_scratch_trades: number;
  max_consecutive_wins: number;
  max_consecutive_losses: number;
  trade_pnl_standard_deviation: number | null;
  system_quality_number_sqn: number | null;
  probability_of_random_chance: number | null;
  kelly_percentage: number | null;
  k_ratio: number | null;
  profit_factor: number | null;
  total_commissions: number | null;
  total_fees: number | null;
  average_position_mae: number | null;
  average_position_mfe: number | null;
}

export { ApiError };
