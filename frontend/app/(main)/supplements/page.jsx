"use client";

import {
  getSupplements,
  getSupplementSuggestions,
  addSupplement,
  deleteSupplement,
  getTodaySupplementLogs,
  logSupplement,
} from "@/actions/supplement.actions";
import useFetch from "@/hooks/use-fetch";
import HealthNav from "@/components/extras/HealthNav";
import ConfirmDialog from "@/components/extras/ConfirmDialog";
import { useUser } from "@clerk/nextjs";
import {
  Check,
  Pill,
  Loader2,
  Plus,
  Trash2,
  X,
  Lightbulb,
  Clock,
  Sunrise,
  Dumbbell,
  Moon,
  Timer,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const TIMING_OPTIONS = [
  { value: "morning", label: "Morning", icon: Sunrise },
  { value: "pre_workout", label: "Pre-Workout", icon: Dumbbell },
  { value: "post_workout", label: "Post-Workout", icon: Dumbbell },
  { value: "evening", label: "Evening", icon: Moon },
  { value: "any", label: "Anytime", icon: Timer },
];

const getTimingValue = (timing) => {
  if (Array.isArray(timing)) {
    return timing[0] || "any";
  }

  return timing || "any";
};

export default function SupplementsPage() {
  const { user, isLoaded } = useUser();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [supplementPendingDelete, setSupplementPendingDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    servingSize: "",
    servingsPerContainer: "",
    macros: {
      calories: "",
      protein: "",
      carbs: "",
      fats: "",
    },
    timing: "any",
    notes: "",
  });

  const { loading: loadingSupplements, data: supplementsData, fn: fetchSupplements } =
    useFetch(getSupplements);
  const { loading: loadingSuggestions, data: suggestionsData, fn: fetchSuggestions } =
    useFetch(getSupplementSuggestions);
  const { loading: loadingToday, data: todayData, fn: fetchToday } =
    useFetch(getTodaySupplementLogs);
  const { loading: adding, fn: addSupplementAction } = useFetch(addSupplement);
  const { loading: deleting, fn: deleteSupplementAction } = useFetch(deleteSupplement);
  const { loading: logging, fn: logSupplementAction } = useFetch(logSupplement);

  const authUser = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress || "",
      username: user.username || user.primaryEmailAddress?.emailAddress?.split("@")[0] || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      imageUrl: user.imageUrl || "",
    };
  }, [user]);

  const refreshData = useCallback(() => {
    if (!authUser) return;
    fetchSupplements(authUser);
    fetchSuggestions(authUser);
    fetchToday(authUser);
  }, [authUser, fetchSupplements, fetchSuggestions, fetchToday]);

  useEffect(() => {
    if (!isLoaded || !authUser) return;
    refreshData();
  }, [authUser, isLoaded, refreshData]);

  const handleAddSupplement = async () => {
    if (!formData.name) {
      toast.error("Supplement name is required");
      return;
    }

    const supplementData = {
      name: formData.name,
      brand: formData.brand || null,
      servingSize: formData.servingSize || null,
      servingsPerContainer: formData.servingsPerContainer ? parseInt(formData.servingsPerContainer) : null,
      macros: {
        calories: formData.macros.calories ? parseFloat(formData.macros.calories) : 0,
        protein: formData.macros.protein ? parseFloat(formData.macros.protein) : 0,
        carbs: formData.macros.carbs ? parseFloat(formData.macros.carbs) : 0,
        fats: formData.macros.fats ? parseFloat(formData.macros.fats) : 0,
      },
      timing: formData.timing,
      notes: formData.notes || null,
    };

    const result = await addSupplementAction(authUser, supplementData);

    if (result?.success) {
      toast.success("Supplement added successfully!");
      setIsAddModalOpen(false);
      setFormData({
        name: "",
        brand: "",
        servingSize: "",
        servingsPerContainer: "",
        macros: { calories: "", protein: "", carbs: "", fats: "" },
        timing: "any",
        notes: "",
      });
      refreshData();
    } else {
      toast.error(result?.error || "Failed to add supplement");
    }
  };

  const handleDelete = async () => {
    if (!supplementPendingDelete) return;

    const result = await deleteSupplementAction(authUser, supplementPendingDelete.id);

    if (result?.success) {
      toast.success("Supplement deleted");
      setSupplementPendingDelete(null);
      refreshData();
    } else {
      toast.error(result?.error || "Failed to delete supplement");
    }
  };

  const handleLogSupplement = async (supplementId, supplementName) => {
    const result = await logSupplementAction(authUser, supplementId, 1, new Date().toISOString(), null);

    if (result?.success) {
      toast.success(`Logged ${supplementName}`);
      refreshData();
    } else {
      toast.error(result?.error || "Failed to log supplement");
    }
  };

  const supplements = supplementsData?.supplements || [];
  const suggestions = suggestionsData?.suggestions || [];
  const todayLogs = todayData?.logs || [];
  const totalMacros = todayData?.totalMacros || { calories: 0, protein: 0, carbs: 0, fats: 0 };

  const isLoggedToday = (supplementId) => {
    return todayLogs.some((log) => log.supplementId === supplementId);
  };

  return (
    <div className="bg-[#EAE8E3] min-h-screen pb-32">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12 lg:px-20 pt-32 space-y-8">
        <HealthNav />
        
        {/* Header */}
        <section className="grid items-stretch gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="glass-card p-6 sm:p-14">
            <div className="flex items-center gap-3 sm:gap-4 mb-5">
              <span className="flex size-11 sm:size-14 shrink-0 items-center justify-center rounded-full bg-[#222] text-[#EAE8E3]">
                <Pill className="size-5 sm:size-7" />
              </span>
              <p className="eyebrow">Supplement Tracker</p>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl leading-none text-[#111] mb-4 sm:mb-6">
              Track your supplements,<br/>optimize your stack.
            </h1>
            <p className="text-[#555] font-light leading-relaxed max-w-md mb-8">
              Manage your supplement inventory, log daily intake, and see how they contribute
              to your macro targets.
            </p>

            <div className="flex flex-wrap gap-5 sm:gap-8">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#777]">
                  In Stack
                </p>
                <p className="mt-3 font-display text-3xl sm:text-4xl leading-none text-[#111]">
                  {supplements.length}
                </p>
              </div>
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#777]">
                  Logged Today
                </p>
                <p className="mt-3 font-display text-3xl sm:text-4xl leading-none text-[#111]">
                  {todayLogs.length}
                </p>
              </div>
            </div>
          </div>

          {/* Today's Macros from Supplements */}
          <div className="panel-dark">
            <div className="flex items-center gap-3 mb-6">
              <Pill className="size-6" />
              <h2 className="font-display text-2xl">Today&apos;s Supplement Macros</h2>
            </div>
            
            {loadingToday ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-[#aaa] mb-1">Calories</p>
                    <p className="font-display text-4xl">{totalMacros.calories}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#aaa] mb-1">Protein</p>
                    <p className="font-display text-4xl">{totalMacros.protein}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#aaa] mb-1">Carbs</p>
                    <p className="font-display text-3xl">{totalMacros.carbs}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#aaa] mb-1">Fats</p>
                    <p className="font-display text-3xl">{totalMacros.fats}g</p>
                  </div>
                </div>
                <div className="text-xs text-[#aaa] border-t border-white/10 pt-4">
                  These macros are included in your daily nutrition totals
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Suggestions */}
        {!loadingSuggestions && suggestions.length > 0 && (
          <section className="glass-card p-6 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <Lightbulb className="size-6 text-[#222]" />
              <h2 className="font-display text-3xl text-[#111]">Suggested for Your Goal</h2>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((suggestion, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-5 rounded-2xl border-2 border-[#D5D3CE] bg-white/40"
                >
                  <p className="font-semibold text-[#111] mb-2">{suggestion.name}</p>
                  <p className="text-sm text-[#555] mb-3">{suggestion.reason}</p>
                  <div className="flex items-center gap-2 text-xs text-[#777]">
                    <Clock className="size-3" />
                    <span className="capitalize">{getTimingValue(suggestion.timing).replace("_", " ")}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Add Supplement Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full glass-card p-5 sm:p-8 hover:border-[#aaa] transition-all group"
        >
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <span className="flex size-10 sm:size-12 items-center justify-center rounded-full bg-[#222] text-white group-hover:scale-110 transition-transform">
              <Plus className="size-5 sm:size-6" />
            </span>
            <span className="font-display text-xl sm:text-2xl text-[#111]">Add Supplement</span>
          </div>
        </button>

        {/* Loading State */}
        {loadingSupplements && (
          <section className="glass-card flex flex-col items-center justify-center px-6 py-20 sm:py-32">
            <Loader2 className="size-10 animate-spin text-[#555]" />
          </section>
        )}

        {/* Supplements List */}
        {!loadingSupplements && supplements.length > 0 && (
          <section className="glass-card p-6 sm:p-10">
            <h2 className="font-display text-3xl text-[#111] mb-8">Your Supplement Stack</h2>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {supplements.map((supplement, i) => {
                  const logged = isLoggedToday(supplement.id);
                  const timingOption = TIMING_OPTIONS.find((t) => t.value === getTimingValue(supplement.timing));
                  const TimingIcon = timingOption?.icon || Clock;

                  return (
                    <motion.div
                      key={supplement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className={`p-6 rounded-2xl border-2 transition-all group ${
                        logged
                          ? "border-green-600 bg-green-50/50"
                          : "border-[#D5D3CE] bg-white/40 hover:border-[#aaa]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-2xl text-[#111] mb-1">
                            {supplement.name}
                          </h3>
                          {supplement.brand && (
                            <p className="text-sm text-[#555]">{supplement.brand}</p>
                          )}
                        </div>
                        <button
                          onClick={() => setSupplementPendingDelete(supplement)}
                          disabled={deleting}
                          className="shrink-0 text-[#777] opacity-100 transition-opacity hover:text-red-700 sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label={`Delete ${supplement.name}`}
                        >
                          <Trash2 className="size-5" />
                        </button>
                      </div>

                      {supplement.servingSize && (
                        <p className="text-xs text-[#777] mb-3">
                          Serving: {supplement.servingSize}
                        </p>
                      )}

                      {supplement.macros && (supplement.macros.calories > 0 || supplement.macros.protein > 0) && (
                        <div className="grid grid-cols-4 gap-2 text-center text-xs mb-4 p-3 bg-[#EAE8E3]/50 rounded-xl">
                          <div>
                            <p className="text-[#777]">Cal</p>
                            <p className="font-semibold text-[#111]">{supplement.macros.calories}</p>
                          </div>
                          <div>
                            <p className="text-[#777]">Pro</p>
                            <p className="font-semibold text-[#111]">{supplement.macros.protein}g</p>
                          </div>
                          <div>
                            <p className="text-[#777]">Carb</p>
                            <p className="font-semibold text-[#111]">{supplement.macros.carbs}g</p>
                          </div>
                          <div>
                            <p className="text-[#777]">Fat</p>
                            <p className="font-semibold text-[#111]">{supplement.macros.fats}g</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-[#D5D3CE]">
                        <div className="flex items-center gap-2 text-xs text-[#777]">
                          <TimingIcon className="size-3" />
                          <span className="capitalize">{timingOption?.label}</span>
                        </div>
                        <button
                          onClick={() => handleLogSupplement(supplement.id, supplement.name)}
                          disabled={logging || logged}
                          className={`glass-pill px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors font-semibold ${
                            logged
                              ? "bg-green-600 text-white"
                              : "bg-[#222] text-white hover:bg-[#111]"
                          }`}
                        >
                          {logging ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : logged ? (
                            <>
                              <Check className="size-3 inline mr-1" />
                              Logged
                            </>
                          ) : (
                            "Log"
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loadingSupplements && supplements.length === 0 && (
          <section className="glass-card px-6 py-20 text-center sm:py-32">
            <div className="mx-auto flex size-24 items-center justify-center rounded-full border border-[#D5D3CE] bg-white/50 mb-8">
              <Pill className="size-10 text-[#222]" />
            </div>
            <h2 className="font-display text-4xl sm:text-6xl text-[#111] mb-6">
              No supplements yet.
            </h2>
            <p className="mx-auto text-lg text-[#555] font-light max-w-xl mb-12">
              Add your supplements to track daily intake and see their macro contributions.
            </p>
          </section>
        )}

        {/* Add Supplement Modal */}
        <AnimatePresence>
          {isAddModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[220] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
              onClick={() => setIsAddModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-supplement-title"
                className="max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center gap-4 mb-6">
                  <h3 id="add-supplement-title" className="font-display text-2xl sm:text-3xl text-[#111]">Add Supplement</h3>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#777] transition-colors hover:bg-[#EAE8E3] hover:text-[#111]"
                    aria-label="Close add supplement dialog"
                  >
                    <X className="size-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-5 py-4 text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                        placeholder="Whey Protein"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                        Brand
                      </label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-5 py-4 text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                        placeholder="Optimum Nutrition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                        Serving Size
                      </label>
                      <input
                        type="text"
                        value={formData.servingSize}
                        onChange={(e) => setFormData({ ...formData, servingSize: e.target.value })}
                        className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-5 py-4 text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                        placeholder="30g"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                        Servings Per Container
                      </label>
                      <input
                        type="number"
                        value={formData.servingsPerContainer}
                        onChange={(e) => setFormData({ ...formData, servingsPerContainer: e.target.value })}
                        className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-5 py-4 text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                        placeholder="30"
                      />
                    </div>
                  </div>

                  {/* Macros */}
                  <div>
                    <h4 className="text-sm font-semibold text-[#111] mb-4">Macros per Serving</h4>
                    <div className="grid gap-4 sm:grid-cols-4">
                      <div>
                        <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                          Calories
                        </label>
                        <input
                          type="number"
                          value={formData.macros.calories}
                          onChange={(e) => setFormData({
                            ...formData,
                            macros: { ...formData.macros, calories: e.target.value }
                          })}
                          className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-4 py-3 text-sm text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                          placeholder="120"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                          Protein (g)
                        </label>
                        <input
                          type="number"
                          value={formData.macros.protein}
                          onChange={(e) => setFormData({
                            ...formData,
                            macros: { ...formData.macros, protein: e.target.value }
                          })}
                          className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-4 py-3 text-sm text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                          placeholder="24"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                          Carbs (g)
                        </label>
                        <input
                          type="number"
                          value={formData.macros.carbs}
                          onChange={(e) => setFormData({
                            ...formData,
                            macros: { ...formData.macros, carbs: e.target.value }
                          })}
                          className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-4 py-3 text-sm text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                          placeholder="3"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                          Fats (g)
                        </label>
                        <input
                          type="number"
                          value={formData.macros.fats}
                          onChange={(e) => setFormData({
                            ...formData,
                            macros: { ...formData.macros, fats: e.target.value }
                          })}
                          className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-4 py-3 text-sm text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                          placeholder="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Timing */}
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                      Best Time to Take
                    </label>
                    <div className="grid gap-3 sm:grid-cols-5">
                      {TIMING_OPTIONS.map((option) => {
                        const Icon = option.icon;

                        return (
                          <button
                            key={option.value}
                            onClick={() => setFormData({ ...formData, timing: option.value })}
                            className={`p-4 rounded-2xl border-2 transition-all text-center ${
                              formData.timing === option.value
                                ? "border-[#222] bg-white/80"
                                : "border-[#D5D3CE] bg-white/40 hover:border-[#aaa]"
                            }`}
                          >
                            <Icon className="mx-auto mb-2 size-5 text-[#222]" />
                            <p className="text-xs font-semibold text-[#111]">{option.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-5 py-4 text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none resize-none"
                      rows="2"
                      placeholder="Any additional notes..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
                    <button
                      onClick={handleAddSupplement}
                      disabled={adding}
                      className="flex-1 glass-pill bg-[#222] text-white px-6 py-4 text-xs uppercase tracking-[0.2em] hover:bg-[#111] transition-colors font-semibold"
                    >
                      {adding ? (
                        <Loader2 className="size-4 animate-spin mx-auto" />
                      ) : (
                        "Add Supplement"
                      )}
                    </button>
                    <button
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1 glass-pill px-6 py-4 text-xs uppercase tracking-[0.2em] text-[#777] hover:text-[#111] transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <ConfirmDialog
          open={Boolean(supplementPendingDelete)}
          title="Delete supplement?"
          description={`This removes ${supplementPendingDelete?.name || "this supplement"} from your stack. Today's logged history stays separate, but the saved supplement cannot be restored here.`}
          confirmLabel="Delete"
          loading={deleting}
          onCancel={() => setSupplementPendingDelete(null)}
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}
