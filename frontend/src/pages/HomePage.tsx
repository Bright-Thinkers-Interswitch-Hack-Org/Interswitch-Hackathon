import { motion } from "framer-motion";
import { TrendingUp, Utensils, Car, ShoppingBag, Receipt, ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { transactionsApi, analyticsApi, insightsApi } from "@/services/api";
import BottomNav from "@/components/BottomNav";

const categoryMeta: Record<string, { icon: typeof Utensils; color: string }> = {
  Food: { icon: Utensils, color: "bg-destructive/10 text-destructive" },
  Transport: { icon: Car, color: "bg-primary/10 text-primary" },
  Shopping: { icon: ShoppingBag, color: "bg-spendlex-orange/10 text-spendlex-orange" },
  Bills: { icon: Receipt, color: "bg-spendlex-green/10 text-spendlex-green" },
};

const defaultMeta = { icon: Receipt, color: "bg-secondary text-muted-foreground" };

const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("NGN", "₦");

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}d ago`;
  const diffMo = Math.floor(diffD / 30);
  return `${diffMo}mo ago`;
}

/* ---- Skeleton primitives ---- */
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-muted ${className}`} />
);

const HomePage = () => {
  const { user } = useAuth();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["transactions", "summary"],
    queryFn: () => transactionsApi.summary(),
  });

  const { data: recentTxData, isLoading: txLoading } = useQuery({
    queryKey: ["transactions", "recent"],
    queryFn: () => transactionsApi.list({ limit: 3 }),
  });

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["analytics", "financialHealth"],
    queryFn: () => analyticsApi.financialHealth(),
  });

  const { data: spending, isLoading: spendingLoading } = useQuery({
    queryKey: ["analytics", "spending"],
    queryFn: () => analyticsApi.spending(),
  });

  const { data: insightsData } = useQuery({
    queryKey: ["insights"],
    queryFn: () => insightsApi.list(),
  });

  const topInsight = insightsData?.insights?.[0];

  const currentMonth = new Date().toLocaleString("default", { month: "long" });

  /* Build category cards from real data */
  const categoryCards = summary?.byCategory
    ? Object.entries(summary.byCategory).map(([name, amount]) => {
        const meta = categoryMeta[name] || defaultMeta;
        return { name, amount, icon: meta.icon, color: meta.color };
      })
    : [];

  const recentTransactions = recentTxData?.transactions ?? [];

  const healthScore = health?.overallScore ?? 0;

  const changePercent = spending?.changePercent;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-24">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-6">
        {/* Greeting */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-spendlex-green font-medium">Welcome back,</p>
            {user ? (
              <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
            ) : (
              <Skeleton className="h-7 w-40 mt-1" />
            )}
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/20 overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary font-bold text-lg">
                {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
        </div>

        {/* Total spending card */}
        <div className="bg-primary rounded-2xl p-5 mb-5">
          <p className="text-primary-foreground/70 text-sm">Total Spending ({currentMonth})</p>
          {summaryLoading ? (
            <Skeleton className="h-10 w-48 mt-1 bg-primary-foreground/20" />
          ) : (
            <p className="text-4xl font-bold text-primary-foreground mt-1">
              {formatNaira(summary?.totalSpend ?? 0)}
            </p>
          )}
          {spendingLoading ? (
            <Skeleton className="h-4 w-36 mt-2 bg-primary-foreground/20" />
          ) : changePercent != null ? (
            <p className="text-spendlex-green text-sm mt-2 flex items-center gap-1">
              <TrendingUp size={14} /> {Math.abs(changePercent)}% vs last month
            </p>
          ) : null}
        </div>

        {/* Health score */}
        <div className="bg-card rounded-2xl p-5 border border-border mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-foreground">Financial Health Score</h3>
            <TrendingUp size={18} className="text-spendlex-green" />
          </div>
          {healthLoading ? (
            <>
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-2 w-full mt-3" />
              <Skeleton className="h-4 w-56 mt-2" />
            </>
          ) : (
            <>
              <p className="text-4xl font-bold text-foreground">
                {healthScore} <span className="text-lg text-muted-foreground font-normal">/100</span>
              </p>
              <div className="w-full h-2 bg-secondary rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-spendlex-green transition-all duration-700"
                  style={{ width: `${healthScore}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {healthScore >= 70
                  ? "Good! Keep tracking your expenses."
                  : healthScore >= 40
                    ? "Fair. Review your spending habits."
                    : "Needs attention. Let's build better habits."}
              </p>
            </>
          )}
        </div>

        {/* Smart insight */}
        <div className="bg-primary rounded-2xl p-5 mb-6">
          <p className="text-primary-foreground/70 text-xs tracking-widest flex items-center gap-1 mb-2">
            🟢 SMART INSIGHT
          </p>
          {topInsight ? (
            <>
              <p className="text-xl font-bold text-primary-foreground leading-snug">
                "{topInsight.title}"
              </p>
              <p className="text-primary-foreground/70 text-sm mt-2">{topInsight.message}</p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-primary-foreground leading-snug">
                "Add transactions to<br />get personalised insights"
              </p>
              <p className="text-primary-foreground/70 text-sm mt-2">
                Start logging your daily spending and we'll surface actionable tips.
              </p>
            </>
          )}
        </div>

        {/* Spending by category */}
        <h2 className="text-lg font-bold text-foreground mb-3">Spending by Category</h2>
        {summaryLoading ? (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border">
                <Skeleton className="w-10 h-10 rounded-xl mb-3" />
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        ) : categoryCards.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {categoryCards.map((c) => (
              <div key={c.name} className="bg-card rounded-2xl p-4 border border-border">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.color}`}>
                  <c.icon size={20} />
                </div>
                <p className="text-sm text-muted-foreground">{c.name}</p>
                <p className="text-lg font-bold text-foreground">{formatNaira(c.amount)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-6">No spending data yet.</p>
        )}

        {/* Recent transactions */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">Recent Transactions</h2>
          <button className="text-sm text-primary font-semibold flex items-center gap-1">
            See all <ArrowUpRight size={14} />
          </button>
        </div>
        {txLoading ? (
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b border-border last:border-0">
                <div>
                  <Skeleton className="h-5 w-28 mb-1" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : recentTransactions.length > 0 ? (
          <div className="space-y-0">
            {recentTransactions.map((t: any, i: number) => (
              <div key={t.id ?? i} className="flex items-center justify-between py-4 border-b border-border last:border-0">
                <div>
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.category} • {t.created_at ? timeAgo(t.created_at) : ""}
                  </p>
                </div>
                <p className="font-bold text-foreground">{formatNaira(t.amount)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        )}
      </motion.div>
      <BottomNav />
    </div>
  );
};

export default HomePage;
