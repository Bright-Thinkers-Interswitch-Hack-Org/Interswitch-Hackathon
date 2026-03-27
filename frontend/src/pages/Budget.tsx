import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Utensils,
  Car,
  ShoppingBag,
  MonitorPlay,
  Home,
  Heart,
  Zap,
  Briefcase,
  GraduationCap,
  Gamepad2,
  Landmark,
  Loader2,
  Check,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetsApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

// Map category names to icons and colors
const categoryMeta: Record<string, { icon: React.ElementType; color: string }> = {
  Food: { icon: Utensils, color: "bg-spendlex-green" },
  Transport: { icon: Car, color: "bg-primary" },
  Shopping: { icon: ShoppingBag, color: "bg-spendlex-orange" },
  Subscriptions: { icon: MonitorPlay, color: "bg-spendlex-red" },
  Housing: { icon: Home, color: "bg-primary" },
  Health: { icon: Heart, color: "bg-spendlex-red" },
  Utilities: { icon: Zap, color: "bg-spendlex-orange" },
  Work: { icon: Briefcase, color: "bg-primary" },
  Education: { icon: GraduationCap, color: "bg-spendlex-green" },
  Entertainment: { icon: Gamepad2, color: "bg-spendlex-orange" },
};

const defaultMeta = { icon: Landmark, color: "bg-primary" };

function getMeta(category: string) {
  return categoryMeta[category] ?? defaultMeta;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const Budget = () => {
  const queryClient = useQueryClient();

  // ---- data fetching ----
  const { data, isLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: budgetsApi.list,
  });

  // ---- mutations ----
  const createMutation = useMutation({
    mutationFn: (body: { category: string; limit_amount: number }) => budgetsApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setShowAddForm(false);
      setNewCategory("");
      setNewAmount("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { limit_amount: number } }) =>
      budgetsApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  // ---- local state ----
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const budgets = data?.budgets ?? [];
  const overall = data?.overall ?? { totalLimit: 0, totalSpent: 0, remaining: 0, percentage: 0 };

  // ---- handlers ----
  const handleAdd = () => {
    const amount = parseFloat(newAmount);
    if (!newCategory.trim() || isNaN(amount) || amount <= 0) return;
    createMutation.mutate({ category: newCategory.trim(), limit_amount: amount });
  };

  const handleStartEditing = () => {
    const vals: Record<string, string> = {};
    budgets.forEach((b: any) => {
      vals[b.id] = String(b.limit_amount);
    });
    setEditValues(vals);
    setIsEditing(true);
  };

  const handleSaveEdit = (id: string) => {
    const amount = parseFloat(editValues[id]);
    if (isNaN(amount) || amount <= 0) return;
    updateMutation.mutate({ id, body: { limit_amount: amount } });
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditValues({});
  };

  // ---- loading state ----
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto pb-24">
        <AppHeader />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-24">
      <AppHeader />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5">
        <p className="text-xs text-muted-foreground tracking-widest mb-1">MONTHLY LIMIT</p>
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="text-4xl font-bold text-foreground">${fmt(overall.totalLimit)}</h1>
          <span className="text-spendlex-green font-bold">{overall.percentage}% Used</span>
        </div>

        {/* Spent / Remaining */}
        <div className="bg-card rounded-2xl p-5 border border-border mb-4">
          <div className="flex justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground tracking-widest">SPENT</p>
              <p className="text-2xl font-bold text-foreground">${fmt(overall.totalSpent)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground tracking-widest">REMAINING</p>
              <p className="text-2xl font-bold text-spendlex-green">${fmt(overall.remaining)}</p>
            </div>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(overall.percentage, 100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            &#9432; Push notifications sent at 75% and 100% of limits.
          </p>
        </div>

        {/* Rollover */}
        <div className="bg-primary rounded-2xl p-5 mb-5 flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/70 text-xs tracking-widest">ROLLOVER FROM LAST MONTH</p>
            <p className="text-2xl font-bold text-primary-foreground">+$420.50</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <span className="text-primary-foreground text-lg">&#9201;</span>
          </div>
        </div>

        {/* Category Budgets */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Category Budgets</h2>
          <button
            className="flex items-center gap-1 text-sm text-foreground font-medium"
            onClick={() => setShowAddForm((v) => !v)}
          >
            <Plus size={16} /> Add Category
          </button>
        </div>

        {/* Add Category Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-card rounded-2xl p-4 border border-border mb-3"
          >
            <p className="text-sm font-bold text-foreground mb-3">New Category Budget</p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 rounded-xl bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                placeholder="Amount"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-28 rounded-xl bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewCategory("");
                  setNewAmount("");
                }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg"
              >
                <X size={14} /> Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={createMutation.isPending}
                className="flex items-center gap-1 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 px-4 py-1.5 rounded-lg disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Add
              </button>
            </div>
          </motion.div>
        )}

        <div className="space-y-3 mb-6">
          {budgets.map((b: any) => {
            const meta = getMeta(b.category);
            const Icon = meta.icon;
            const color = meta.color;
            const pct = b.percentage ?? Math.round((b.spent / b.limit_amount) * 100);
            const over = b.spent > b.limit_amount;

            return (
              <div key={b.id} className="bg-secondary rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}/20`}>
                    <Icon size={20} className={`${color.replace("bg-", "text-")}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-foreground">{b.category}</p>
                        {isEditing ? (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-muted-foreground">${fmt(b.spent)} of $</span>
                            <input
                              type="number"
                              value={editValues[b.id] ?? ""}
                              onChange={(e) =>
                                setEditValues((prev) => ({ ...prev, [b.id]: e.target.value }))
                              }
                              className="w-20 rounded-lg bg-card border border-border px-2 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <button
                              onClick={() => handleSaveEdit(b.id)}
                              disabled={updateMutation.isPending}
                              className="text-spendlex-green hover:text-spendlex-green/80"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => deleteMutation.mutate(b.id)}
                              disabled={deleteMutation.isPending}
                              className="text-spendlex-red hover:text-spendlex-red/80"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            ${fmt(b.spent)} of ${fmt(b.limit_amount)}
                          </p>
                        )}
                      </div>
                      <span
                        className={`font-bold text-sm ${over ? "text-spendlex-red" : "text-spendlex-green"}`}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-card rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full ${over ? "bg-spendlex-red" : pct > 80 ? "bg-spendlex-orange" : color}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {isEditing ? (
          <div className="flex gap-3 mb-6">
            <Button variant="hero" size="xl" className="flex-1" onClick={handleCancelEditing}>
              Done Editing
            </Button>
          </div>
        ) : (
          <Button variant="hero" size="xl" className="w-full mb-6" onClick={handleStartEditing}>
            <Pencil size={16} className="mr-2" />
            Edit Budgets
          </Button>
        )}
      </motion.div>
      <BottomNav />
    </div>
  );
};

export default Budget;
