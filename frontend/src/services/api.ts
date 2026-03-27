const API_BASE = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("spendlex_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("spendlex_token");
    localStorage.removeItem("spendlex_user");
    window.location.href = "/signup";
    throw new Error("Unauthorized");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ---- Auth ----
export const authApi = {
  signup: (body: { name: string; email: string; password: string; phone?: string }) =>
    request<{ token: string; user: any }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  sendOtp: (phone: string) =>
    request<{ message: string; expiresIn: number; devOtp?: string }>("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  verifyOtp: (phone: string, code: string) =>
    request<{ message: string; verified: boolean }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    }),

  me: () => request<{ user: any }>("/auth/me"),
};

// ---- Profile ----
export const profileApi = {
  get: () => request<{ user: any }>("/profile"),
  update: (body: { name?: string; phone?: string; avatar_url?: string }) =>
    request<{ user: any }>("/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};

// ---- Transactions ----
export const transactionsApi = {
  list: (params?: { filter?: string; search?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.filter) qs.set("filter", params.filter);
    if (params?.search) qs.set("search", params.search);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    return request<{ transactions: any[]; total: number }>(`/transactions?${qs}`);
  },

  create: (body: {
    name: string;
    amount: number;
    category: string;
    payment_method?: string;
    description?: string;
  }) =>
    request<{ transaction: any }>("/transactions", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/transactions/${id}`, { method: "DELETE" }),

  summary: () => request<{ totalSpend: number; totalIncome: number; byCategory: Record<string, number> }>("/transactions/summary"),
};

// ---- Budgets ----
export const budgetsApi = {
  list: () =>
    request<{
      budgets: any[];
      overall: { totalLimit: number; totalSpent: number; remaining: number; percentage: number };
    }>("/budgets"),

  create: (body: { category: string; limit_amount: number }) =>
    request<{ budget: any }>("/budgets", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: string, body: { category?: string; limit_amount?: number }) =>
    request<{ budget: any }>(`/budgets/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/budgets/${id}`, { method: "DELETE" }),
};

// ---- Analytics ----
export const analyticsApi = {
  spending: () =>
    request<{
      monthlySpend: number;
      changePercent: number;
      categories: { name: string; amount: number; percentage: number }[];
    }>("/analytics/spending"),

  trends: () =>
    request<{ trends: { month: string; amount: number }[] }>("/analytics/trends"),

  financialHealth: () =>
    request<{
      overallScore: number;
      metrics: Record<string, { score: number; label: string; description: string }>;
      totalIncome: number;
      totalExpenses: number;
    }>("/analytics/financial-health"),
};

// ---- Insights ----
export const insightsApi = {
  list: () =>
    request<{
      insights: {
        type: string;
        title: string;
        message: string;
        category?: string;
        severity: string;
      }[];
      count: number;
    }>("/insights"),

  ask: (question: string) =>
    request<{ question: string; answer: string }>("/insights/ask", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),
};
