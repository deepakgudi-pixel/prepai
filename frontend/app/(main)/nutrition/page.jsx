"use client";

import {
  getTodayLog,
  getDailyProgress,
  addMealToLog,
  markAsWorkoutDay,
  getMacroStreaks,
} from "@/actions/daily-nutrition.actions";
import { getFitnessProfile } from "@/actions/fitness-profile.actions";
import { getSuggestedRecipes } from "@/actions/recipe.actions";
import useFetch from "@/hooks/use-fetch";
import HealthNav from "@/components/extras/HealthNav";
import { useUser } from "@clerk/nextjs";
import {
  Apple,
  Coffee,
  Flame,
  Loader2,
  Moon,
  Plus,
  Sun,
  Utensils,
  Zap,
  TrendingUp,
  Award,
  Sparkles,
  ChefHat,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast", icon: Coffee, color: "bg-orange-500" },
  { value: "lunch", label: "Lunch", icon: Sun, color: "bg-yellow-500" },
  { value: "dinner", label: "Dinner", icon: Moon, color: "bg-indigo-500" },
  { value: "snacks", label: "Snacks", icon: Apple, color: "bg-green-500" },
  { value: "pre_workout", label: "Pre-Workout", icon: Zap, color: "bg-blue-500" },
  { value: "post_workout", label: "Post-Workout", icon: TrendingUp, color: "bg-purple-500" },
];

export default function NutritionPage() {
  const { user, isLoaded } = useUser();
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [isSuggestRecipesOpen, setIsSuggestRecipesOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState("breakfast");
  const [mealMacros, setMealMacros] = useState({
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  });

  const { loading: loadingLog, data: logData, fn: fetchLog } = useFetch(getTodayLog);
  const { loading: loadingProgress, data: progressData, fn: fetchProgress } =
    useFetch(getDailyProgress);
  const { loading: loadingProfile, data: profileData, fn: fetchProfile } =
    useFetch(getFitnessProfile);
  const { loading: loadingStreaks, data: streaksData, fn: fetchStreaks } =
    useFetch(getMacroStreaks);
  const { loading: addingMeal, fn: addMeal } = useFetch(addMealToLog);
  const { loading: togglingWorkout, fn: toggleWorkout } = useFetch(markAsWorkoutDay);
  const { loading: loadingSuggestions, data: suggestionsData, fn: fetchSuggestions } =
    useFetch(getSuggestedRecipes);

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
    const today = new Date().toISOString().split("T")[0];
    fetchLog(authUser);
    fetchProgress(authUser, today);
    fetchProfile(authUser);
    fetchStreaks(authUser);
  }, [authUser, fetchLog, fetchProgress, fetchProfile, fetchStreaks]);

  useEffect(() => {
    if (!isLoaded || !authUser) return;
    refreshData();
  }, [authUser, isLoaded, refreshData]);

  const handleAddMeal = async () => {
    if (!mealMacros.calories || !mealMacros.protein || !mealMacros.carbs || !mealMacros.fats) {
      toast.error("Please fill in all macro values");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const result = await addMeal(authUser, today, selectedMealType, {
      calories: parseFloat(mealMacros.calories),
      protein: parseFloat(mealMacros.protein),
      carbs: parseFloat(mealMacros.carbs),
      fats: parseFloat(mealMacros.fats),
    });

    if (result?.success) {
      toast.success("Meal added to today's log!");
      setIsAddMealOpen(false);
      setMealMacros({ calories: "", protein: "", carbs: "", fats: "" });
      refreshData();
    } else {
      toast.error(result?.error || "Failed to add meal");
    }
  };

  const handleToggleWorkout = async () => {
    const today = new Date().toISOString().split("T")[0];
    const isCurrentlyWorkout = logData?.log?.isWorkoutDay || false;
    
    const result = await toggleWorkout(authUser, today, !isCurrentlyWorkout);
    
    if (result?.success) {
      toast.success(isCurrentlyWorkout ? "Marked as rest day" : "Marked as workout day");
      refreshData();
    } else {
      toast.error(result?.error || "Failed to update workout day");
    }
  };

  const handleSuggestRecipes = async () => {
    const today = new Date().toISOString().split("T")[0];
    await fetchSuggestions(authUser, today);
    setIsSuggestRecipesOpen(true);
  };

  const log = logData?.log;
  const progress = progressData?.progress;
  const targets = progressData?.targets;
  const profile = profileData?.profile;
  const streaks = streaksData?.streaks;

  const getProgressColor = (percentage) => {
    if (percentage >= 95) return "bg-green-600";
    if (percentage >= 80) return "bg-yellow-600";
    return "bg-red-600";
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
                <Utensils className="size-5 sm:size-7" />
              </span>
              <p className="eyebrow">Daily Nutrition</p>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl leading-none text-[#111] mb-4 sm:mb-6">
              Track your macros,<br/>hit your targets.
            </h1>
            <p className="text-[#555] font-light leading-relaxed max-w-md mb-8">
              Log your meals throughout the day and watch your progress in real-time.
              Stay consistent, build streaks, achieve your goals.
            </p>

            {log && (
              <div className="flex flex-wrap gap-5 sm:gap-8">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#777]">
                    Calories Today
                  </p>
                  <p className="mt-3 font-display text-3xl sm:text-4xl leading-none text-[#111]">
                    {log.totals.calories}
                  </p>
                </div>
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#777]">
                    Protein
                  </p>
                  <p className="mt-3 font-display text-3xl sm:text-4xl leading-none text-[#111]">
                    {log.totals.protein}g
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Streaks Card */}
          <div className="panel-dark">
            <div className="flex items-center gap-3 mb-6">
              <Award className="size-6" />
              <h2 className="font-display text-2xl">Your Streaks</h2>
            </div>
            
            {loadingStreaks ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-8 animate-spin" />
              </div>
            ) : streaks ? (
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-[#aaa] mb-1">Current Streak</p>
                    <p className="font-display text-5xl">{streaks.currentStreak}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#aaa] mb-1">Longest</p>
                    <p className="font-display text-3xl">{streaks.longestStreak}</p>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-6">
                  <p className="text-sm text-[#aaa] mb-2">Protein Streak</p>
                  <p className="font-display text-4xl">{streaks.proteinStreak} days</p>
                </div>
                <div className="text-xs text-[#aaa]">
                  {streaks.daysTracked} days tracked total
                </div>
              </div>
            ) : (
              <p className="text-[#aaa]">Start tracking to build streaks!</p>
            )}
          </div>
        </section>

        {/* Loading State */}
        {loadingLog && (
          <section className="glass-card flex flex-col items-center justify-center px-6 py-20 sm:py-32">
            <Loader2 className="size-10 animate-spin text-[#555]" />
          </section>
        )}

        {/* Empty State - No Profile */}
        {!loadingLog && !loadingProfile && !profile && (
          <section className="glass-card px-6 py-20 text-center sm:py-32">
            <div className="mx-auto flex size-24 items-center justify-center rounded-full border border-[#D5D3CE] bg-white/50 mb-8">
              <Utensils className="size-10 text-[#222]" />
            </div>
            <h2 className="font-display text-4xl sm:text-6xl text-[#111] mb-6">
              Set up your profile first
            </h2>
            <p className="mx-auto text-lg text-[#555] font-light max-w-xl mb-12">
              Before you can track your nutrition, you need to set your macro targets in your fitness profile.
            </p>
            <Link
              href="/fitness-profile"
              className="inline-flex items-center gap-2 glass-pill bg-[#222] text-white px-8 py-4 text-xs uppercase tracking-[0.2em] hover:bg-[#111] transition-colors font-semibold"
            >
              Go to Fitness Profile
            </Link>
          </section>
        )}

        {/* Main Content */}
        {!loadingLog && log && profile && (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            
            {/* Left Column - Progress */}
            <div className="space-y-6">
              
              {/* Macro Progress */}
              <div className="glass-card p-6 sm:p-10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                  <h2 className="font-display text-3xl text-[#111]">Today&apos;s Progress</h2>
                  <button
                    onClick={handleToggleWorkout}
                    disabled={togglingWorkout}
                    className={`glass-pill px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors ${
                      log.isWorkoutDay
                        ? "bg-[#222] text-white"
                        : "bg-white/60 text-[#777]"
                    }`}
                  >
                    {togglingWorkout ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Flame className="size-4 inline mr-2" />
                        {log.isWorkoutDay ? "Workout Day" : "Rest Day"}
                      </>
                    )}
                  </button>
                </div>

                {loadingProgress ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="size-8 animate-spin text-[#555]" />
                  </div>
                ) : progress && targets ? (
                  <div className="space-y-8">
                    {/* Calories */}
                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-[#777] mb-1">
                            Calories
                          </p>
                          <p className="font-display text-2xl text-[#111]">
                            {progress.calories.current} / {progress.calories.target}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#111]">
                            {progress.calories.percentage}%
                          </p>
                          <p className="text-xs text-[#555]">
                            {progress.calories.remaining > 0 ? "remaining" : "over"}
                          </p>
                        </div>
                      </div>
                      <div className="h-3 bg-[#D5D3CE] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${getProgressColor(progress.calories.percentage)}`}
                          style={{ width: `${Math.min(progress.calories.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Protein */}
                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-[#777] mb-1">
                            Protein
                          </p>
                          <p className="font-display text-2xl text-[#111]">
                            {progress.protein.current}g / {progress.protein.target}g
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#111]">
                            {progress.protein.percentage}%
                          </p>
                          <p className="text-xs text-[#555]">
                            {progress.protein.remaining > 0 ? "remaining" : "over"}
                          </p>
                        </div>
                      </div>
                      <div className="h-3 bg-[#D5D3CE] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${getProgressColor(progress.protein.percentage)}`}
                          style={{ width: `${Math.min(progress.protein.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Carbs */}
                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-[#777] mb-1">
                            Carbs
                          </p>
                          <p className="font-display text-2xl text-[#111]">
                            {progress.carbs.current}g / {progress.carbs.target}g
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#111]">
                            {progress.carbs.percentage}%
                          </p>
                          <p className="text-xs text-[#555]">
                            {progress.carbs.remaining > 0 ? "remaining" : "over"}
                          </p>
                        </div>
                      </div>
                      <div className="h-3 bg-[#D5D3CE] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${getProgressColor(progress.carbs.percentage)}`}
                          style={{ width: `${Math.min(progress.carbs.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Fats */}
                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-[#777] mb-1">
                            Fats
                          </p>
                          <p className="font-display text-2xl text-[#111]">
                            {progress.fats.current}g / {progress.fats.target}g
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#111]">
                            {progress.fats.percentage}%
                          </p>
                          <p className="text-xs text-[#555]">
                            {progress.fats.remaining > 0 ? "remaining" : "over"}
                          </p>
                        </div>
                      </div>
                      <div className="h-3 bg-[#D5D3CE] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${getProgressColor(progress.fats.percentage)}`}
                          style={{ width: `${Math.min(progress.fats.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Add Meal Button */}
              <button
                onClick={() => setIsAddMealOpen(true)}
                className="w-full glass-card p-5 sm:p-8 hover:border-[#aaa] transition-all group"
              >
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <span className="flex size-10 sm:size-12 items-center justify-center rounded-full bg-[#222] text-white group-hover:scale-110 transition-transform">
                <Plus className="size-5 sm:size-6" />
              </span>
                  <span className="font-display text-xl sm:text-2xl text-[#111]">Add Meal</span>
                </div>
              </button>

              {/* Suggest Recipes Button */}
              <button
                onClick={handleSuggestRecipes}
                disabled={loadingSuggestions}
                className="w-full glass-card p-5 sm:p-8 hover:border-[#aaa] transition-all group bg-gradient-to-br from-purple-50 to-blue-50"
              >
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <span className="flex size-10 sm:size-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white group-hover:scale-110 transition-transform">
                    {loadingSuggestions ? (
                      <Loader2 className="size-6 animate-spin" />
                    ) : (
                      <Sparkles className="size-6" />
                    )}
                  </span>
                  <span className="font-display text-xl sm:text-2xl text-[#111]">Suggest Recipes</span>
                </div>
              </button>
            </div>

            {/* Right Column - Meal Breakdown */}
            <div className="space-y-6">
              <div className="glass-card p-6 sm:p-10">
                <h2 className="font-display text-3xl text-[#111] mb-8">Meal Breakdown</h2>
                
                <div className="space-y-4">
                  {MEAL_TYPES.map((mealType) => {
                    const meal = log.meals[mealType.value === "pre_workout" ? "preWorkout" : mealType.value === "post_workout" ? "postWorkout" : mealType.value];
                    const Icon = mealType.icon;
                    const hasData = meal && meal.calories > 0;

                    return (
                      <div
                        key={mealType.value}
                        className={`p-5 rounded-2xl border-2 transition-all ${
                          hasData
                            ? "border-[#222] bg-white/80"
                            : "border-[#D5D3CE] bg-white/40"
                        }`}
                      >
                        <div className="flex items-center gap-4 mb-3">
                          <span className={`flex size-10 items-center justify-center rounded-full ${mealType.color} text-white`}>
                            <Icon className="size-5" />
                          </span>
                          <div className="flex-1">
                            <p className="font-semibold text-[#111]">{mealType.label}</p>
                            {hasData && (
                              <p className="text-sm text-[#555]">
                                {meal.calories} cal
                              </p>
                            )}
                          </div>
                        </div>
                        {hasData && (
                          <div className="grid grid-cols-3 gap-3 text-center text-xs">
                            <div>
                              <p className="text-[#777]">Protein</p>
                              <p className="font-semibold text-[#111]">{meal.protein}g</p>
                            </div>
                            <div>
                              <p className="text-[#777]">Carbs</p>
                              <p className="font-semibold text-[#111]">{meal.carbs}g</p>
                            </div>
                            <div>
                              <p className="text-[#777]">Fats</p>
                              <p className="font-semibold text-[#111]">{meal.fats}g</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Meal Modal */}
        <AnimatePresence>
          {isAddMealOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              onClick={() => setIsAddMealOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-full max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-display text-3xl text-[#111] mb-6">Add Meal</h3>
                
                <div className="space-y-6">
                  {/* Meal Type */}
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                      Meal Type
                    </label>
                    <select
                      value={selectedMealType}
                      onChange={(e) => setSelectedMealType(e.target.value)}
                      className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-5 py-4 text-[#111] focus:border-[#222] transition-colors outline-none"
                    >
                      {MEAL_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Macros */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                        Calories
                      </label>
                      <input
                        type="number"
                        value={mealMacros.calories}
                        onChange={(e) => setMealMacros({ ...mealMacros, calories: e.target.value })}
                        className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-5 py-4 text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                        placeholder="500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                        Protein (g)
                      </label>
                      <input
                        type="number"
                        value={mealMacros.protein}
                        onChange={(e) => setMealMacros({ ...mealMacros, protein: e.target.value })}
                        className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-5 py-4 text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                        Carbs (g)
                      </label>
                      <input
                        type="number"
                        value={mealMacros.carbs}
                        onChange={(e) => setMealMacros({ ...mealMacros, carbs: e.target.value })}
                        className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-5 py-4 text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                        Fats (g)
                      </label>
                      <input
                        type="number"
                        value={mealMacros.fats}
                        onChange={(e) => setMealMacros({ ...mealMacros, fats: e.target.value })}
                        className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-5 py-4 text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                        placeholder="15"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
                    <button
                      onClick={handleAddMeal}
                      disabled={addingMeal}
                      className="flex-1 glass-pill bg-[#222] text-white px-6 py-4 text-xs uppercase tracking-[0.2em] hover:bg-[#111] transition-colors font-semibold"
                    >
                      {addingMeal ? (
                        <Loader2 className="size-4 animate-spin mx-auto" />
                      ) : (
                        "Add Meal"
                      )}
                    </button>
                    <button
                      onClick={() => setIsAddMealOpen(false)}
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

        {/* Suggest Recipes Modal */}
        <AnimatePresence>
          {isSuggestRecipesOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              onClick={() => setIsSuggestRecipesOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl p-5 sm:p-8 max-w-4xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                      <Sparkles className="size-6" />
                    </span>
                    <h3 className="font-display text-2xl sm:text-3xl text-[#111]">AI Recipe Suggestions</h3>
                  </div>
                  <button
                    onClick={() => setIsSuggestRecipesOpen(false)}
                    className="flex size-10 items-center justify-center rounded-full hover:bg-[#EAE8E3] transition-colors"
                  >
                    <X className="size-5 text-[#555]" />
                  </button>
                </div>

                {loadingSuggestions ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="size-12 animate-spin text-purple-600 mb-4" />
                    <p className="text-[#555]">Finding perfect recipes for your macros...</p>
                  </div>
                ) : suggestionsData?.success ? (
                  <div className="space-y-6">
                    {/* Remaining Macros Summary */}
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#777] mb-4">
                        Your Remaining Macros Today
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-[#555]">Calories</p>
                          <p className="font-display text-2xl text-[#111]">
                            {suggestionsData.macroData?.remaining?.calories || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[#555]">Protein</p>
                          <p className="font-display text-2xl text-[#111]">
                            {suggestionsData.macroData?.remaining?.protein || 0}g
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[#555]">Carbs</p>
                          <p className="font-display text-2xl text-[#111]">
                            {suggestionsData.macroData?.remaining?.carbs || 0}g
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[#555]">Fats</p>
                          <p className="font-display text-2xl text-[#111]">
                            {suggestionsData.macroData?.remaining?.fats || 0}g
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Recipe Suggestions */}
                    {suggestionsData.recipes && suggestionsData.recipes.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-sm text-[#555]">
                          {suggestionsData.message || `Found ${suggestionsData.recipes.length} recipes that fit your macros!`}
                        </p>
                        {suggestionsData.recipes.map((recipe) => (
                          <div
                            key={recipe.id}
                            className="bg-white/80 border-2 border-[#D5D3CE] rounded-2xl p-6 hover:border-[#aaa] transition-all"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <ChefHat className="size-5 text-purple-600" />
                                  <h4 className="font-display text-xl text-[#111]">{recipe.title}</h4>
                                  <span className="glass-pill px-3 py-1 text-xs font-semibold text-purple-600">
                                    {recipe.matchScore}% Match
                                  </span>
                                </div>
                                <p className="text-sm text-[#555] mb-3">{recipe.description}</p>
                                {recipe.aiExplanation && (
                                  <div className="bg-purple-50 rounded-xl p-3 mb-3">
                                    <p className="text-xs text-purple-900">
                                      <Sparkles className="size-3 inline mr-1" />
                                      {recipe.aiExplanation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Macro Fit */}
                            <div className="grid grid-cols-4 gap-3 mb-4">
                              <div className="text-center">
                                <p className="text-xs text-[#777]">Calories</p>
                                <p className="font-semibold text-[#111]">{recipe.macroFit?.calories || 0}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-[#777]">Protein</p>
                                <p className="font-semibold text-[#111]">{recipe.macroFit?.protein || 0}g</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-[#777]">Carbs</p>
                                <p className="font-semibold text-[#111]">{recipe.macroFit?.carbs || 0}g</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-[#777]">Fats</p>
                                <p className="font-semibold text-[#111]">{recipe.macroFit?.fats || 0}g</p>
                              </div>
                            </div>

                            {/* View Recipe Link */}
                            <Link
                              href={`/recipes?recipe=${encodeURIComponent(recipe.title)}`}
                              className="inline-flex items-center gap-2 glass-pill bg-[#222] text-white px-5 py-2 text-xs uppercase tracking-[0.2em] hover:bg-[#111] transition-colors font-semibold"
                            >
                              View Full Recipe
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <ChefHat className="size-16 text-[#D5D3CE] mx-auto mb-4" />
                        <p className="text-[#555] mb-2">{suggestionsData.message}</p>
                        <Link
                          href="/recipes"
                          className="inline-flex items-center gap-2 glass-pill bg-[#222] text-white px-5 py-3 text-xs uppercase tracking-[0.2em] hover:bg-[#111] transition-colors font-semibold mt-4"
                        >
                          Browse Recipes
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-red-600 mb-4">{suggestionsData?.message || "Failed to load suggestions"}</p>
                    <button
                      onClick={handleSuggestRecipes}
                      className="glass-pill bg-[#222] text-white px-5 py-3 text-xs uppercase tracking-[0.2em] hover:bg-[#111] transition-colors font-semibold"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
