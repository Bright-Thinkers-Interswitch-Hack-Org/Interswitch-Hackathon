import { useLocation, useNavigate } from "react-router-dom";
import { Home, BarChart3, CircleDollarSign, Receipt, Sparkles } from "lucide-react";

const tabs = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/budget", label: "Budget", icon: CircleDollarSign },
  { path: "/transactions", label: "Transactions", icon: Receipt },
  { path: "/insights", label: "Insights", icon: Sparkles },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom,8px)]">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label={tab.label}
            >
              <tab.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] ${active ? "font-bold" : "font-medium"}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
