"use client";

import {
  getFitnessProfile,
  updateFitnessProfile,
  calculateMacros,
} from "@/actions/fitness-profile.actions";
import useFetch from "@/hooks/use-fetch";
import HealthNav from "@/components/extras/HealthNav";
import { useUser } from "@clerk/nextjs";
import {
  Activity,
  Calculator,
  Loader2,
  Target,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary", desc: "Little to no exercise", multiplier: "1.2x" },
  { value: "lightly_active", label: "Lightly Active", desc: "Light exercise 1-3 days/week", multiplier: "1.375x" },
  { value: "moderate", label: "Moderate", desc: "Moderate exercise 3-5 days/week", multiplier: "1.55x" },
  { value: "very_active", label: "Very Active", desc: "Hard exercise 6-7 days/week", multiplier: "1.725x" },
  { value: "athlete", label: "Athlete", desc: "Very hard exercise, physical job", multiplier: "1.9x" },
];

const FITNESS_GOALS = [
  { value: "cutting", label: "Cutting", desc: "Lose fat while preserving muscle", icon: TrendingUp, color: "text-red-600" },
  { value: "bulking", label: "Bulking", desc: "Gain muscle mass", icon: Zap, color: "text-green-600" },
  { value: "maintenance", label: "Maintenance", desc: "Maintain current weight", icon: Target, color: "text-blue-600" },
  { value: "recomp", label: "Recomposition", desc: "Build muscle, lose fat", icon: Activity, color: "text-purple-600" },
];

const DEFAULT_FORM_DATA = {
  age: "",
  gender: "male",
  heightCm: "",
  currentWeightKg: "",
  targetWeightKg: "",
  activityLevel: "moderate",
  fitnessGoal: "cutting",
};

export default function FitnessProfilePage() {
  const { user, isLoaded } = useUser();
  const [draftFormData, setDraftFormData] = useState(null);
  const [calculatedMacrosOverride, setCalculatedMacrosOverride] = useState(null);

  const { loading: loadingProfile, data: profileData, fn: fetchProfile } =
    useFetch(getFitnessProfile);
  const { loading: updating, fn: updateProfile } = useFetch(updateFitnessProfile);
  const { loading: calculating, fn: calculateMacrosAction } = useFetch(calculateMacros);

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

  useEffect(() => {
    if (!isLoaded || !authUser) return;
    fetchProfile(authUser);
  }, [authUser, fetchProfile, isLoaded]);

  const profile = profileData?.profile;
  const profileFormData = useMemo(() => {
    if (!profile) return DEFAULT_FORM_DATA;

    return {
      age: profile.age || "",
      gender: profile.gender || "male",
      heightCm: profile.height || "",
      currentWeightKg: profile.currentWeight || "",
      targetWeightKg: profile.targetWeight || "",
      activityLevel: profile.activityLevel || "moderate",
      fitnessGoal: profile.fitnessGoal || "cutting",
    };
  }, [profile]);

  const profileMacros = useMemo(() => {
    if (!profile?.targetCalories) return null;

    return {
      targetCalories: profile.targetCalories,
      targetProtein: profile.targetProtein,
      targetCarbs: profile.targetCarbs,
      targetFats: profile.targetFats,
    };
  }, [profile]);

  const formData = draftFormData || profileFormData;
  const calculatedMacros = calculatedMacrosOverride || profileMacros;

  const handleInputChange = (field, value) => {
    setDraftFormData((prev) => ({ ...(prev || formData), [field]: value }));
  };

  const handleCalculate = async () => {
    if (!authUser) {
      toast.error("Please sign in to calculate macros");
      return;
    }

    if (!formData.age || !formData.heightCm || !formData.currentWeightKg) {
      toast.error("Please fill in age, height, and current weight");
      return;
    }

    const result = await calculateMacrosAction(authUser, {
      age: parseInt(formData.age),
      gender: formData.gender,
      heightCm: parseInt(formData.heightCm),
      weightKg: parseFloat(formData.currentWeightKg),
      activityLevel: formData.activityLevel,
      fitnessGoal: formData.fitnessGoal,
    });

    if (result?.success) {
      setCalculatedMacrosOverride(result.macros);
      toast.success("Macros calculated successfully!");
    } else {
      toast.error(result?.error || "Failed to calculate macros");
    }
  };

  const handleSave = async () => {
    if (!authUser) {
      toast.error("Please sign in to save your profile");
      return;
    }

    if (!formData.age || !formData.heightCm || !formData.currentWeightKg) {
      toast.error("Please fill in all required fields");
      return;
    }

    const result = await updateProfile(authUser, {
      age: parseInt(formData.age),
      gender: formData.gender,
      height: parseInt(formData.heightCm),
      currentWeight: parseFloat(formData.currentWeightKg),
      targetWeight: formData.targetWeightKg ? parseFloat(formData.targetWeightKg) : null,
      activityLevel: formData.activityLevel,
      fitnessGoal: formData.fitnessGoal,
    });

    if (result?.success) {
      toast.success("Fitness profile updated successfully!");
      if (result.profile?.targetCalories) {
        setCalculatedMacrosOverride({
          targetCalories: result.profile.targetCalories,
          targetProtein: result.profile.targetProtein,
          targetCarbs: result.profile.targetCarbs,
          targetFats: result.profile.targetFats,
        });
      }
    } else {
      toast.error(result?.error || "Failed to update profile");
    }
  };

  const selectedGoal = FITNESS_GOALS.find((g) => g.value === formData.fitnessGoal);
  const selectedActivity = ACTIVITY_LEVELS.find((a) => a.value === formData.activityLevel);

  return (
    <div className="bg-[#EAE8E3] min-h-screen pb-32">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12 lg:px-20 pt-32 space-y-8">
        <HealthNav />
        
        {/* Header */}
        <section className="glass-card p-6 sm:p-14">
          <div className="flex items-center gap-3 sm:gap-4 mb-5">
            <span className="flex size-11 sm:size-14 shrink-0 items-center justify-center rounded-full bg-[#222] text-[#EAE8E3]">
              <User className="size-5 sm:size-7" />
            </span>
            <p className="eyebrow">Fitness Profile</p>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl leading-none text-[#111] mb-4 sm:mb-6">
            Your fitness journey<br/>starts with data.
          </h1>
          <p className="text-[#555] font-light leading-relaxed max-w-2xl">
            Tell us about yourself and your goals. We&apos;ll calculate your personalized macro targets
            using the Mifflin-St Jeor equation and activity multipliers.
          </p>
        </section>

        {/* Loading State */}
        {loadingProfile && (
          <section className="glass-card flex flex-col items-center justify-center px-6 py-20 sm:py-32">
            <Loader2 className="size-10 animate-spin text-[#555]" />
          </section>
        )}

        {/* Main Form */}
        {!loadingProfile && (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            
            {/* Left Column - Form */}
            <div className="space-y-6">
              
              {/* Basic Info */}
              <div className="glass-card p-6 sm:p-10">
                <h2 className="font-display text-3xl text-[#111] mb-8">Basic Information</h2>
                
                <div className="space-y-6">
                  {/* Age & Gender */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                        Age *
                      </label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => handleInputChange("age", e.target.value)}
                        className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-5 py-4 text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                        placeholder="25"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                        Gender *
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleInputChange("gender", e.target.value)}
                        className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-5 py-4 text-[#111] focus:border-[#222] transition-colors outline-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>

                  {/* Height */}
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                      Height (cm) *
                    </label>
                    <input
                      type="number"
                      value={formData.heightCm}
                      onChange={(e) => handleInputChange("heightCm", e.target.value)}
                      className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-5 py-4 text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                      placeholder="180"
                    />
                  </div>

                  {/* Weights */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                        Current Weight (kg) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.currentWeightKg}
                        onChange={(e) => handleInputChange("currentWeightKg", e.target.value)}
                        className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-5 py-4 text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                        placeholder="80.0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                        Target Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.targetWeightKg}
                        onChange={(e) => handleInputChange("targetWeightKg", e.target.value)}
                        className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-5 py-4 text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                        placeholder="75.0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Level */}
              <div className="glass-card p-6 sm:p-10">
                <h2 className="font-display text-3xl text-[#111] mb-2">Activity Level</h2>
                <p className="text-sm text-[#555] mb-8">How active are you on a typical day?</p>
                
                <div className="space-y-3">
                  {ACTIVITY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => handleInputChange("activityLevel", level.value)}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                        formData.activityLevel === level.value
                          ? "border-[#222] bg-white/80"
                          : "border-[#D5D3CE] bg-white/40 hover:border-[#aaa]"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-[#111] mb-1">{level.label}</p>
                          <p className="text-sm text-[#555]">{level.desc}</p>
                        </div>
                        <span className="text-xs font-mono text-[#777] bg-[#EAE8E3] px-3 py-1 rounded-full">
                          {level.multiplier}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fitness Goal */}
              <div className="glass-card p-6 sm:p-10">
                <h2 className="font-display text-3xl text-[#111] mb-2">Fitness Goal</h2>
                <p className="text-sm text-[#555] mb-8">What are you trying to achieve?</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FITNESS_GOALS.map((goal) => {
                    const Icon = goal.icon;
                    return (
                      <button
                        key={goal.value}
                        onClick={() => handleInputChange("fitnessGoal", goal.value)}
                        className={`text-left p-6 rounded-2xl border-2 transition-all ${
                          formData.fitnessGoal === goal.value
                            ? "border-[#222] bg-white/80"
                            : "border-[#D5D3CE] bg-white/40 hover:border-[#aaa]"
                        }`}
                      >
                        <Icon className={`size-8 mb-4 ${goal.color}`} />
                        <p className="font-semibold text-[#111] mb-1">{goal.label}</p>
                        <p className="text-sm text-[#555]">{goal.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleCalculate}
                  disabled={calculating}
                  className="glass-pill flex flex-1 items-center justify-center gap-2 bg-white/80 px-6 py-4 text-xs font-semibold uppercase text-[#111] transition-colors hover:bg-white disabled:opacity-70"
                >
                  {calculating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Calculator className="size-4" />
                  )}
                  Preview Targets
                </button>
                <button
                  onClick={handleSave}
                  disabled={updating}
                  className="glass-pill flex flex-1 items-center justify-center gap-2 bg-[#222] px-6 py-4 text-xs font-semibold uppercase text-white transition-colors hover:bg-[#111] disabled:opacity-70"
                >
                  {updating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Target className="size-4" />
                  )}
                  Save Profile
                </button>
              </div>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-6">
              
              {/* Current Selection Summary */}
              <div className="panel-dark">
                <h3 className="font-display text-2xl mb-6">Your Selection</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <span className="text-sm text-[#aaa]">Activity Level</span>
                    <span className="font-semibold">{selectedActivity?.label}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <span className="text-sm text-[#aaa]">Fitness Goal</span>
                    <span className="font-semibold">{selectedGoal?.label}</span>
                  </div>
                  {formData.currentWeightKg && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#aaa]">Current Weight</span>
                      <span className="font-semibold">{formData.currentWeightKg} kg</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Calculated Macros */}
              <AnimatePresence>
                {calculatedMacros && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="glass-card p-6 sm:p-10"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <Calculator className="size-6 text-[#222]" />
                      <h3 className="font-display text-xl sm:text-2xl text-[#111]">Your Macro Targets</h3>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Calories */}
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-xs uppercase tracking-[0.2em] text-[#777]">
                            Daily Calories
                          </span>
                          <span className="font-display text-3xl sm:text-4xl text-[#111]">
                            {calculatedMacros.targetCalories}
                          </span>
                        </div>
                        <div className="h-2 bg-[#D5D3CE] rounded-full overflow-hidden">
                          <div className="h-full bg-[#222] w-full"></div>
                        </div>
                      </div>

                      {/* Protein */}
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-xs uppercase tracking-[0.2em] text-[#777]">
                            Protein
                          </span>
                          <span className="font-display text-2xl sm:text-3xl text-[#111]">
                            {calculatedMacros.targetProtein}g
                          </span>
                        </div>
                        <div className="h-2 bg-[#D5D3CE] rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 w-[85%]"></div>
                        </div>
                      </div>

                      {/* Carbs */}
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-xs uppercase tracking-[0.2em] text-[#777]">
                            Carbs
                          </span>
                          <span className="font-display text-2xl sm:text-3xl text-[#111]">
                            {calculatedMacros.targetCarbs}g
                          </span>
                        </div>
                        <div className="h-2 bg-[#D5D3CE] rounded-full overflow-hidden">
                          <div className="h-full bg-green-600 w-[70%]"></div>
                        </div>
                      </div>

                      {/* Fats */}
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-xs uppercase tracking-[0.2em] text-[#777]">
                            Fats
                          </span>
                          <span className="font-display text-2xl sm:text-3xl text-[#111]">
                            {calculatedMacros.targetFats}g
                          </span>
                        </div>
                        <div className="h-2 bg-[#D5D3CE] rounded-full overflow-hidden">
                          <div className="h-full bg-orange-600 w-[60%]"></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 p-4 bg-[#EAE8E3]/50 rounded-xl">
                      <p className="text-xs text-[#555] leading-relaxed">
                        <strong>Note:</strong> These targets are calculated using the Mifflin-St Jeor equation
                        and adjusted for your activity level and fitness goal. Track your progress and adjust as needed.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Info Card */}
              {!calculatedMacros && (
                <div className="glass-card p-6 sm:p-10">
                  <h3 className="font-display text-2xl text-[#111] mb-4">How it works</h3>
                  <div className="space-y-4 text-sm text-[#555] leading-relaxed">
                    <p>
                      <strong className="text-[#111]">1. BMR Calculation:</strong> We use the Mifflin-St Jeor equation
                      to calculate your Basal Metabolic Rate.
                    </p>
                    <p>
                      <strong className="text-[#111]">2. TDEE Adjustment:</strong> Your BMR is multiplied by your
                      activity level to get Total Daily Energy Expenditure.
                    </p>
                    <p>
                      <strong className="text-[#111]">3. Goal-Based Macros:</strong> We adjust calories and distribute
                      macros based on your fitness goal (cutting, bulking, etc.).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
