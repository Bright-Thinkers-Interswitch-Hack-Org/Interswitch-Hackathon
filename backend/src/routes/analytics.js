import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

// GET /api/analytics/spending
router.get("/spending", async (req, res) => {
  try {
    console.log(`[ANALYTICS] Analytics spending: user=${req.user.id}`);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    const { data: currentTxns, error: e1 } = await supabase
      .from("transactions")
      .select("amount, category")
      .eq("user_id", req.user.id)
      .lt("amount", 0)
      .gte("created_at", startOfMonth);

    if (e1) {
      console.error("   [ERROR] DB error (current):", e1.message);
      return res.status(500).json({ error: e1.message });
    }

    const { data: lastTxns, error: e2 } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", req.user.id)
      .lt("amount", 0)
      .gte("created_at", startOfLastMonth)
      .lte("created_at", endOfLastMonth);

    if (e2) {
      console.error("   [ERROR] DB error (last month):", e2.message);
    }

    const currentTotal = (currentTxns || []).reduce((s, t) => s + Math.abs(t.amount), 0);
    const lastTotal = (lastTxns || []).reduce((s, t) => s + Math.abs(t.amount), 0);

    const changePercent = lastTotal > 0
      ? (((currentTotal - lastTotal) / lastTotal) * 100).toFixed(1)
      : 0;

    const byCategory = {};
    for (const t of currentTxns || []) {
      byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount);
    }

    const categories = Object.entries(byCategory)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: currentTotal > 0 ? Math.round((amount / currentTotal) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    console.log(`   [OK] Spending: $${currentTotal} (${changePercent}% vs last month), ${categories.length} categories`);
    res.json({ monthlySpend: currentTotal, changePercent: Number(changePercent), categories });
  } catch (err) {
    console.error("   [ERROR] Analytics spending exception:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/analytics/trends
router.get("/trends", async (req, res) => {
  try {
    console.log(`[ANALYTICS] Analytics trends: user=${req.user.id}`);
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const { data } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", req.user.id)
        .lt("amount", 0)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      const total = (data || []).reduce((s, t) => s + Math.abs(t.amount), 0);
      months.push({
        month: start.toLocaleString("en", { month: "short" }).toUpperCase(),
        amount: total,
      });
    }

    console.log(`   [OK] Trends: ${months.map(m => `${m.month}=$${m.amount}`).join(", ")}`);
    res.json({ trends: months });
  } catch (err) {
    console.error("   [ERROR] Analytics trends exception:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/analytics/financial-health
router.get("/financial-health", async (req, res) => {
  try {
    console.log(`[HEALTH] Financial health: user=${req.user.id}`);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: txns, error: e1 } = await supabase
      .from("transactions")
      .select("amount, category")
      .eq("user_id", req.user.id)
      .gte("created_at", startOfMonth);

    if (e1) {
      console.error("   [ERROR] DB error:", e1.message);
      return res.status(500).json({ error: e1.message });
    }

    const { data: budgets } = await supabase
      .from("budgets")
      .select("category, limit_amount")
      .eq("user_id", req.user.id);

    const totalIncome = (txns || [])
      .filter((t) => t.amount > 0)
      .reduce((s, t) => s + t.amount, 0);

    const totalExpenses = (txns || [])
      .filter((t) => t.amount < 0)
      .reduce((s, t) => s + Math.abs(t.amount), 0);

    const totalBudget = (budgets || []).reduce((s, b) => s + b.limit_amount, 0);

    const spendingScore = totalIncome > 0
      ? Math.min(100, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100))
      : 50;

    const savingsRate = totalIncome > 0
      ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
      : 0;

    const budgetAdherence = totalBudget > 0
      ? Math.min(100, Math.round(((totalBudget - totalExpenses) / totalBudget) * 100 + 50))
      : 50;

    const overallScore = Math.round(
      spendingScore * 0.4 + Math.min(100, savingsRate + 50) * 0.3 + budgetAdherence * 0.3
    );

    console.log(`   [OK] Health score: ${overallScore} (income=$${totalIncome} expenses=$${totalExpenses})`);

    res.json({
      overallScore: Math.max(0, Math.min(100, overallScore)),
      metrics: {
        spending: {
          score: spendingScore,
          label: spendingScore >= 70 ? "GOOD" : spendingScore >= 40 ? "MODERATE" : "NEEDS WORK",
          description: "Velocity based on your income-to-expense ratio.",
        },
        savings: {
          score: Math.min(100, Math.max(0, savingsRate + 50)),
          label: savingsRate >= 20 ? "EXCELLENT" : savingsRate >= 10 ? "GOOD" : "MODERATE",
          description: "Based on your monthly savings rate.",
        },
        balance: {
          score: budgetAdherence,
          label: budgetAdherence >= 80 ? "EXCELLENT" : budgetAdherence >= 50 ? "GOOD" : "MODERATE",
          description: "How well you stay within your budget allocations.",
        },
      },
      totalIncome,
      totalExpenses,
    });
  } catch (err) {
    console.error("   [ERROR] Financial health exception:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
