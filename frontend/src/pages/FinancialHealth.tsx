import { motion } from "framer-motion";
import { Wallet, PiggyBank, Landmark, ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

const iconMap: Record<string, React.ElementType> = {
  spending: Wallet,
  savings: PiggyBank,
  balance: Landmark,
};

function labelColor(label: string) {
  const l = label.toUpperCase();
  if (l === "GOOD") return "text-spendlex-green bg-spendlex-green-light";
  if (l === "EXCELLENT") return "text-primary bg-primary/10";
  return "text-spendlex-orange bg-spendlex-orange/10";
}

function barColor(label: string) {
  const l = label.toUpperCase();
  if (l === "GOOD") return "bg-spendlex-green";
  if (l === "EXCELLENT") return "bg-primary";
  return "bg-spendlex-orange";
}

const FinancialHealth = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["financialHealth"],
    queryFn: analyticsApi.financialHealth,
  });

  const overallScore = data?.overallScore ?? 0;
  const metrics = data?.metrics ?? {};

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-24">
      <AppHeader />

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5">
          <p className="text-xs text-muted-foreground tracking-widest mb-1">CURATION STRATEGY</p>
          <h1 className="text-3xl font-bold text-foreground leading-tight mb-3">Your Financial<br/>Vital Signs.</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Spendlex calculates your score based on spending velocity, liquidity ratios, and long-term asset growth. You are currently in the top 15% of curators in your bracket.
          </p>

          {/* Health Index Circle */}
          <div className="flex justify-center mb-8">
            <div className="relative w-44 h-44">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="hsl(var(--spendlex-green))"
                  strokeWidth="8"
                  strokeDasharray={`${overallScore * 2.64} ${100 * 2.64}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-foreground">{overallScore}</span>
                <span className="text-[10px] text-muted-foreground tracking-widest">HEALTH INDEX</span>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-4 mb-6">
            {Object.entries(metrics).map(([key, m]) => {
              const Icon = iconMap[key] ?? Wallet;
              return (
                <div key={key} className="bg-card rounded-2xl p-5 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <Icon size={24} className="text-muted-foreground" />
                    <span className={`text-[10px] font-bold tracking-widest px-2 py-1 rounded-md ${labelColor(m.label)}`}>{m.label.toUpperCase()}</span>
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-1 capitalize">{key}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{m.description}</p>
                  <p className="text-xs text-muted-foreground mb-1">{m.score}% EFFICIENCY</p>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor(m.label)}`} style={{ width: `${m.score}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Growth Recommendation */}
          <div className="mb-6">
            <p className="text-xs text-muted-foreground tracking-widest mb-2 flex items-center gap-1">
              ● GROWTH RECOMMENDATION
            </p>
            <h2 className="text-2xl font-bold text-foreground mb-3">The 5% Optimization</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Your "Savings" metric is the primary anchor holding back your score. Increasing your monthly savings rate by <strong className="text-foreground">5%</strong> would boost your overall Health Index to <strong className="text-foreground">85/100</strong> within 90 days.
            </p>
            <Button variant="hero" size="default">
              Optimize Auto-Save <ArrowRight size={16} />
            </Button>
          </div>

          {/* Wealth Spark Path */}
          <div className="bg-card rounded-2xl p-5 border border-border mb-6">
            <h3 className="font-bold text-foreground mb-4">Wealth Spark Path</h3>
            {[
              { label: "EMERGENCY FUND", status: "Completed", color: "bg-spendlex-green" },
              { label: "INVESTMENT POOL", status: "68%", color: "bg-primary" },
              { label: "FUTURE WEALTH", status: "24%", color: "bg-muted" },
            ].map((w) => (
              <div key={w.label} className="flex items-center justify-between mb-3 last:mb-0">
                <span className="text-xs font-semibold tracking-widest text-muted-foreground">{w.label}</span>
                <span className={`text-xs font-bold ${w.status === "Completed" ? "text-spendlex-green" : "text-foreground"}`}>{w.status}</span>
              </div>
            ))}
            <div className="space-y-2 mt-3">
              {[{ pct: 100, c: "bg-spendlex-green" }, { pct: 68, c: "bg-primary" }, { pct: 24, c: "bg-muted-foreground" }].map((b, i) => (
                <div key={i} className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${b.c}`} style={{ width: `${b.pct}%` }} />
                </div>
              ))}
            </div>
          </div>

          {/* Authority in Motion */}
          <div className="bg-primary rounded-2xl p-5 mb-6">
            <h2 className="text-xl font-bold text-primary-foreground mb-2">Authority in Motion</h2>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              Spendlex uses machine learning to compare your spending behavior against thousands of high-net-worth curators to ensure your growth is sustainable.
            </p>
          </div>
        </motion.div>
      )}
      <BottomNav />
    </div>
  );
};

export default FinancialHealth;
