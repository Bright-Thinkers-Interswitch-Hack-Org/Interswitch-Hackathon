import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShoppingBag, UtensilsCrossed, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import SpendlexLogo from "@/components/SpendlexLogo";

const slides = [
  {
    title: "Track",
    highlight: "Automatically",
    description: "Connect your accounts and watch your transactions categorize themselves in real-time. Experience precision intelligence.",
    badge: "Institutional Security",
    badgeDesc: "256-bit encryption for your data safety.",
  },
  {
    title: "AI-Driven",
    highlight: "Insights",
    description: "Get personalized saving suggestions and understand your spending habits with smart analytics.",
    badge: "+14% Efficiency",
    badgeDesc: "Smart Suggestion",
  },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const next = () => {
    if (step < slides.length - 1) setStep(step + 1);
    else navigate("/signup");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4">
        <SpendlexLogo size={32} />
        <button onClick={() => navigate("/signup")} className="text-sm font-semibold text-muted-foreground tracking-wide">
          SKIP
        </button>
      </header>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 py-2">
        {slides.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? "w-10 bg-primary" : "w-6 bg-border"}`} />
        ))}
      </div>

      {/* Slide content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col px-6"
        >
          {/* Illustration area */}
          <div className="bg-secondary rounded-3xl p-6 mb-8 relative overflow-hidden min-h-[260px] flex items-center justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-spendlex-green-light rounded-full blur-3xl opacity-50" />
            {step === 0 ? (
              <div className="flex flex-col items-center gap-4 relative z-10">
                <div className="flex gap-4">
                  <div className="bg-card rounded-2xl p-4 shadow-sm w-36 h-20 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-spendlex-green-light flex items-center justify-center">
                      <ShoppingBag size={16} className="text-spendlex-green" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2 bg-border rounded w-full" />
                      <div className="h-2 bg-border rounded w-3/4" />
                    </div>
                  </div>
                  <div className="bg-card rounded-2xl p-4 shadow-sm w-28 h-20 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <UtensilsCrossed size={16} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2 bg-border rounded w-full" />
                      <div className="h-2 bg-border rounded w-2/3" />
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 w-full max-w-[250px]">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                    <RefreshCw size={16} className="text-primary-foreground" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2 bg-border rounded w-3/4" />
                    <div className="h-2 bg-border rounded w-1/2" />
                  </div>
                  <span className="text-spendlex-green font-bold text-sm">+$2,450.00</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 relative z-10">
                <div className="bg-card rounded-2xl border border-spendlex-green px-4 py-1.5 text-spendlex-green font-semibold text-sm">
                  +14% Efficiency
                </div>
                <div className="flex items-end gap-3 h-32">
                  {[60, 40, 80, 50, 100].map((h, i) => (
                    <div
                      key={i}
                      className={`w-10 rounded-lg ${i === 2 ? "bg-spendlex-green" : i === 4 ? "bg-primary" : "bg-border"}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="bg-card rounded-2xl p-3 shadow-sm flex items-center gap-3 w-full max-w-[280px]">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <span className="text-muted-foreground text-xs">⚙️</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Smart Suggestion</p>
                    <p className="text-xs text-muted-foreground">Cancel your unused 'Cloud Music' subscription to save $12.99/mo.</p>
                  </div>
                  <ShieldCheck size={18} className="text-spendlex-green" />
                </div>
              </div>
            )}
          </div>

          {/* Text */}
          <h1 className="text-3xl font-bold text-foreground leading-tight">
            {slides[step].title}
            <br />
            <span className="text-primary">{slides[step].highlight}</span>
          </h1>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">{slides[step].description}</p>
        </motion.div>
      </AnimatePresence>

      {/* Bottom CTA */}
      <div className="px-6 pb-8 pt-4">
        <div className="bg-secondary rounded-3xl p-5">
          <Button variant="hero" size="xl" className="w-full" onClick={next}>
            {step === 0 ? "Next" : "Get Started"} <ArrowRight size={18} />
          </Button>
          {step === 0 && (
            <div className="flex items-center gap-3 mt-4 px-2">
              <ShieldCheck size={20} className="text-spendlex-green flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Institutional Security</p>
                <p className="text-xs text-muted-foreground">256-bit encryption for your data safety.</p>
              </div>
            </div>
          )}
          {step === 1 && (
            <p className="text-center text-xs text-muted-foreground mt-3">STEP 2 / 3</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
