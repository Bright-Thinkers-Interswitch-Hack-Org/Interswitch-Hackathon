import { motion } from "framer-motion";
import { ArrowRight, Sparkles, AlertTriangle, Target, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { insightsApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

const iconMap: Record<string, React.ElementType> = {
  spending_alert: AlertTriangle,
  budget_warning: AlertTriangle,
  savings_opportunity: Sparkles,
  goal_progress: Target,
  general: Sparkles,
};

const iconColorMap: Record<string, string> = {
  spending_alert: "text-spendlex-orange",
  budget_warning: "text-spendlex-orange",
  savings_opportunity: "text-primary",
  goal_progress: "text-primary",
  general: "text-primary",
};

const Insights = () => {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["insights"],
    queryFn: insightsApi.list,
  });

  const askMutation = useMutation({
    mutationFn: (q: string) => insightsApi.ask(q),
    onSuccess: (result) => {
      setAiAnswer(result.answer);
    },
  });

  const insights = data?.insights ?? [];
  const count = data?.count ?? 0;
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const handleAsk = () => {
    const trimmed = question.trim();
    if (!trimmed) return;
    setAiAnswer(null);
    askMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAsk();
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-24">
      <AppHeader />

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5">
          {/* Hero */}
          <div className="bg-primary rounded-2xl p-6 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-primary-foreground/20 text-primary-foreground text-[10px] tracking-widest px-3 py-1 rounded-full mb-3">
              ● LIVE INTELLIGENCE
            </span>
            <h1 className="text-2xl font-bold text-primary-foreground leading-snug">
              Good morning, {firstName}.<br />
              <span className="text-primary-foreground/70">Your Spendlex AI has {count} new insight{count !== 1 ? "s" : ""}.</span>
            </h1>
            <p className="text-primary-foreground/60 text-sm mt-3">
              I've analyzed your spending patterns over the last 24 hours. Here's how we can optimize your wealth today.
            </p>
          </div>

          {/* Dynamic Insight Cards */}
          {insights.map((insight, idx) => {
            const Icon = iconMap[insight.type] ?? Sparkles;
            const iconColor = iconColorMap[insight.type] ?? "text-primary";

            return (
              <div key={idx} className="bg-card rounded-2xl p-5 border border-border mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={24} className={iconColor} />
                  <div>
                    <p className="font-bold text-foreground">{insight.title}</p>
                    {insight.category && (
                      <span className="text-xs bg-secondary px-2 py-1 rounded-md font-medium text-foreground">
                        {insight.category}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{insight.message}</p>
                <Button variant="hero-outline" size="sm">View Details</Button>
              </div>
            );
          })}

          {/* Ask AI */}
          <div className="bg-primary rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-primary-foreground mb-1">Have a question?</h3>
            <p className="text-primary-foreground/70 text-sm mb-3">
              Ask me anything about your finances, like "How much did I spend on groceries last week?"
            </p>
            <div className="relative">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Spendlex AI..."
                className="w-full h-12 pl-4 pr-12 rounded-xl bg-primary-foreground text-foreground text-sm outline-none"
                disabled={askMutation.isPending}
              />
              <button
                onClick={handleAsk}
                disabled={askMutation.isPending}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary flex items-center justify-center"
              >
                {askMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin text-primary-foreground" />
                ) : (
                  <Send size={14} className="text-primary-foreground" />
                )}
              </button>
            </div>
            {aiAnswer && (
              <div className="mt-3 bg-primary-foreground/10 rounded-xl p-4">
                <p className="text-sm text-primary-foreground leading-relaxed">{aiAnswer}</p>
              </div>
            )}
            {askMutation.isError && (
              <p className="mt-2 text-sm text-red-300">Something went wrong. Please try again.</p>
            )}
          </div>
        </motion.div>
      )}
      <BottomNav />
    </div>
  );
};

export default Insights;
