import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SpendlexLogo from "@/components/SpendlexLogo";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/services/api";

type Step = "signup" | "verify";

const CreateAccount = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [step, setStep] = useState<Step>("signup");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP verification state
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name) e.name = "Name is required";
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Min 6 characters";
    if (form.phone && !/^\+?\d{7,15}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "Enter a valid phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError("");
    try {
      await signup(form.name, form.email, form.password, form.phone || undefined);
      if (form.phone) {
        setStep("verify");
      } else {
        navigate("/home");
      }
    } catch (err: any) {
      setApiError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setOtpLoading(true);
    setApiError("");
    setOtpMessage("");
    try {
      const res = await authApi.sendOtp(form.phone);
      setOtpSent(true);
      setOtpMessage(res.message || "OTP sent via WhatsApp!");
      // Auto-fill OTP in dev mode
      if (res.devOtp) {
        setOtpCode(res.devOtp);
        setOtpMessage(`DEV: Code auto-filled (${res.devOtp})`);
      }
    } catch (err: any) {
      setApiError(err.message || "Failed to send OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setApiError("Please enter the 6-digit code.");
      return;
    }
    setVerifyLoading(true);
    setApiError("");
    try {
      await authApi.verifyOtp(form.phone, otpCode);
      navigate("/home");
    } catch (err: any) {
      setApiError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setVerifyLoading(false);
    }
  };

  // ---- Verify Phone Step ----
  if (step === "verify") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-3xl shadow-xl w-full max-w-md p-6 pb-8">
          <div className="flex justify-center mb-6">
            <SpendlexLogo size={32} />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Verify Phone</h1>
          <p className="text-muted-foreground text-sm mb-8">
            We'll send a 6-digit code to <span className="font-semibold text-foreground">{form.phone}</span> via WhatsApp.
          </p>

          {apiError && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-4 py-3 mb-5">
              {apiError}
            </div>
          )}

          {otpMessage && !apiError && (
            <div className="bg-primary/10 border border-primary/30 text-primary text-sm rounded-xl px-4 py-3 mb-5">
              {otpMessage}
            </div>
          )}

          <div className="space-y-5">
            {!otpSent ? (
              <Button
                variant="hero"
                size="xl"
                className="w-full"
                onClick={handleSendOtp}
                disabled={otpLoading}
              >
                {otpLoading ? "Sending..." : "Send OTP"}
              </Button>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold tracking-widest text-muted-foreground">VERIFICATION CODE</label>
                  <Input
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtpCode(val);
                    }}
                    className="h-14 rounded-xl bg-input border-0 mt-2 text-center text-2xl tracking-[0.5em] font-mono"
                    maxLength={6}
                    inputMode="numeric"
                  />
                </div>

                <Button
                  variant="hero"
                  size="xl"
                  className="w-full"
                  onClick={handleVerifyOtp}
                  disabled={verifyLoading}
                >
                  {verifyLoading ? "Verifying..." : "Verify"}
                </Button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                  className="w-full text-sm text-primary font-semibold disabled:opacity-50"
                >
                  {otpLoading ? "Sending..." : "Resend Code"}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => navigate("/home")}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground mt-6 tracking-widest leading-relaxed">
            BY CREATING AN ACCOUNT, YOU AGREE TO<br />
            SPENDLEX <span className="underline cursor-pointer">TERMS</span> & <span className="underline cursor-pointer">PRIVACY POLICY</span>
          </p>
        </div>
      </motion.div>
    );
  }

  // ---- Signup Step ----
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl shadow-xl w-full max-w-md p-6 pb-8">
        <div className="flex justify-center mb-6">
          <SpendlexLogo size={32} />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Create Account</h1>
        <p className="text-muted-foreground text-sm mb-8">Start your journey to financial precision.</p>

        {apiError && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-4 py-3 mb-5">
            {apiError}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="text-xs font-semibold tracking-widest text-muted-foreground">FULL NAME</label>
            <Input
              placeholder="name@example.com"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-14 rounded-xl bg-input border-0 mt-2"
            />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold tracking-widest text-muted-foreground">EMAIL ADDRESS</label>
            <Input
              placeholder="name@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-14 rounded-xl bg-input border-0 mt-2"
            />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold tracking-widest text-muted-foreground">PHONE NUMBER</label>
            <Input
              type="tel"
              placeholder="+234 800 000 0000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="h-14 rounded-xl bg-input border-0 mt-2"
            />
            {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold tracking-widest text-muted-foreground">PASSWORD</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="h-14 rounded-xl bg-input border-0 mt-2"
            />
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
          </div>

          <Button variant="hero" size="xl" className="w-full" type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground tracking-widest">OR CONTINUE WITH</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="flex justify-center gap-3">
          {["iOS", "Apple", "Google"].map((p) => (
            <button key={p} className="px-6 py-3 rounded-xl bg-secondary text-sm font-medium text-foreground">
              {p}
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <button onClick={() => navigate("/signup")} className="text-primary font-semibold">Sign Up</button>
        </p>

        <p className="text-center text-[10px] text-muted-foreground mt-4 tracking-widest leading-relaxed">
          BY CREATING AN ACCOUNT, YOU AGREE TO<br />
          SPENDLEX <span className="underline cursor-pointer">TERMS</span> & <span className="underline cursor-pointer">PRIVACY POLICY</span>
        </p>
      </div>
    </motion.div>
  );
};

export default CreateAccount;
