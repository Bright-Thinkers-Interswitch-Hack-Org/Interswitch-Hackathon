import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

// GET /api/transactions
router.get("/", async (req, res) => {
  try {
    const { filter, search, limit = 50, offset = 0 } = req.query;
    console.log(`[TXN] List transactions: user=${req.user.id} filter=${filter || "all"} search=${search || ""}`);

    let query = supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (filter === "Income") {
      query = query.gt("amount", 0);
    } else if (filter === "Expenses") {
      query = query.lt("amount", 0);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, count, error } = await query;
    if (error) {
      console.error("   [ERROR] DB error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log(`   [OK] Returned ${data.length} transactions (total: ${count})`);
    res.json({ transactions: data, total: count });
  } catch (err) {
    console.error("   [ERROR] Get transactions exception:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/transactions
router.post("/", async (req, res) => {
  try {
    const { name, amount, category, payment_method, description } = req.body;
    console.log(`[CREATE] Create transaction: ${name} ${amount} ${category}`);

    if (!name || amount === undefined || !category) {
      return res.status(400).json({ error: "Name, amount, and category are required" });
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: req.user.id,
        name,
        amount: Number(amount),
        category,
        payment_method: payment_method || null,
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      console.error("   [ERROR] DB error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log(`   [OK] Transaction created: ${data.id}`);
    res.status(201).json({ transaction: data });
  } catch (err) {
    console.error("   [ERROR] Create transaction exception:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/transactions/:id
router.delete("/:id", async (req, res) => {
  try {
    console.log(`[DELETE] Delete transaction: ${req.params.id}`);
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    if (error) {
      console.error("   [ERROR] DB error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log("   [OK] Deleted");
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    console.error("   [ERROR] Delete transaction exception:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/transactions/summary
router.get("/summary", async (req, res) => {
  try {
    console.log(`[TXN] Transaction summary: user=${req.user.id}`);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data, error } = await supabase
      .from("transactions")
      .select("amount, category")
      .eq("user_id", req.user.id)
      .gte("created_at", startOfMonth);

    if (error) {
      console.error("   [ERROR] DB error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    const totalSpend = (data || [])
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalIncome = (data || [])
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const byCategory = {};
    for (const t of data || []) {
      if (t.amount < 0) {
        byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount);
      }
    }

    console.log(`   [OK] Summary: spend=${totalSpend} income=${totalIncome} categories=${Object.keys(byCategory).length}`);
    res.json({ totalSpend, totalIncome, byCategory });
  } catch (err) {
    console.error("   [ERROR] Transaction summary exception:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
