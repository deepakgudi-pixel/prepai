"use client";

import {
  getMacroStreaks,
  getWeeklySummary,
} from "@/actions/daily-nutrition.actions";
import {
  getProgressSummary,
  getBodyMeasurements,
} from "@/actions/body-tracking.actions";
import { getFitnessProfile } from "@/actions/fitness-profile.actions";
import useFetch from "@/hooks/use-fetch";
import HealthNav from "@/components/extras/HealthNav";
import { useUser } from "@clerk/nextjs";
import {
  Award,
  TrendingUp,
  TrendingDown,
  Loader2,
  Target,
  Flame,
  Calendar,
  Scale,
  Activity,
} from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

const getWeightValue = (measurement) =>
  measurement?.weightKg ?? measurement?.weight ?? null;

const calculateGoalProgress = (startingWeight, currentWeight, targetWeight) => {
  if (!startingWeight || !currentWeight || !targetWeight) {
    return 0;
  }

  const totalDistance = Math.abs(startingWeight - targetWeight);
  if (totalDistance === 0) {
    return 100;
  }

  const remainingDistance = Math.abs(currentWeight - targetWeight);
  return Math.min(Math.max(Math.round(((totalDistance - remainingDistance) / totalDistance) * 100), 0), 100);
};

export default function ProgressPage() {
  const { user, isLoaded } = useUser();

  const { loading: loadingStreaks, data: streaksData, fn: fetchStreaks } =
    useFetch(getMacroStreaks);
  const { loading: loadingSummary, data: summaryData, fn: fetchSummary } =
    useFetch(getWeeklySummary);
  const { loading: loadingBodyProgress, data: bodyProgressData, fn: fetchBodyProgress } =
    useFetch(getProgressSummary);
  const { loading: loadingMeasurements, data: measurementsData, fn: fetchMeasurements } =
    useFetch(getBodyMeasurements);
  const { loading: loadingProfile, data: profileData, fn: fetchProfile } =
    useFetch(getFitnessProfile);

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
    fetchStreaks(authUser);
    fetchSummary(authUser);
    fetchBodyProgress(authUser, 4);
    fetchMeasurements(authUser, 10);
    fetchProfile(authUser);
  }, [authUser, fetchStreaks, fetchSummary, fetchBodyProgress, fetchMeasurements, fetchProfile]);

  useEffect(() => {
    if (!isLoaded || !authUser) return;
    refreshData();
  }, [authUser, isLoaded, refreshData]);

  const streaks = streaksData?.streaks;
  const summary = summaryData?.summary;
  const bodyProgress = bodyProgressData?.progress;
  const measurements = measurementsData?.measurements || [];
  const profile = profileData?.profile;
  const currentWeight = profile?.currentWeight ?? profile?.currentWeightKg ?? null;
  const targetWeight = profile?.targetWeight ?? profile?.targetWeightKg ?? null;
  const startingWeight = getWeightValue(measurements[measurements.length - 1]) ?? currentWeight;
  const goalProgress = calculateGoalProgress(startingWeight, currentWeight, targetWeight);

  return (
    <div className="bg-[#EAE8E3] min-h-screen pb-32">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12 lg:px-20 pt-32 space-y-8">
        <HealthNav />
        
        {/* Header */}
        <section className="glass-card p-6 sm:p-14">
          <div className="flex items-center gap-3 sm:gap-4 mb-5">
            <span className="flex size-11 sm:size-14 shrink-0 items-center justify-center rounded-full bg-[#222] text-[#EAE8E3]">
              <Activity className="size-5 sm:size-7" />
            </span>
            <p className="eyebrow">Progress Dashboard</p>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl leading-none text-[#111] mb-4 sm:mb-6">
            Your transformation,<br/>visualized.
          </h1>
          <p className="text-[#555] font-light leading-relaxed max-w-2xl">
            Track your progress across nutrition, body composition, and consistency.
            See how far you&apos;ve come and stay motivated to reach your goals.
          </p>
        </section>

        {/* Loading State */}
        {(loadingStreaks || loadingSummary || loadingBodyProgress) && (
          <section className="glass-card flex flex-col items-center justify-center px-6 py-20 sm:py-32">
            <Loader2 className="size-10 animate-spin text-[#555]" />
          </section>
        )}

        {/* Empty State - No Profile */}
        {!loadingProfile && !profile && (
          <section className="glass-card px-6 py-20 text-center sm:py-32">
            <div className="mx-auto flex size-24 items-center justify-center rounded-full border border-[#D5D3CE] bg-white/50 mb-8">
              <Activity className="size-10 text-[#222]" />
            </div>
            <h2 className="font-display text-4xl sm:text-6xl text-[#111] mb-6">
              Set up your profile first
            </h2>
            <p className="mx-auto text-lg text-[#555] font-light max-w-xl mb-12">
              Before you can track your progress, you need to set your macro targets in your fitness profile.
            </p>
            <a
              href="/fitness-profile"
              className="inline-flex items-center gap-2 glass-pill bg-[#222] text-white px-6 py-4 text-xs uppercase hover:bg-[#111] transition-colors font-semibold sm:px-8"
            >
              Go to Fitness Profile
            </a>
          </section>
        )}

        {/* Streaks Section */}
        {!loadingStreaks && profile && streaks && (
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <Award className="size-6 text-[#222]" />
                <p className="text-xs uppercase tracking-[0.2em] text-[#777]">
                  Current Streak
                </p>
              </div>
              <p className="font-display text-4xl sm:text-6xl text-[#111] mb-2">
                {streaks.currentStreak}
              </p>
              <p className="text-sm text-[#555]">days in a row</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <Flame className="size-6 text-orange-600" />
                <p className="text-xs uppercase tracking-[0.2em] text-[#777]">
                  Longest Streak
                </p>
              </div>
              <p className="font-display text-4xl sm:text-6xl text-[#111] mb-2">
                {streaks.longestStreak}
              </p>
              <p className="text-sm text-[#555]">days total</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <Target className="size-6 text-blue-600" />
                <p className="text-xs uppercase tracking-[0.2em] text-[#777]">
                  Protein Streak
                </p>
              </div>
              <p className="font-display text-4xl sm:text-6xl text-[#111] mb-2">
                {streaks.proteinStreak}
              </p>
              <p className="text-sm text-[#555]">days hitting protein</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="size-6 text-green-600" />
                <p className="text-xs uppercase tracking-[0.2em] text-[#777]">
                  Days Tracked
                </p>
              </div>
              <p className="font-display text-4xl sm:text-6xl text-[#111] mb-2">
                {streaks.daysTracked}
              </p>
              <p className="text-sm text-[#555]">total days</p>
            </motion.div>
          </section>
        )}

        {/* Weekly Summary */}
        {!loadingSummary && profile && summary && (
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="glass-card p-6 sm:p-10">
              <h2 className="font-display text-3xl text-[#111] mb-8">Weekly Summary</h2>
              
              <div className="space-y-6">
                <div className="flex justify-between items-end pb-4 border-b border-[#D5D3CE]">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#777] mb-2">
                      Days Tracked
                    </p>
                    <p className="font-display text-4xl text-[#111]">
                      {summary.daysTracked}
                    </p>
                  </div>
                  <p className="text-sm text-[#555]">out of 7 days</p>
                </div>

                <div className="flex justify-between items-end pb-4 border-b border-[#D5D3CE]">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#777] mb-2">
                      Targets Hit
                    </p>
                    <p className="font-display text-4xl text-[#111]">
                      {summary.targetsHitCount}
                    </p>
                  </div>
                  <p className="text-sm text-[#555]">{summary.targetsHitPercentage}% success</p>
                </div>

                <div className="flex justify-between items-end pb-4 border-b border-[#D5D3CE]">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#777] mb-2">
                      Workout Days
                    </p>
                    <p className="font-display text-4xl text-[#111]">
                      {summary.workoutDays}
                    </p>
                  </div>
                  <Flame className="size-8 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="glass-card p-6 sm:p-10">
              <h2 className="font-display text-3xl text-[#111] mb-8">Average Macros</h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#777]">
                      Calories
                    </p>
                    <p className="font-display text-2xl text-[#111]">
                      {summary.averages.calories}
                    </p>
                  </div>
                  <div className="h-2 bg-[#D5D3CE] rounded-full overflow-hidden">
                    <div className="h-full bg-[#222] w-[85%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#777]">
                      Protein
                    </p>
                    <p className="font-display text-2xl text-[#111]">
                      {summary.averages.protein}g
                    </p>
                  </div>
                  <div className="h-2 bg-[#D5D3CE] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-[90%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#777]">
                      Carbs
                    </p>
                    <p className="font-display text-2xl text-[#111]">
                      {summary.averages.carbs}g
                    </p>
                  </div>
                  <div className="h-2 bg-[#D5D3CE] rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 w-[80%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#777]">
                      Fats
                    </p>
                    <p className="font-display text-2xl text-[#111]">
                      {summary.averages.fats}g
                    </p>
                  </div>
                  <div className="h-2 bg-[#D5D3CE] rounded-full overflow-hidden">
                    <div className="h-full bg-orange-600 w-[75%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Body Progress */}
        {!loadingBodyProgress && profile && bodyProgress && (
          <section className="glass-card p-6 sm:p-10">
            <h2 className="font-display text-3xl text-[#111] mb-8">4-Week Body Progress</h2>
            
            <div className="grid gap-6 md:grid-cols-3">
              <div className="p-6 bg-white/60 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <Scale className="size-6 text-[#222]" />
                  <p className="text-xs uppercase tracking-[0.2em] text-[#777]">
                    Weight Change
                  </p>
                </div>
                <div className="flex items-end gap-3">
                  <p className="font-display text-4xl sm:text-5xl text-[#111]">
                    {bodyProgress.weightChange > 0 ? "+" : ""}
                    {bodyProgress.weightChange?.toFixed(1)}
                  </p>
                  <p className="text-2xl text-[#555] mb-1">kg</p>
                  {bodyProgress.weightChange !== 0 && (
                    <div className={bodyProgress.weightChange < 0 ? "text-green-600 mb-2" : "text-red-600 mb-2"}>
                      {bodyProgress.weightChange < 0 ? (
                        <TrendingDown className="size-6" />
                      ) : (
                        <TrendingUp className="size-6" />
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-[#555] mt-4">
                  Weekly avg: {bodyProgress.weeklyAverage?.toFixed(2)} kg/week
                </p>
              </div>

              {bodyProgress.bodyFatChange !== null && (
                <div className="p-6 bg-white/60 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Activity className="size-6 text-blue-600" />
                    <p className="text-xs uppercase tracking-[0.2em] text-[#777]">
                      Body Fat Change
                    </p>
                  </div>
                  <div className="flex items-end gap-3">
                    <p className="font-display text-4xl sm:text-5xl text-[#111]">
                      {bodyProgress.bodyFatChange > 0 ? "+" : ""}
                      {bodyProgress.bodyFatChange?.toFixed(1)}
                    </p>
                    <p className="text-2xl text-[#555] mb-1">%</p>
                    {bodyProgress.bodyFatChange !== 0 && (
                      <div className={bodyProgress.bodyFatChange < 0 ? "text-green-600 mb-2" : "text-red-600 mb-2"}>
                        {bodyProgress.bodyFatChange < 0 ? (
                          <TrendingDown className="size-6" />
                        ) : (
                          <TrendingUp className="size-6" />
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-[#555] mt-4">
                    {bodyProgress.bodyFatChange < 0 ? "Great progress!" : "Keep pushing!"}
                  </p>
                </div>
              )}

              {bodyProgress.leanMassChange !== null && (
                <div className="p-6 bg-white/60 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="size-6 text-green-600" />
                    <p className="text-xs uppercase tracking-[0.2em] text-[#777]">
                      Lean Mass Change
                    </p>
                  </div>
                  <div className="flex items-end gap-3">
                    <p className="font-display text-4xl sm:text-5xl text-[#111]">
                      {bodyProgress.leanMassChange > 0 ? "+" : ""}
                      {bodyProgress.leanMassChange?.toFixed(1)}
                    </p>
                    <p className="text-2xl text-[#555] mb-1">kg</p>
                  </div>
                  <p className="text-sm text-[#555] mt-4">
                    {bodyProgress.leanMassChange > 0 ? "Building muscle!" : "Preserve muscle!"}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Recent Measurements */}
        {!loadingMeasurements && profile && measurements.length > 0 && (
          <section className="glass-card p-6 sm:p-10">
            <h2 className="font-display text-3xl text-[#111] mb-8">Recent Measurements</h2>
            
            <div className="space-y-4">
              {measurements.slice(0, 5).map((measurement, i) => (
                <motion.div
                  key={measurement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col gap-4 p-5 bg-white/60 rounded-2xl sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#777] mb-1">
                      {new Date(measurement.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex flex-wrap gap-4 sm:gap-6">
                      <div>
                        <p className="text-sm text-[#555]">Weight</p>
                        <p className="font-display text-2xl text-[#111]">
                          {measurement.weightKg} kg
                        </p>
                      </div>
                      {measurement.bodyFatPercentage && (
                        <div>
                          <p className="text-sm text-[#555]">Body Fat</p>
                          <p className="font-display text-2xl text-[#111]">
                            {measurement.bodyFatPercentage}%
                          </p>
                        </div>
                      )}
                      {measurement.bmi && (
                        <div>
                          <p className="text-sm text-[#555]">BMI</p>
                          <p className="font-display text-2xl text-[#111]">
                            {measurement.bmi?.toFixed(1)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Goal Progress */}
        {!loadingProfile && profile && (
          <section className="panel-dark p-6 sm:p-10">
            <h2 className="font-display text-3xl mb-8">Your Goal</h2>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-[#aaa] mb-2">Current Goal</p>
                  <p className="font-display text-3xl sm:text-4xl capitalize">
                    {profile.fitnessGoal?.replace("_", " ")}
                  </p>
                </div>
                <Target className="size-12 text-[#aaa]" />
              </div>

              {currentWeight && targetWeight && (
                <div className="border-t border-white/10 pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-3">
                    <div>
                      <p className="text-sm text-[#aaa] mb-1">Current Weight</p>
                      <p className="font-display text-2xl sm:text-3xl">{currentWeight} kg</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm text-[#aaa] mb-1">Target Weight</p>
                      <p className="font-display text-2xl sm:text-3xl">{targetWeight} kg</p>
                    </div>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-500"
                      style={{ width: `${goalProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-[#aaa] mt-3">
                    {Math.abs(currentWeight - targetWeight).toFixed(1)} kg to go
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
