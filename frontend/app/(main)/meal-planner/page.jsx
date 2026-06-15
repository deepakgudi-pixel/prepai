"use client";

import {
  getMealPlans,
  getActiveMealPlan,
  getMealPlanDays,
  generateWeeklyPlan,
  deleteMealPlan,
  getGroceryList,
  generateGroceryList,
} from "@/actions/meal-planning.actions";
import { getFitnessProfile } from "@/actions/fitness-profile.actions";
import useFetch from "@/hooks/use-fetch";
import HealthNav from "@/components/extras/HealthNav";
import ConfirmDialog from "@/components/extras/ConfirmDialog";
import { useUser } from "@clerk/nextjs";
import {
  Calendar,
  Loader2,
  Sparkles,
  Trash2,
  Utensils,
  Flame,
  Check,
  ShoppingCart,
  ExternalLink,
  Package,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_DISPLAY_TYPES = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snacks", label: "Snacks", accentClass: "bg-green-50/50 border-green-200", labelClass: "text-green-700" },
  { key: "preWorkout", label: "Pre-Workout", accentClass: "bg-blue-50/50 border-blue-200", labelClass: "text-blue-700" },
  { key: "postWorkout", label: "Post-Workout", accentClass: "bg-purple-50/50 border-purple-200", labelClass: "text-purple-700" },
];

const EMPTY_TOTALS = { calories: 0, protein: 0, carbs: 0, fats: 0 };

const getMealNumber = (meal, field) => Number(meal?.[field] || 0);

function MealSummaryCard({ meal, label, accentClass = "bg-white/60", labelClass = "text-[#777]" }) {
  return (
    <div className={`p-4 rounded-xl border border-transparent ${accentClass}`}>
      <p className={`text-xs uppercase tracking-[0.2em] mb-2 ${labelClass}`}>
        {label}
      </p>
      <p className="font-semibold text-[#111] mb-2">
        {meal.name || "Meal"}
      </p>
      <div className="grid grid-cols-4 gap-2 text-xs text-center">
        <div>
          <p className={labelClass}>Cal</p>
          <p className="font-semibold">{getMealNumber(meal, "calories")}</p>
        </div>
        <div>
          <p className={labelClass}>P</p>
          <p className="font-semibold">{getMealNumber(meal, "protein")}g</p>
        </div>
        <div>
          <p className={labelClass}>C</p>
          <p className="font-semibold">{getMealNumber(meal, "carbs")}g</p>
        </div>
        <div>
          <p className={labelClass}>F</p>
          <p className="font-semibold">{getMealNumber(meal, "fats")}g</p>
        </div>
      </div>
    </div>
  );
}

function GroceryListSection({
  groceryData,
  groceryList,
  loadingGroceryList,
  onRetry,
  getShoppingLink,
}) {
  const savedAt = groceryData?.generatedAt
    ? new Date(groceryData.generatedAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  if (loadingGroceryList) {
    return (
      <section className="glass-card p-6 sm:p-10">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="size-12 animate-spin text-green-700 mb-4" />
          <p className="font-display text-2xl sm:text-3xl text-[#111] mb-2">Building Grocery List</p>
          <p className="text-sm text-[#555]">Generating ingredients from the active weekly plan.</p>
        </div>
      </section>
    );
  }

  if (!groceryData) {
    return (
      <section className="glass-card p-6 sm:p-10">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-green-50 text-green-700">
            <ShoppingCart className="size-8" />
          </span>
          <h2 className="font-display text-3xl text-[#111]">No Grocery List Yet</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#555]">
            Generate a saved grocery list from this weekly plan when you are ready to shop.
          </p>
          <button
            onClick={onRetry}
            className="glass-pill mt-8 bg-[#222] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#111] sm:tracking-[0.2em]"
          >
            Generate Grocery List
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="glass-card p-6 sm:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-600 text-white">
            <ShoppingCart className="size-6" />
          </span>
          <div>
            <h2 className="font-display text-3xl text-[#111]">Grocery List</h2>
            <p className="text-sm text-[#555]">
              {[
                groceryData?.totalMeals ? `For ${groceryData.totalMeals} meals` : null,
                savedAt ? `Saved ${savedAt}` : null,
              ].filter(Boolean).join(" - ")}
            </p>
          </div>
        </div>
        <button
          onClick={onRetry}
          className="glass-pill bg-[#222] text-white px-5 py-3 text-xs uppercase hover:bg-[#111] transition-colors font-semibold"
        >
          Refresh List
        </button>
      </div>

      {groceryData?.success ? (
        <div className="space-y-6">
          {groceryList.length > 0 ? (
            groceryList.map((category, catIndex) => (
              <div key={catIndex} className="rounded-2xl border-2 border-[#D5D3CE] bg-white/40 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Package className="size-5 text-green-700" />
                  <h3 className="font-display text-2xl text-[#111]">{category.category}</h3>
                  <span className="text-sm text-[#555]">({category.items?.length || 0} items)</span>
                </div>

                <div className="space-y-3">
                  {category.items?.map((item, itemIndex) => {
                    const links = getShoppingLink(item.name);
                    return (
                      <div
                        key={itemIndex}
                        className="flex flex-col gap-4 rounded-xl bg-white/60 p-4 transition-colors hover:bg-white/80 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#111]">{item.name}</p>
                          <p className="text-sm text-[#555]">{item.quantity}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <a
                            href={links.blinkit}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-yellow-100 px-3 py-2 text-xs font-semibold text-yellow-900 transition-colors hover:bg-yellow-200"
                          >
                            Blinkit
                            <ExternalLink className="size-3" />
                          </a>
                          <a
                            href={links.zepto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-purple-100 px-3 py-2 text-xs font-semibold text-purple-900 transition-colors hover:bg-purple-200"
                          >
                            Zepto
                            <ExternalLink className="size-3" />
                          </a>
                          <a
                            href={links.amazon}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-orange-100 px-3 py-2 text-xs font-semibold text-orange-900 transition-colors hover:bg-orange-200"
                          >
                            Amazon
                            <ExternalLink className="size-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <Package className="size-16 text-[#D5D3CE] mx-auto mb-4" />
              <p className="text-[#555]">No items in grocery list</p>
            </div>
          )}

          {groceryData.fallbackUsed && (
            <div className="rounded-2xl border-2 border-yellow-200 bg-yellow-50 p-4 text-center">
              <p className="text-sm text-yellow-900">
                AI was unavailable. This is a basic grocery list.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-red-600 mb-4">
            {groceryData?.message || "Failed to generate grocery list"}
          </p>
          <button
            onClick={onRetry}
            className="glass-pill bg-[#222] text-white px-5 py-3 text-xs uppercase tracking-[0.2em] hover:bg-[#111] transition-colors font-semibold"
          >
            Try Again
          </button>
        </div>
      )}
    </section>
  );
}

export default function MealPlannerPage() {
  const { user, isLoaded } = useUser();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [groceryData, setGroceryData] = useState(undefined);
  const [activeOutputTab, setActiveOutputTab] = useState("weekly");
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [planPendingDelete, setPlanPendingDelete] = useState(null);
  const [generatePrefs, setGeneratePrefs] = useState({
    workoutDays: [1, 3, 5],
    mealsPerDay: 3,
    includeSnacks: true,
  });

  const { loading: loadingPlans, data: plansData, fn: fetchPlans } = useFetch(getMealPlans);
  const { loading: loadingActive, fn: fetchActive } = useFetch(getActiveMealPlan);
  const { loading: loadingDays, data: daysData, fn: fetchDays, setData: setDaysData } = useFetch(getMealPlanDays);
  const { loading: loadingProfile, data: profileData, fn: fetchProfile } = useFetch(getFitnessProfile);
  const { loading: generating, fn: generatePlan } = useFetch(generateWeeklyPlan);
  const { loading: deleting, fn: deletePlanAction } = useFetch(deleteMealPlan);
  const { loading: loadingSavedGroceryList, fn: fetchSavedGroceryList } = useFetch(getGroceryList);
  const { loading: generatingGroceryList, fn: generateGroceryListAction } = useFetch(generateGroceryList);

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
    const loadData = async () => {
      const [activeResult] = await Promise.all([
        fetchActive(authUser),
        fetchPlans(authUser, false),
        fetchProfile(authUser),
      ]);

      const activePlan = activeResult?.mealPlan || null;
      setSelectedPlan(activePlan);
      setGroceryData(undefined);

      if (activePlan?.id) {
        const [, groceryResult] = await Promise.all([
          fetchDays(authUser, activePlan.id),
          fetchSavedGroceryList(authUser, activePlan.id),
        ]);

        setGroceryData(groceryResult?.hasGroceryList ? groceryResult : undefined);
      } else {
        setDaysData({ success: true, days: [] });
        setActiveOutputTab("weekly");
      }
    };

    loadData();
  }, [authUser, fetchActive, fetchDays, fetchPlans, fetchProfile, fetchSavedGroceryList, setDaysData]);

  useEffect(() => {
    if (!isLoaded || !authUser) return;
    refreshData();
  }, [authUser, isLoaded, refreshData]);

  const handleGeneratePlan = async () => {
    if (!authUser) {
      toast.error("Please sign in to generate a meal plan");
      return;
    }

    const result = await generatePlan(authUser, generatePrefs);

    if (result?.success) {
      toast.success("Weekly meal plan generated!");
      setIsGenerateModalOpen(false);
      setGroceryData(undefined);
      setActiveOutputTab("weekly");
      if (result.mealPlan) {
        setSelectedPlan(result.mealPlan);
        setDaysData({ success: true, days: result.days || [] });
      }
      refreshData();
    } else {
      toast.error(result?.error || "Failed to generate meal plan");
    }
  };

  const handleDeletePlan = async () => {
    if (!planPendingDelete) return;

    const result = await deletePlanAction(authUser, planPendingDelete.id);

    if (result?.success) {
      toast.success("Meal plan deleted");
      setPlanPendingDelete(null);
      setSelectedPlan(null);
      setDaysData({ success: true, days: [] });
      setGroceryData(undefined);
      setActiveOutputTab("weekly");
      refreshData();
    } else {
      toast.error(result?.error || "Failed to delete meal plan");
    }
  };

  const toggleWorkoutDay = (day) => {
    setGeneratePrefs((prev) => ({
      ...prev,
      workoutDays: prev.workoutDays.includes(day)
        ? prev.workoutDays.filter((d) => d !== day)
        : [...prev.workoutDays, day],
    }));
  };

  const handleGenerateGroceryList = async () => {
    if (!authUser) {
      toast.error("Please sign in to generate a grocery list");
      return;
    }

    if (!selectedPlan) {
      toast.error("No active meal plan selected");
      return;
    }

    setActiveOutputTab("grocery");

    const result = await generateGroceryListAction(authUser, selectedPlan.id, {
      force: groceryData?.hasGroceryList === true,
    });

    if (result?.success) {
      setGroceryData(result?.hasGroceryList ? result : undefined);
      toast.success(result?.cached ? "Saved grocery list loaded" : "Grocery list saved");
    } else {
      toast.error(result?.message || result?.error || "Failed to generate grocery list");
    }
  };

  const getShoppingLink = (itemName) => {
    const searchQuery = encodeURIComponent(itemName);
    return {
      blinkit: `https://blinkit.com/s/?q=${searchQuery}`,
      zepto: `https://www.zepto.com/search?query=${searchQuery}`,
      amazon: `https://www.amazon.in/s?k=${searchQuery}`,
    };
  };

  const plans = plansData?.mealPlans || [];
  const days = daysData?.days || [];
  const profile = profileData?.profile;
  const groceryList = groceryData?.groceryList || [];
  const hasGeneratedOutput = selectedPlan && days.length > 0;

  return (
    <div className="bg-[#EAE8E3] min-h-screen pb-32">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12 lg:px-20 pt-32 space-y-8">
        <HealthNav />
        
        {/* Header */}
        <section className="grid items-stretch gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="glass-card p-6 sm:p-14">
            <div className="flex items-center gap-3 sm:gap-4 mb-5">
              <span className="flex size-11 sm:size-14 shrink-0 items-center justify-center rounded-full bg-[#222] text-[#EAE8E3]">
                <Calendar className="size-5 sm:size-7" />
              </span>
              <p className="eyebrow">Meal Planner</p>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl leading-none text-[#111] mb-4 sm:mb-6">
              Plan your week,<br/>hit your macros.
            </h1>
            <p className="text-[#555] font-light leading-relaxed max-w-md mb-8">
              Create custom meal plans or let AI generate a week of meals optimized
              for your macro targets and workout schedule.
            </p>

            <div className="flex flex-wrap gap-5 sm:gap-8">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#777]">
                  Total Plans
                </p>
                <p className="mt-3 font-display text-3xl sm:text-4xl leading-none text-[#111]">
                  {plans.length}
                </p>
              </div>
              {selectedPlan && (
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#777]">
                    Active Plan
                  </p>
                  <p className="mt-3 font-display text-3xl sm:text-4xl leading-none text-[#111]">
                    {days.length} days
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Macro Targets */}
          <div className="panel-dark">
            <div className="flex items-center gap-3 mb-6">
              <Utensils className="size-6" />
              <h2 className="font-display text-2xl">Your Macro Targets</h2>
            </div>
            
            {loadingProfile ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-8 animate-spin" />
              </div>
            ) : profile ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-[#aaa] mb-1">Calories</p>
                    <p className="font-display text-4xl">{profile.targetCalories}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#aaa] mb-1">Protein</p>
                    <p className="font-display text-4xl">{profile.targetProtein}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#aaa] mb-1">Carbs</p>
                    <p className="font-display text-3xl">{profile.targetCarbs}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#aaa] mb-1">Fats</p>
                    <p className="font-display text-3xl">{profile.targetFats}g</p>
                  </div>
                </div>
                <div className="text-xs text-[#aaa] border-t border-white/10 pt-4 capitalize">
                  Goal: {profile.fitnessGoal?.replace("_", " ")}
                </div>
              </div>
            ) : (
              <p className="text-[#aaa]">Set up your fitness profile first!</p>
            )}
          </div>
        </section>

        {/* Plan Actions */}
        <section className="glass-card p-4 sm:p-6">
          <div className={`grid gap-3 ${selectedPlan && days.length > 0 ? "sm:grid-cols-2" : ""}`}>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="flex items-center justify-center gap-3 rounded-2xl border border-[#D5D3CE] bg-white/50 px-5 py-5 text-[#111] transition-colors hover:border-[#aaa] hover:bg-white/70"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-[#222] text-white">
                <Sparkles className="size-5" />
              </span>
              <span className="font-display text-xl">Generate Weekly Plan</span>
            </button>

            {selectedPlan && days.length > 0 && (
              <button
                onClick={handleGenerateGroceryList}
                disabled={loadingSavedGroceryList || generatingGroceryList}
                className="flex items-center justify-center gap-3 rounded-2xl border border-green-200 bg-green-50/70 px-5 py-5 text-[#111] transition-colors hover:border-green-300 hover:bg-green-50 disabled:opacity-70"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-600 text-white">
                  {generatingGroceryList ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="size-5" />
                  )}
                </span>
                <span className="font-display text-xl">
                  {groceryData?.hasGroceryList ? "Refresh Grocery List" : "Generate Grocery List"}
                </span>
              </button>
            )}
          </div>
        </section>

        {/* Loading State */}
        {(loadingPlans || loadingActive) && (
          <section className="glass-card flex flex-col items-center justify-center px-6 py-20 sm:py-32">
            <Loader2 className="size-10 animate-spin text-[#555]" />
          </section>
        )}

        {/* Empty State - No Profile */}
        {!loadingPlans && !loadingActive && !loadingProfile && !profile && (
          <section className="glass-card px-6 py-20 text-center sm:py-32">
            <div className="mx-auto flex size-24 items-center justify-center rounded-full border border-[#D5D3CE] bg-white/50 mb-8">
              <Calendar className="size-10 text-[#222]" />
            </div>
            <h2 className="font-display text-4xl sm:text-6xl text-[#111] mb-6">
              Set up your profile first
            </h2>
            <p className="mx-auto text-lg text-[#555] font-light max-w-xl mb-12">
              Before you can create meal plans, you need to set your macro targets in your fitness profile.
            </p>
            <a
              href="/fitness-profile"
              className="inline-flex items-center gap-2 glass-pill bg-[#222] text-white px-6 sm:px-8 py-4 text-xs uppercase hover:bg-[#111] transition-colors font-semibold"
            >
              Go to Fitness Profile
            </a>
          </section>
        )}

        {hasGeneratedOutput && profile && (
          <section className="glass-card p-2">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { key: "weekly", label: "Weekly Plan", icon: Calendar },
                { key: "grocery", label: "Grocery List", icon: ShoppingCart },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeOutputTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveOutputTab(tab.key)}
                    className={`flex items-center justify-center gap-3 rounded-2xl px-5 py-4 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-[#222] text-[#EAE8E3]"
                        : "text-[#555] hover:bg-white/60 hover:text-[#111]"
                    }`}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                    {tab.key === "grocery" && groceryData?.hasGroceryList && (
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[0.65rem] uppercase">
                        Saved
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {hasGeneratedOutput && profile && activeOutputTab === "grocery" && (
          <GroceryListSection
            groceryData={groceryData}
            groceryList={groceryList}
            loadingGroceryList={loadingSavedGroceryList || generatingGroceryList}
            onRetry={handleGenerateGroceryList}
            getShoppingLink={getShoppingLink}
          />
        )}

        {/* Active Meal Plan */}
        {!loadingPlans && !loadingActive && profile && selectedPlan && activeOutputTab === "weekly" && (
          <section className="glass-card p-6 sm:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl text-[#111] mb-2">{selectedPlan.name}</h2>
                <p className="text-sm text-[#555]">
                  {new Date(selectedPlan.startDate).toLocaleDateString()} - {new Date(selectedPlan.endDate).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setPlanPendingDelete(selectedPlan)}
                disabled={deleting}
                className="flex size-10 items-center justify-center rounded-full text-[#777] transition-colors hover:bg-red-50 hover:text-red-700"
                aria-label={`Delete ${selectedPlan.name}`}
              >
                <Trash2 className="size-5" />
              </button>
            </div>

            {loadingDays ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-8 animate-spin text-[#555]" />
              </div>
            ) : days.length > 0 ? (
              <div className="space-y-4">
                {days.map((day, i) => {
                  const meals = day.meals || {};
                  const totals = day.totals || EMPTY_TOTALS;
                  const visibleMeals = MEAL_DISPLAY_TYPES.filter(({ key }) => meals[key]);

                  return (
                    <motion.div
                      key={day.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card p-6 group hover:border-[#aaa] transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-display text-2xl text-[#111]">
                              Day {day.dayNumber} - {DAYS_OF_WEEK[(day.dayNumber - 1) % 7]}
                            </h3>
                            {day.isWorkoutDay && (
                              <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">
                                <Flame className="size-3" />
                                Workout Day
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#555]">
                            {day.date ? new Date(day.date).toLocaleDateString() : "No date set"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#777] mb-1">Total Macros</p>
                          <p className="font-display text-xl text-[#111]">
                            {totals.calories || 0} cal
                          </p>
                        </div>
                      </div>

                      {visibleMeals.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                          {visibleMeals.map(({ key, label, accentClass, labelClass }) => (
                            <MealSummaryCard
                              key={key}
                              meal={meals[key]}
                              label={label}
                              accentClass={accentClass}
                              labelClass={labelClass}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-[#555]">No meals added for this day.</p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-[#555] py-12">No meals in this plan yet.</p>
            )}
          </section>
        )}

        {/* Empty State */}
        {!loadingPlans && !loadingActive && profile && !selectedPlan && (
          <section className="glass-card px-6 py-20 text-center sm:py-32">
            <div className="mx-auto flex size-24 items-center justify-center rounded-full border border-[#D5D3CE] bg-white/50 mb-8">
              <Calendar className="size-10 text-[#222]" />
            </div>
            <h2 className="font-display text-4xl sm:text-6xl text-[#111] mb-6">
              No meal plans yet.
            </h2>
            <p className="mx-auto text-lg text-[#555] font-light max-w-xl mb-12">
              Generate your first weekly meal plan optimized for your macro targets.
            </p>
          </section>
        )}

        {/* Generate Plan Modal */}
        <AnimatePresence>
          {isGenerateModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[220] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
              onClick={() => setIsGenerateModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="generate-plan-title"
                className="max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <h3 id="generate-plan-title" className="font-display text-2xl text-[#111] sm:text-3xl">
                    Generate Weekly Plan
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsGenerateModalOpen(false)}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#777] transition-colors hover:bg-[#EAE8E3] hover:text-[#111]"
                    aria-label="Close generate plan dialog"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Workout Days */}
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                      Workout Days
                    </label>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                      {DAYS_OF_WEEK.map((day, index) => (
                        <button
                          key={index}
                          onClick={() => toggleWorkoutDay(index + 1)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            generatePrefs.workoutDays.includes(index + 1)
                              ? "border-[#222] bg-[#222] text-white"
                              : "border-[#D5D3CE] bg-white/40 text-[#111]"
                          }`}
                        >
                          <p className="text-xs font-semibold">{day.slice(0, 3)}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Meals Per Day */}
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                      Meals Per Day
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[3, 4, 5].map((num) => (
                        <button
                          key={num}
                          onClick={() => setGeneratePrefs({ ...generatePrefs, mealsPerDay: num })}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            generatePrefs.mealsPerDay === num
                              ? "border-[#222] bg-white/80"
                              : "border-[#D5D3CE] bg-white/40 hover:border-[#aaa]"
                          }`}
                        >
                          <p className="font-display text-2xl text-[#111]">{num}</p>
                          <p className="text-xs text-[#555]">meals</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Include Snacks */}
                  <div>
                    <button
                      onClick={() => setGeneratePrefs({
                        ...generatePrefs,
                        includeSnacks: !generatePrefs.includeSnacks
                      })}
                      className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                        generatePrefs.includeSnacks
                          ? "border-[#222] bg-white/80"
                          : "border-[#D5D3CE] bg-white/40"
                      }`}
                    >
                      <div className="text-left">
                        <p className="font-semibold text-[#111] mb-1">Include Snacks</p>
                        <p className="text-sm text-[#555]">Add healthy snacks between meals</p>
                      </div>
                      {generatePrefs.includeSnacks && (
                        <Check className="size-6 text-[#222]" />
                      )}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
                    <button
                      onClick={handleGeneratePlan}
                      disabled={generating}
                      className="flex-1 glass-pill bg-[#222] text-white px-6 py-4 text-xs uppercase tracking-[0.2em] hover:bg-[#111] transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                      {generating ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="size-4" />
                          Generate Plan
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setIsGenerateModalOpen(false)}
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
          open={Boolean(planPendingDelete)}
          title="Delete meal plan?"
          description={`This removes ${planPendingDelete?.name || "this meal plan"} and its saved weekly meals. Grocery list data for this plan will no longer be available.`}
          confirmLabel="Delete Plan"
          loading={deleting}
          onCancel={() => setPlanPendingDelete(null)}
          onConfirm={handleDeletePlan}
        />

      </div>
    </div>
  );
}
