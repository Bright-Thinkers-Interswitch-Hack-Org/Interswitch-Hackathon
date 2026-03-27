import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { supabase } from "../config/supabase.js";
import { sendWhatsAppOTP } from "../services/interswitch.js";

const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    console.log(`[AUTH] Signup attempt: ${email}`);

    if (!email || !password || !name) {
      console.log("   [WARN] Missing required fields");
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    // Check if user already exists
    const { data: existing, error: lookupError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (lookupError && lookupError.code !== "PGRST116") {
      // PGRST116 = "no rows returned" which is expected for new users
      console.error("   [ERROR] Supabase lookup error:", lookupError.message, lookupError.code);
      return res.status(500).json({ error: lookupError.message });
    }

    if (existing) {
      console.log("   [WARN] Email already registered");
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        name,
        email,
        password_hash: `${salt}:${hash}`,
        phone: phone || null,
        avatar_url: null,
      })
      .select()
      .single();

    if (error) {
      console.error("   [ERROR] Supabase insert error:", error.message, error.code, error.details);
      return res.status(500).json({ error: error.message });
    }

    console.log(`   [OK] User created: ${user.id}`);
    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (err) {
    console.error("   [ERROR] Signup exception:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[AUTH] Login attempt: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      console.log("   [WARN] User not found or DB error:", error.message);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const [salt, storedHash] = user.password_hash.split(":");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");

    if (hash !== storedHash) {
      console.log("   [WARN] Password mismatch");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log(`   [OK] Login successful: ${user.id}`);
    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar_url: user.avatar_url },
    });
  } catch (err) {
    console.error("   [ERROR] Login exception:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/send-otp
router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    console.log(`[OTP] OTP request for: ${phone}`);

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const otp = await sendWhatsAppOTP(phone);
    console.log(`   [OTP] OTP generated for ${phone} (code: ${otp})`);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("otp_codes")
      .upsert(
        { phone, code: otp, expires_at: expiresAt, verified: false },
        { onConflict: "phone" }
      );

    if (error) {
      console.error("   [ERROR] OTP store error:", error.message);
      return res.status(500).json({ error: "Failed to store OTP" });
    }

    console.log(`   [OK] OTP stored, expires: ${expiresAt}`);
    const response = { message: "OTP sent to your WhatsApp", expiresIn: 600 };
    // In dev mode, include OTP in response for easy testing
    if (process.env.NODE_ENV !== "production") {
      response.devOtp = otp;
    }
    res.json(response);
  } catch (err) {
    console.error("   [ERROR] Send OTP exception:", err.message);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, code } = req.body;
    console.log(`[OTP] OTP verify: ${phone} code=${code}`);

    if (!phone || !code) {
      return res.status(400).json({ error: "Phone and code are required" });
    }

    const { data: otpRecord, error: fetchErr } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("phone", phone)
      .eq("code", code)
      .eq("verified", false)
      .single();

    if (fetchErr || !otpRecord) {
      console.log("   [WARN] Invalid OTP code");
      return res.status(400).json({ error: "Invalid OTP code" });
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      console.log("   [WARN] OTP expired");
      return res.status(400).json({ error: "OTP has expired" });
    }

    await supabase
      .from("otp_codes")
      .update({ verified: true })
      .eq("phone", phone);

    await supabase
      .from("users")
      .update({ phone_verified: true })
      .eq("phone", phone);

    console.log(`   [OK] Phone verified: ${phone}`);
    res.json({ message: "Phone verified successfully", verified: true });
  } catch (err) {
    console.error("   [ERROR] Verify OTP exception:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`[AUTH] Auth check for user: ${payload.id}`);

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, phone, avatar_url, phone_verified, created_at")
      .eq("id", payload.id)
      .single();

    if (error || !user) {
      console.log("   [WARN] User not found:", error?.message);
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`   [OK] User found: ${user.email}`);
    res.json({ user });
  } catch (err) {
    console.log("   [WARN] Invalid token:", err.message);
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
