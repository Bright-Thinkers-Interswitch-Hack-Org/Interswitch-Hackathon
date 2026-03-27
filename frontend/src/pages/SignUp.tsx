import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Loader2, Phone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SpendlexLogo from "@/components/SpendlexLogo";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/services/api";

type Step = "credentials" | "phone-verify";

const SignUp = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // -- step state --
  const [step, setStep] = useState<Step>("credentials");

  // -- credentials --
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // -- phone / OTP --
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // ---- validation ----
  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ---- login submit ----
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setApiError("");

    try {
      await login(email, password);
      // login succeeded -> move to phone verification step
      setStep("phone-verify");
    } catch (err: any) {
      setApiError(err?.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- send OTP ----
  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setPhoneError("Phone number is required");
      return;
    }
    setPhoneError("");
    setOtpLoading(true);

    try {
      const res = await authApi.sendOtp(phone);
      setOtpSent(true);
      // Auto-fill OTP in dev mode
      if (res.devOtp) {
        setOtp(res.devOtp);
      }
    } catch (err: any) {
      setPhoneError(err?.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ---- verify OTP ----
  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setPhoneError("Please enter the OTP code");
      return;
    }
    setPhoneError("");
    setOtpLoading(true);

    try {
      const result = await authApi.verifyOtp(phone, otp);
      if (result.verified) {
        setOtpVerified(true);
        // brief pause so user sees the success state, then navigate
        setTimeout(() => navigate("/home"), 800);
      } else {
        setPhoneError("Verification failed. Please try again.");
      }
    } catch (err: any) {
      setPhoneError(err?.message || "OTP verification failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ---- skip phone verification ----
  const skipVerification = () => {
    navigate("/home");
  };

  // ========================
  // Phone verification step
  // ========================
  if (step === "phone-verify") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
        <header className="px-6 pt-5 pb-2">
          <SpendlexLogo size={32} />
        </header>

        <div className="flex-1 flex flex-col px-6 pt-6">
          <h1 className="text-3xl font-bold text-foreground">Verify Phone</h1>
          <p className="text-muted-foreground mt-1 mb-8">
            Enter your WhatsApp number to receive a verification code.
          </p>

          {phoneError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 mb-4">
              <p className="text-destructive text-sm">{phoneError}</p>
            </div>
          )}

          {otpVerified ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-3 py-12">
              <CheckCircle2 size={56} className="text-primary" />
              <p className="text-lg font-semibold text-foreground">Phone verified!</p>
              <p className="text-muted-foreground text-sm">Redirecting you now...</p>
            </motion.div>
          ) : (
            <>
              {/* Phone input */}
              <label className="text-xs font-semibold tracking-widest text-muted-foreground mb-2">
                WHATSAPP PHONE NUMBER
              </label>
              <div className="flex gap-2 mb-1">
                <div className="relative flex-1">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="+234 800 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-14 rounded-xl bg-input border-0 text-base pl-11"
                    disabled={otpSent}
                  />
                </div>
                {!otpSent && (
                  <Button
                    type="button"
                    variant="hero"
                    className="h-14 px-5 rounded-xl"
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                  >
                    {otpLoading ? <Loader2 size={18} className="animate-spin" /> : "Send OTP"}
                  </Button>
                )}
              </div>

              <AnimatePresence>
                {otpSent && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-5">
                    <label className="text-xs font-semibold tracking-widest text-muted-foreground mb-2 block">
                      VERIFICATION CODE
                    </label>
                    <Input
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="h-14 rounded-xl bg-input border-0 text-base tracking-widest text-center"
                      maxLength={6}
                    />

                    <Button
                      type="button"
                      variant="hero"
                      size="xl"
                      className="w-full mt-6"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading}
                    >
                      {otpLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin mr-2" /> Verifying...
                        </>
                      ) : (
                        <>
                          Verify <ArrowRight size={18} />
                        </>
                      )}
                    </Button>

                    <button
                      type="button"
                      className="text-xs text-muted-foreground mt-3 block mx-auto"
                      onClick={handleSendOtp}
                      disabled={otpLoading}
                    >
                      Didn't receive a code? <span className="text-primary font-semibold">Resend</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={skipVerification}
                className="text-sm text-muted-foreground mt-8 mx-auto underline underline-offset-2"
              >
                Skip for now
              </button>
            </>
          )}
        </div>
      </motion.div>
    );
  }

  // ========================
  // Credentials step (login)
  // ========================
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
      <header className="px-6 pt-5 pb-2">
        <SpendlexLogo size={32} />
      </header>

      <form onSubmit={submit} className="flex-1 flex flex-col px-6 pt-6">
        <h1 className="text-3xl font-bold text-foreground">Sign Up</h1>
        <p className="text-muted-foreground mt-1 mb-8">Access your editorial financial intelligence portal.</p>

        {apiError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 mb-4">
            <p className="text-destructive text-sm">{apiError}</p>
          </div>
        )}

        <label className="text-xs font-semibold tracking-widest text-muted-foreground mb-2">EMAIL OR PHONE</label>
        <Input
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-14 rounded-xl bg-input border-0 text-base mb-1"
        />
        {errors.email && <p className="text-destructive text-xs mb-3">{errors.email}</p>}

        <div className="flex items-center justify-between mt-5 mb-2">
          <label className="text-xs font-semibold tracking-widest text-muted-foreground">PASSWORD</label>
          <button type="button" onClick={() => navigate("/signup")} className="text-xs font-semibold text-primary">
            Forgot Password?
          </button>
        </div>
        <div className="relative">
          <Input
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 rounded-xl bg-input border-0 text-base pr-12"
          />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}

        <Button variant="hero" size="xl" className="w-full mt-8" type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" /> Signing in...
            </>
          ) : (
            <>
              Sign Up <ArrowRight size={18} />
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground tracking-widest">OR CONTINUE WITH</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="flex gap-3">
          <button type="button" className="flex-1 h-14 rounded-xl bg-card border border-border flex items-center justify-center gap-2 font-medium text-foreground">
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
            Google
          </button>
          <button type="button" className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center">
            <span className="text-lg">🔐</span>
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <button type="button" onClick={() => navigate("/create-account")} className="text-primary font-semibold">
            Create Account
          </button>
        </p>
      </form>
    </motion.div>
  );
};

export default SignUp;
