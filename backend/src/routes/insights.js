import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

// GET /api/insights
router.get("/", async (req, res) => {
  try {
    console.log(`[INSIGHTS] Get insights: user=${req.user.id}`);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    const { data: currentTxns, error: e1 } = await supabase
      .from("transactions")
      .select("amount, category, name, created_at")
      .eq("user_id", req.user.id)
      .gte("created_at", startOfMonth);

    if (e1) {
      console.error("   [ERROR] DB error (current txns):", e1.message);
      return res.status(500).json({ error: e1.message });
    }

    const { data: lastTxns } = await supabase
      .from("transactions")
      .select("amount, category")
      .eq("user_id", req.user.id)
      .gte("created_at", startOfLastMonth)
      .lte("created_at", endOfLastMonth);

    const { data: budgets } = await supabase
      .from("budgets")
      .select("category, limit_amount")
      .eq("user_id", req.user.id);

    const insights = [];

    const currentByCategory = {};
    const lastByCategory = {};

    for (const t of currentTxns || []) {
      if (t.amount < 0) {
        currentByCategory[t.category] =
          (currentByCategory[t.category] || 0) + Math.abs(t.amount);
      }
    }
    for (const t of lastTxns || []) {
      if (t.amount < 0) {
        lastByCategory[t.category] =
          (lastByCategory[t.category] || 0) + Math.abs(t.amount);
      }
    }

    for (const [cat, amount] of Object.entries(currentByCategory)) {
      const lastAmount = lastByCategory[cat] || 0;
      if (lastAmount > 0) {
        const increase = ((amount - lastAmount) / lastAmount) * 100;
        if (increase > 20) {
          insights.push({
            type: "spending_alert",
            title: "Spending Alert",
            message: `You've spent ${Math.round(increase)}% more on ${cat} compared to last month.`,
            category: cat,
            severity: increase > 50 ? "high" : "medium",
          });
        }
      }
    }

    for (const budget of budgets || []) {
      const spent = currentByCategory[budget.category] || 0;
      const pct = Math.round((spent / budget.limit_amount) * 100);
      if (pct >= 90) {
        insights.push({
          type: "budget_warning",
          title: pct >= 100 ? "Over Budget" : "Budget Almost Full",
          message: `${budget.category}: You've used ${pct}% of your budget ($${spent.toFixed(2)} / $${budget.limit_amount.toFixed(2)}).`,
          category: budget.category,
          severity: pct >= 100 ? "high" : "medium",
        });
      }
    }

    const txnCounts = {};
    for (const t of currentTxns || []) {
      if (t.amount < 0) {
        const key = t.name.toLowerCase();
        if (!txnCounts[key]) txnCounts[key] = { count: 0, total: 0, name: t.name };
        txnCounts[key].count++;
        txnCounts[key].total += Math.abs(t.amount);
      }
    }

    for (const [, info] of Object.entries(txnCounts)) {
      if (info.count >= 3 && info.total > 20) {
        insights.push({
          type: "savings_opportunity",
          title: "Smart Save",
          message: `You've made ${info.count} purchases at "${info.name}" totaling $${info.total.toFixed(2)} this month.`,
          severity: "low",
        });
      }
    }

    const totalIncome = (currentTxns || [])
      .filter((t) => t.amount > 0)
      .reduce((s, t) => s + t.amount, 0);
    const totalExpenses = (currentTxns || [])
      .filter((t) => t.amount < 0)
      .reduce((s, t) => s + Math.abs(t.amount), 0);

    if (totalIncome > 0) {
      const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
      if (savingsRate >= 20) {
        insights.push({
          type: "goal_progress",
          title: "Goal Reached",
          message: `Great job! You're saving ${Math.round(savingsRate)}% of your income this month.`,
          severity: "positive",
        });
      }
    }

    if (insights.length === 0) {
      insights.push({
        type: "general",
        title: "Keep Going",
        message: "Keep tracking your expenses to unlock personalized insights!",
        severity: "low",
      });
    }

    console.log(`   [OK] Generated ${insights.length} insights`);
    res.json({ insights, count: insights.length });
  } catch (err) {
    console.error("   [ERROR] Insights exception:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/insights/ask
router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    console.log(`[INSIGHTS] Ask insight: "${question}"`);

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: txns, error } = await supabase
      .from("transactions")
      .select("amount, category, name, created_at")
      .eq("user_id", req.user.id)
      .gte("created_at", startOfMonth);

    if (error) {
      console.error("   [ERROR] DB error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    const lowerQ = question.toLowerCase();
    let answer = "";

    if (lowerQ.includes("spend") || lowerQ.includes("spent")) {
      const totalSpend = (txns || [])
        .filter((t) => t.amount < 0)
        .reduce((s, t) => s + Math.abs(t.amount), 0);

      const categories = ["food", "transport", "shopping", "bills", "subscriptions", "groceries", "dining"];
      const mentionedCat = categories.find((c) => lowerQ.includes(c));

      if (mentionedCat) {
        const catSpend = (txns || [])
          .filter((t) => t.amount < 0 && t.category.toLowerCase().includes(mentionedCat))
          .reduce((s, t) => s + Math.abs(t.amount), 0);
        answer = `You've spent $${catSpend.toFixed(2)} on ${mentionedCat} this month.`;
      } else {
        answer = `Your total spending this month is $${totalSpend.toFixed(2)}.`;
      }
    } else if (lowerQ.includes("save") || lowerQ.includes("saving")) {
      const income = (txns || []).filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const expenses = (txns || []).filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      const saved = income - expenses;
      answer = saved > 0
        ? `You've saved $${saved.toFixed(2)} this month (${income > 0 ? Math.round((saved / income) * 100) : 0}% of income).`
        : `You've overspent by $${Math.abs(saved).toFixed(2)} this month.`;
    } else if (lowerQ.includes("income") || lowerQ.includes("earn")) {
      const income = (txns || []).filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      answer = `Your total income this month is $${income.toFixed(2)}.`;
    } else {
      answer = `Based on your data this month: ${(txns || []).length} transactions recorded. Ask about spending, savings, or income for detailed info.`;
    }

    console.log(`   [OK] Answer: "${answer}"`);
    res.json({ question, answer });
  } catch (err) {
    console.error("   [ERROR] Ask insight exception:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
