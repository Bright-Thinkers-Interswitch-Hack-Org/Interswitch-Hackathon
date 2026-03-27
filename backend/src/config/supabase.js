import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[ERROR] FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  console.error("   Go to: https://supabase.com/dashboard/project/tezcgeisnpdefovoaccf/settings/api");
  console.error("   Copy 'service_role' key (under 'Project API keys') into .env as SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (supabaseServiceKey.includes("your-") || supabaseServiceKey.includes("placeholder")) {
  console.error("[ERROR] FATAL: SUPABASE_SERVICE_ROLE_KEY is still a placeholder value!");
  console.error("   Go to: https://supabase.com/dashboard/project/tezcgeisnpdefovoaccf/settings/api");
  console.error("   Copy 'service_role' key into .env");
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test connection on startup
async function testConnection() {
  try {
    const { error } = await supabase.from("users").select("id").limit(1);
    if (error) {
      console.error("[ERROR] Supabase connection test FAILED:", error.message);
      if (error.message.includes("Invalid API key")) {
        console.error("   Your SUPABASE_SERVICE_ROLE_KEY is invalid.");
        console.error("   Go to: https://supabase.com/dashboard/project/tezcgeisnpdefovoaccf/settings/api");
      }
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        console.error("   Database tables not created yet. Run the migration SQL in Supabase SQL Editor.");
        console.error("   File: backend/supabase/migration.sql");
      }
    } else {
      console.log("[OK] Supabase connected successfully");
    }
  } catch (err) {
    console.error("[ERROR] Supabase connection test threw:", err.message);
  }
}

testConnection();
