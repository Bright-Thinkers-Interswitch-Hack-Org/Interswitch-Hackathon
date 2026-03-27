import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

// GET /api/budgets
router.get("/", async (req, res) => {
  try {
    console.log(`[BUDGET] Get budgets: user=${req.user.id}`);

    const { data: budgets, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("   [ERROR] DB error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: txns } = await supabase
      .from("transactions")
      .select("amount, category")
      .eq("user_id", req.user.id)
      .lt("amount", 0)
      .gte("created_at", startOfMonth);

    const spentByCategory = {};
    for (const t of txns || []) {
      spentByCategory[t.category] =
        (spentByCategory[t.category] || 0) + Math.abs(t.amount);
    }

    const enriched = budgets.map((b) => ({
      ...b,
      spent: spentByCategory[b.category] || 0,
      percentage: b.limit_amount
        ? Math.round(((spentByCategory[b.category] || 0) / b.limit_amount) * 100)
        : 0,
    }));

    const totalLimit = budgets.reduce((s, b) => s + (b.limit_amount || 0), 0);
    const totalSpent = Object.values(spentByCategory).reduce((s, v) => s + v, 0);

    console.log(`   [OK] ${budgets.length} budgets, totalLimit=${totalLimit}, totalSpent=${totalSpent}`);
    res.json({
      budgets: enriched,
      overall: {
        totalLimit,
        totalSpent,
        remaining: totalLimit - totalSpent,
        percentage: totalLimit ? Math.round((totalSpent / totalLimit) * 100) : 0,
      },
    });
  } catch (err) {
    console.error("   [ERROR] Get budgets exception:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/budgets
router.post("/", async (req, res) => {
  try {
    const { category, limit_amount } = req.body;
    console.log(`[CREATE] Create budget: ${category} limit=${limit_amount}`);

    if (!category || !limit_amount) {
      return res.status(400).json({ error: "Category and limit_amount are required" });
    }

    const { data, error } = await supabase
      .from("budgets")
      .insert({
        user_id: req.user.id,
        category,
        limit_amount: Number(limit_amount),
      })
      .select()
      .single();

    if (error) {
      console.error("   [ERROR] DB error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log(`   [OK] Budget created: ${data.id}`);
    res.status(201).json({ budget: data });
  } catch (err) {
    console.error("   [ERROR] Create budget exception:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/budgets/:id
router.put("/:id", async (req, res) => {
  try {
    const { category, limit_amount } = req.body;
    console.log(`[UPDATE] Update budget: ${req.params.id}`);

    const { data, error } = await supabase
      .from("budgets")
      .update({ category, limit_amount: Number(limit_amount) })
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) {
      console.error("   [ERROR] DB error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log(`   [OK] Budget updated`);
    res.json({ budget: data });
  } catch (err) {
    console.error("   [ERROR] Update budget exception:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/budgets/:id
router.delete("/:id", async (req, res) => {
  try {
    console.log(`[DELETE] Delete budget: ${req.params.id}`);
    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    if (error) {
      console.error("   [ERROR] DB error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log("   [OK] Deleted");
    res.json({ message: "Budget deleted" });
  } catch (err) {
    console.error("   [ERROR] Delete budget exception:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
