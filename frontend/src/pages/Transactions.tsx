import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  ShoppingBag,
  Car,
  Coffee,
  Banknote,
  ShoppingCart,
  Utensils,
  Home,
  Zap,
  Heart,
  Gamepad2,
  GraduationCap,
  Plane,
  CircleDollarSign,
  type LucideIcon,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { transactionsApi } from "@/services/api";

const filters = ["All Activity", "Income", "Expenses"];

const categoryIconMap: Record<string, LucideIcon> = {
  food: Utensils,
  "food & drink": Utensils,
  dining: Coffee,
  coffee: Coffee,
  transport: Car,
  transportation: Car,
  travel: Plane,
  shopping: ShoppingBag,
  groceries: ShoppingCart,
  grocery: ShoppingCart,
  income: Banknote,
  salary: Banknote,
  housing: Home,
  rent: Home,
  utilities: Zap,
  health: Heart,
  healthcare: Heart,
  entertainment: Gamepad2,
  education: GraduationCap,
};

function getCategoryIcon(category: string): LucideIcon {
  const key = category.toLowerCase();
  return categoryIconMap[key] || CircleDollarSign;
}

function formatAmount(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  return amount < 0 ? `-${formatted}` : `+${formatted}`;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfThisWeek = new Date(startOfToday);
  startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfToday.getDay());

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  if (date >= startOfThisWeek) return "This Week";
  return "Earlier";
}

interface Transaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  payment_method: string;
  created_at: string;
}

type GroupedTransactions = Record<string, Transaction[]>;

function groupTransactionsByDate(transactions: Transaction[]): GroupedTransactions {
  const groups: GroupedTransactions = {};
  const order = ["Today", "Yesterday", "This Week", "Earlier"];

  for (const tx of transactions) {
    const group = getDateGroup(tx.created_at);
    if (!groups[group]) groups[group] = [];
    groups[group].push(tx);
  }

  // Return in chronological order
  const sorted: GroupedTransactions = {};
  for (const key of order) {
    if (groups[key]) sorted[key] = groups[key];
  }
  return sorted;
}

const Transactions = () => {
  const [active, setActive] = useState("All Activity");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const filterParam = active === "Income" ? "income" : active === "Expenses" ? "expenses" : undefined;

  const {
    data: txData,
    isLoading: txLoading,
  } = useQuery({
    queryKey: ["transactions", filterParam, debouncedSearch],
    queryFn: () =>
      transactionsApi.list({
        filter: filterParam,
        search: debouncedSearch || undefined,
      }),
  });

  const {
    data: summaryData,
    isLoading: summaryLoading,
  } = useQuery({
    queryKey: ["transactions-summary"],
    queryFn: () => transactionsApi.summary(),
  });

  const grouped = useMemo(() => {
    if (!txData?.transactions) return {};
    return groupTransactionsByDate(txData.transactions);
  }, [txData]);

  // Compute spending analysis from summary byCategory
  const spendingAnalysis = useMemo(() => {
    if (!summaryData?.byCategory) return [];
    const entries = Object.entries(summaryData.byCategory);
    if (entries.length === 0) return [];
    const maxAmount = Math.max(...entries.map(([, v]) => Math.abs(v)));
    const colors = ["bg-spendlex-red", "bg-primary", "bg-spendlex-green", "bg-yellow-500", "bg-purple-500", "bg-blue-500"];
    return entries.map(([name, amount], i) => ({
      name,
      amount: Math.abs(amount),
      pct: maxAmount > 0 ? Math.round((Math.abs(amount) / maxAmount) * 100) : 0,
      color: colors[i % colors.length],
    }));
  }, [summaryData]);

  // Compute limit used percentage
  const totalSpend = summaryData?.totalSpend ?? 0;
  const totalIncome = summaryData?.totalIncome ?? 0;
  const limitPct = totalIncome > 0 ? Math.min(Math.round((totalSpend / totalIncome) * 100), 100) : 0;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-24">
      <AppHeader />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5">
        <p className="text-xs text-muted-foreground tracking-widest mb-1">LEDGER ACTIVITY</p>
        <h1 className="text-3xl font-bold text-foreground mb-4">Transactions</h1>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search payments..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-input border-0 text-sm outline-none focus:ring-2 ring-ring"
            />
          </div>
          <button className="w-11 h-11 rounded-xl bg-input flex items-center justify-center">
            <SlidersHorizontal size={18} className="text-foreground" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                active === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {txLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Loading transactions...</p>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">No transactions found.</p>
          </div>
        ) : (
          /* Transaction groups */
          Object.entries(grouped).map(([group, txs]) => (
            <div key={group} className="mb-5">
              <h3 className="font-bold text-foreground mb-2">{group}</h3>
              <div className="bg-card rounded-2xl border border-border divide-y divide-border">
                {txs.map((tx) => {
                  const Icon = getCategoryIcon(tx.category);
                  const isIncome = tx.amount > 0;
                  return (
                    <div key={tx.id} className="flex items-center gap-3 p-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <Icon size={18} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{tx.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] font-medium">
                            {tx.category.toUpperCase()}
                          </span>
                          {" "} • {formatTime(tx.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isIncome ? "text-spendlex-green" : "text-foreground"}`}>
                          {formatAmount(tx.amount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{tx.payment_method}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Monthly spend summary */}
        <div className="bg-primary rounded-2xl p-5 mb-5">
          <p className="text-primary-foreground/70 text-xs tracking-widest">TOTAL MONTHLY SPEND</p>
          <p className="text-3xl font-bold text-primary-foreground mt-1">
            {summaryLoading
              ? "..."
              : totalSpend.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          </p>
          <div className="flex items-center justify-between mt-3">
            <p className="text-primary-foreground/70 text-xs">Limit used</p>
            <span className="text-spendlex-green font-bold text-sm">{limitPct}%</span>
          </div>
          <div className="w-full h-2 bg-primary-foreground/20 rounded-full mt-2 overflow-hidden">
            <div className="h-full rounded-full bg-spendlex-green" style={{ width: `${limitPct}%` }} />
          </div>
        </div>

        {/* Spending Analysis */}
        <h3 className="font-bold text-foreground mb-3">Spending Analysis</h3>
        <div className="space-y-3 mb-6">
          {summaryLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : spendingAnalysis.length === 0 ? (
            <p className="text-sm text-muted-foreground">No spending data yet.</p>
          ) : (
            spendingAnalysis.map((s) => {
              const Icon = getCategoryIcon(s.name);
              return (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Icon size={14} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{s.name}</span>
                      <span className="text-sm font-bold text-foreground">
                        {s.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button className="text-sm text-foreground font-medium flex items-center gap-1 mb-6">
          View Detailed Report →
        </button>
      </motion.div>
      <BottomNav />
    </div>
  );
};

export default Transactions;
