import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Home as HomeIcon, Utensils, Car, ShoppingBag, MonitorPlay, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, budgetsApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

const CIRCUMFERENCE = 2 * Math.PI * 40; // ~251.33

const categoryIconMap: Record<string, React.ElementType> = {
  Food: Utensils,
  Housing: HomeIcon,
  Transport: Car,
  Shopping: ShoppingBag,
  Subscriptions: MonitorPlay,
};

const categoryColorMap: Record<string, string> = {
  Food: "bg-spendlex-green",
  Housing: "bg-primary",
  Transport: "bg-spendlex-orange",
  Shopping: "bg-spendlex-red",
  Subscriptions: "bg-primary",
};

const categoryHslMap: Record<string, string> = {
  Housing: "hsl(var(--primary))",
  Food: "hsl(var(--spendlex-green))",
  Transport: "hsl(var(--spendlex-orange))",
  Shopping: "hsl(var(--spendlex-red))",
};

const categorySubMap: Record<string, string> = {
  Food: "Groceries & Dining",
  Housing: "Rent & Utilities",
  Transport: "Fuel & Transit",
  Shopping: "Lifestyle & Goods",
  Subscriptions: "Streaming & Software",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const Analytics = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"6M" | "1Y">("6M");

  const { data: spendingData, isLoading: spendingLoading } = useQuery({
    queryKey: ["analytics", "spending"],
    queryFn: analyticsApi.spending,
  });

  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ["analytics", "trends"],
    queryFn: analyticsApi.trends,
  });

  const { data: budgetsData, isLoading: budgetsLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: budgetsApi.list,
  });

  const isLoading = spendingLoading || trendsLoading || budgetsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto pb-24">
        <AppHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <BottomNav />
      </div>
    );
  }

  const monthlySpend = spendingData?.monthlySpend ?? 0;
  const changePercent = spendingData?.changePercent ?? 0;
  const categories = spendingData?.categories ?? [];

  // Build donut chart segments from category percentages
  const donutCategories = categories
    .filter((c) => categoryHslMap[c.name])
    .slice(0, 4);

  let cumulativeOffset = 0;
  const donutSegments = donutCategories.map((c) => {
    const dash = (c.percentage / 100) * CIRCUMFERENCE;
    const gap = CIRCUMFERENCE - dash;
    const offset = -cumulativeOffset;
    cumulativeOffset += dash;
    return {
      name: c.name,
      stroke: categoryHslMap[c.name] ?? "hsl(var(--border))",
      dasharray: `${dash.toFixed(1)} ${gap.toFixed(1)}`,
      dashoffset: offset,
    };
  });

  // Find the largest category for center label
  const topCategory =
    categories.length > 0
      ? categories.reduce((a, b) => (b.percentage > a.percentage ? b : a))
      : null;

  // Trends bar chart
  const trends = trendsData?.trends ?? [];
  const maxTrendAmount = Math.max(...trends.map((t) => t.amount), 1);

  // Budgets for category breakdown
  const budgets = budgetsData?.budgets ?? [];

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-24">
      <AppHeader />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5">
        <p className="text-xs text-muted-foreground tracking-widest mb-1">PORTFOLIO PERFORMANCE</p>
        <h1 className="text-3xl font-bold text-foreground mb-4">Analytics</h1>

        {/* Monthly Spend card */}
        <div className="bg-card rounded-2xl p-5 border border-border mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Spend</p>
              <p className="text-3xl font-bold text-foreground">{fmt(monthlySpend)}</p>
            </div>
            <span className={`font-semibold text-sm ${changePercent >= 0 ? "text-spendlex-green" : "text-spendlex-red"}`}>
              {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Spending Mix donut */}
        <div className="bg-card rounded-2xl p-5 border border-border mb-4">
          <h3 className="font-bold text-foreground">Spending Mix</h3>
          <p className="text-xs text-muted-foreground mb-4">Current Billing Cycle</p>
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="14" />
                {donutSegments.map((seg) => (
                  <circle
                    key={seg.name}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={seg.stroke}
                    strokeWidth="14"
                    strokeDasharray={seg.dasharray}
                    strokeDashoffset={seg.dashoffset}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">
                  {topCategory ? `${Math.round(topCategory.percentage)}%` : "—"}
                </span>
                <span className="text-[10px] text-muted-foreground tracking-widest">
                  {topCategory?.name?.toUpperCase() ?? ""}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            {donutCategories.map((c) => (
              <div key={c.name} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${categoryColorMap[c.name] ?? "bg-primary"}`} />
                <span className="text-muted-foreground">{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spending Trends */}
        <div className="bg-card rounded-2xl p-5 border border-border mb-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-bold text-foreground">Spending Trends</h3>
              <p className="text-xs text-muted-foreground">
                Activity over the last {period === "6M" ? "6 months" : "year"}
              </p>
            </div>
            <div className="flex gap-1">
              {(["6M", "1Y"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${p === period ? "bg-foreground text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-1 h-24 mt-4">
            {trends.map((t, i) => {
              const heightPct = (t.amount / maxTrendAmount) * 100;
              const isMax = t.amount === maxTrendAmount;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-md ${isMax ? "bg-primary" : "bg-border"}`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {t.month.toUpperCase().slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Button variant="hero" size="xl" className="w-full mb-6" onClick={() => navigate("/financial-health")}>
          Check Financial health
        </Button>

        {/* Category Breakdown */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Category<br/>Breakdown</h2>
          <button className="flex items-center gap-1 text-sm text-foreground font-medium">
            Detailed Report <ArrowRight size={14} />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {budgets.map((b) => {
            const Icon = categoryIconMap[b.category] ?? Utensils;
            const color = categoryColorMap[b.category] ?? "bg-primary";
            const sub = categorySubMap[b.category] ?? b.category;
            const isOver = b.spent > b.limit_amount;
            const pct = b.percentage ?? Math.round((b.spent / b.limit_amount) * 100);

            return (
              <div key={b.id} className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}/10`}>
                    <Icon size={20} className={color.replace("bg-", "text-")} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-foreground">{b.category}</p>
                        <p className="text-xs text-muted-foreground">{sub}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{fmt(b.spent)}</p>
                        {isOver && <p className="text-xs text-spendlex-red font-semibold">Over Budget</p>}
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Budget: {fmt(b.limit_amount)}</span>
                        <span>{Math.min(pct, 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isOver ? "bg-spendlex-red" : color}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
      <BottomNav />
    </div>
  );
};

export default Analytics;
