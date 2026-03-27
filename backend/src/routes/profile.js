import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

// GET /api/profile
router.get("/", async (req, res) => {
  try {
    console.log(`[PROFILE] Get profile: user=${req.user.id}`);

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, phone, avatar_url, phone_verified, created_at")
      .eq("id", req.user.id)
      .single();

    if (error || !user) {
      console.log("   [WARN] User not found:", error?.message);
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`   [OK] Profile: ${user.email}`);
    res.json({ user });
  } catch (err) {
    console.error("   [ERROR] Get profile exception:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/profile
router.put("/", async (req, res) => {
  try {
    const { name, phone, avatar_url } = req.body;
    console.log(`[UPDATE] Update profile: user=${req.user.id}`);

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", req.user.id)
      .select("id, name, email, phone, avatar_url, phone_verified, created_at")
      .single();

    if (error) {
      console.error("   [ERROR] DB error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log(`   [OK] Profile updated`);
    res.json({ user: data });
  } catch (err) {
    console.error("   [ERROR] Update profile exception:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
