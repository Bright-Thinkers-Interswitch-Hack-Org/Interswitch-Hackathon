import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import transactionRoutes from "./routes/transactions.js";
import budgetRoutes from "./routes/budgets.js";
import analyticsRoutes from "./routes/analytics.js";
import insightRoutes from "./routes/insights.js";

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const icon = status >= 400 ? "[ERROR]" : "[OK]";
    console.log(`${icon} ${req.method} ${req.originalUrl} → ${status} (${duration}ms)`);

    if (status >= 400 && body?.error) {
      console.log(`   Error: ${body.error}`);
    }

    return originalJson(body);
  };

  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/insights", insightRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Log startup config (without secrets)
console.log("===================================");
console.log("Spendlex Backend Starting...");
console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL || "NOT SET"}`);
console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "***" + process.env.SUPABASE_SERVICE_ROLE_KEY.slice(-8) : "NOT SET"}`);
console.log(`  INTERSWITCH_CLIENT_ID: ${process.env.INTERSWITCH_CLIENT_ID ? "***" + process.env.INTERSWITCH_CLIENT_ID.slice(-8) : "NOT SET"}`);
console.log(`  JWT_SECRET: ${process.env.JWT_SECRET ? "set" : "NOT SET"}`);
console.log("===================================");

app.listen(PORT, () => {
  console.log(`[OK] Spendlex API running on http://localhost:${PORT}`);
});
