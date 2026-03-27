import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "@/assets/spendlex-logo.jpeg";

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/onboarding", { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-between max-w-lg mx-auto py-16">
      {/* Main content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
        >
          <img src={logo} alt="Spendlex" width={120} height={120} className="object-contain" />
        </motion.div>

        {/* Brand Name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-3xl font-bold tracking-wider text-[hsl(217,90%,40%)]"
        >
          SPENDLEX
        </motion.h1>

        {/* Loading spinner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="mt-4"
        >
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[hsl(217,90%,40%)] animate-spin" />
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="text-xs tracking-[0.3em] text-gray-400 font-medium mt-2"
        >
          SECURING YOUR ASSETS
        </motion.p>
      </div>

      {/* Powered by Interswitch */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="flex items-center gap-2 text-xs text-gray-400"
      >
        <span className="tracking-wider">POWERED BY</span>
        <span className="font-bold text-[hsl(217,90%,25%)] tracking-wide">Interswitch</span>
      </motion.div>
    </div>
  );
};

export default SplashScreen;