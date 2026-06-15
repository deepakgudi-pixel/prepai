"use client";

import {
  getBodyMeasurements,
  getLatestBodyMeasurement,
  getProgressSummary,
  addBodyMeasurement,
  deleteBodyMeasurement,
} from "@/actions/body-tracking.actions";
import useFetch from "@/hooks/use-fetch";
import HealthNav from "@/components/extras/HealthNav";
import ConfirmDialog from "@/components/extras/ConfirmDialog";
import { useUser } from "@clerk/nextjs";
import {
  Activity,
  Loader2,
  Plus,
  Ruler,
  Scale,
  TrendingDown,
  TrendingUp,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const MEASUREMENT_FIELDS = [
  { key: "chest", label: "Chest", unit: "cm" },
  { key: "waist", label: "Waist", unit: "cm" },
  { key: "hips", label: "Hips", unit: "cm" },
  { key: "leftThigh", label: "Left Thigh", unit: "cm" },
  { key: "rightThigh", label: "Right Thigh", unit: "cm" },
  { key: "leftArm", label: "Left Arm", unit: "cm" },
  { key: "rightArm", label: "Right Arm", unit: "cm" },
  { key: "calves", label: "Calves", unit: "cm" },
];

export default function BodyTrackingPage() {
  const { user, isLoaded } = useUser();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [measurementPendingDelete, setMeasurementPendingDelete] = useState(null);
  const [formData, setFormData] = useState({
    weightKg: "",
    bodyFatPercentage: "",
    muscleMassKg: "",
    measurements: {},
    notes: "",
  });

  const { loading: loadingMeasurements, data: measurementsData, fn: fetchMeasurements } =
    useFetch(getBodyMeasurements);
  const { loading: loadingLatest, data: latestData, fn: fetchLatest } =
    useFetch(getLatestBodyMeasurement);
  const { loading: loadingProgress, data: progressData, fn: fetchProgress } =
    useFetch(getProgressSummary);
  const { loading: adding, fn: addMeasurement } = useFetch(addBodyMeasurement);
  const { loading: deleting, fn: deleteMeasurementAction } = useFetch(deleteBodyMeasurement);

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
    fetchMeasurements(authUser, 30);
    fetchLatest(authUser);
    fetchProgress(authUser, 4);
  }, [authUser, fetchMeasurements, fetchLatest, fetchProgress]);

  useEffect(() => {
    if (!isLoaded || !authUser) return;
    refreshData();
  }, [authUser, isLoaded, refreshData]);

  const handleAddMeasurement = async () => {
    if (!formData.weightKg) {
      toast.error("Weight is required");
      return;
    }

    const measurementData = {
      weightKg: parseFloat(formData.weightKg),
      bodyFatPercentage: formData.bodyFatPercentage ? parseFloat(formData.bodyFatPercentage) : null,
      muscleMassKg: formData.muscleMassKg ? parseFloat(formData.muscleMassKg) : null,
      measurements: Object.keys(formData.measurements).length > 0 ? formData.measurements : null,
      notes: formData.notes || null,
    };

    const result = await addMeasurement(authUser, measurementData);

    if (result?.success) {
      toast.success("Measurement added successfully!");
      setIsAddModalOpen(false);
      setFormData({
        weightKg: "",
        bodyFatPercentage: "",
        muscleMassKg: "",
        measurements: {},
        notes: "",
      });
      refreshData();
    } else {
      toast.error(result?.error || "Failed to add measurement");
    }
  };

  const handleDelete = async () => {
    if (!measurementPendingDelete) return;

    const result = await deleteMeasurementAction(authUser, measurementPendingDelete.id);

    if (result?.success) {
      toast.success("Measurement deleted");
      setMeasurementPendingDelete(null);
      refreshData();
    } else {
      toast.error(result?.error || "Failed to delete measurement");
    }
  };

  const handleMeasurementChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [key]: value ? parseFloat(value) : undefined,
      },
    }));
  };

  const measurements = measurementsData?.measurements || [];
  const latest = latestData?.measurement;
  const progress = progressData?.progress;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
                <Scale className="size-5 sm:size-7" />
              </span>
              <p className="eyebrow">Body Tracking</p>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl leading-none text-[#111] mb-4 sm:mb-6">
              Track your progress,<br/>see the transformation.
            </h1>
            <p className="text-[#555] font-light leading-relaxed max-w-md mb-8">
              Log your weight, body fat, and measurements. Watch your progress over time
              with detailed analytics and trends.
            </p>

            {latest && (
              <div className="flex flex-wrap gap-5 sm:gap-8">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#777]">
                    Current Weight
                  </p>
                  <p className="mt-3 font-display text-3xl sm:text-4xl leading-none text-[#111]">
                    {latest.weightKg} kg
                  </p>
                </div>
                {latest.bodyFatPercentage && (
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#777]">
                      Body Fat
                    </p>
                    <p className="mt-3 font-display text-3xl sm:text-4xl leading-none text-[#111]">
                      {latest.bodyFatPercentage}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress Summary */}
          <div className="panel-dark">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="size-6" />
              <h2 className="font-display text-2xl">4-Week Progress</h2>
            </div>
            
            {loadingProgress ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-8 animate-spin" />
              </div>
            ) : progress ? (
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-[#aaa] mb-1">Weight Change</p>
                    <p className="font-display text-5xl">
                      {progress.weightChange > 0 ? "+" : ""}
                      {progress.weightChange?.toFixed(1)} kg
                    </p>
                  </div>
                  {progress.weightChange !== 0 && (
                    <div className={progress.weightChange < 0 ? "text-green-400" : "text-red-400"}>
                      {progress.weightChange < 0 ? (
                        <TrendingDown className="size-8" />
                      ) : (
                        <TrendingUp className="size-8" />
                      )}
                    </div>
                  )}
                </div>
                {progress.bodyFatChange !== null && (
                  <div className="border-t border-white/10 pt-6">
                    <p className="text-sm text-[#aaa] mb-2">Body Fat Change</p>
                    <p className="font-display text-4xl">
                      {progress.bodyFatChange > 0 ? "+" : ""}
                      {progress.bodyFatChange?.toFixed(1)}%
                    </p>
                  </div>
                )}
                <div className="text-xs text-[#aaa]">
                  Weekly average: {progress.weeklyAverage?.toFixed(2)} kg/week
                </div>
              </div>
            ) : (
              <p className="text-[#aaa]">Add measurements to see progress!</p>
            )}
          </div>
        </section>

        {/* Add Measurement Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full glass-card p-5 sm:p-8 hover:border-[#aaa] transition-all group"
        >
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <span className="flex size-10 sm:size-12 items-center justify-center rounded-full bg-[#222] text-white group-hover:scale-110 transition-transform">
              <Plus className="size-5 sm:size-6" />
            </span>
            <span className="font-display text-xl sm:text-2xl text-[#111]">Add Measurement</span>
          </div>
        </button>

        {/* Loading State */}
        {loadingMeasurements && (
          <section className="glass-card flex flex-col items-center justify-center px-6 py-20 sm:py-32">
            <Loader2 className="size-10 animate-spin text-[#555]" />
          </section>
        )}

        {/* Measurements History */}
        {!loadingMeasurements && measurements.length > 0 && (
          <section className="glass-card p-6 sm:p-10">
            <h2 className="font-display text-3xl text-[#111] mb-8">Measurement History</h2>
            
            <div className="space-y-4">
              <AnimatePresence>
                {measurements.map((measurement, i) => (
                  <motion.div
                    key={measurement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="glass-card group p-5 transition-colors hover:border-[#aaa] sm:p-6"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#777] mb-2">
                          {formatDate(measurement.createdAt)}
                        </p>
                        <div className="flex flex-wrap gap-5 sm:gap-6">
                          <div>
                            <p className="text-sm text-[#555]">Weight</p>
                            <p className="font-display text-3xl text-[#111]">
                              {measurement.weightKg} kg
                            </p>
                          </div>
                          {measurement.bodyFatPercentage && (
                            <div>
                              <p className="text-sm text-[#555]">Body Fat</p>
                              <p className="font-display text-3xl text-[#111]">
                                {measurement.bodyFatPercentage}%
                              </p>
                            </div>
                          )}
                          {measurement.bmi && (
                            <div>
                              <p className="text-sm text-[#555]">BMI</p>
                              <p className="font-display text-3xl text-[#111]">
                                {measurement.bmi?.toFixed(1)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setMeasurementPendingDelete(measurement)}
                        disabled={deleting}
                        className="shrink-0 text-[#777] opacity-100 transition-opacity hover:text-red-700 sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label={`Delete measurement from ${formatDate(measurement.createdAt)}`}
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </div>

                    {measurement.measurements && Object.keys(measurement.measurements).length > 0 && (
                      <div className="border-t border-[#D5D3CE] pt-4 mt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Ruler className="size-4 text-[#777]" />
                          <p className="text-xs uppercase tracking-[0.2em] text-[#777]">
                            Body Measurements
                          </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {Object.entries(measurement.measurements).map(([key, value]) => {
                            const field = MEASUREMENT_FIELDS.find((f) => f.key === key);
                            if (!field || !value) return null;
                            return (
                              <div key={key}>
                                <p className="text-xs text-[#555]">{field.label}</p>
                                <p className="font-semibold text-[#111]">
                                  {value} {field.unit}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {measurement.notes && (
                      <div className="border-t border-[#D5D3CE] pt-4 mt-4">
                        <p className="text-sm text-[#555] italic">{measurement.notes}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loadingMeasurements && measurements.length === 0 && (
          <section className="glass-card px-6 py-20 text-center sm:py-32">
            <div className="mx-auto flex size-24 items-center justify-center rounded-full border border-[#D5D3CE] bg-white/50 mb-8">
              <Scale className="size-10 text-[#222]" />
            </div>
            <h2 className="font-display text-4xl sm:text-6xl text-[#111] mb-6">
              No measurements yet.
            </h2>
            <p className="mx-auto text-lg text-[#555] font-light max-w-xl mb-12">
              Start tracking your body composition to see your progress over time.
            </p>
          </section>
        )}

        {/* Add Measurement Modal */}
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
                aria-labelledby="add-measurement-title"
                className="max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center gap-4 mb-6">
                  <h3 id="add-measurement-title" className="font-display text-2xl sm:text-3xl text-[#111]">Add Measurement</h3>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#777] transition-colors hover:bg-[#EAE8E3] hover:text-[#111]"
                    aria-label="Close add measurement dialog"
                  >
                    <X className="size-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Basic Metrics */}
                  <div>
                    <h4 className="text-sm font-semibold text-[#111] mb-4">Basic Metrics</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                          Weight (kg) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.weightKg}
                          onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                          className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-5 py-4 text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                          placeholder="80.0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                          Body Fat (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.bodyFatPercentage}
                          onChange={(e) => setFormData({ ...formData, bodyFatPercentage: e.target.value })}
                          className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-5 py-4 text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                          placeholder="17.0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                          Muscle Mass (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.muscleMassKg}
                          onChange={(e) => setFormData({ ...formData, muscleMassKg: e.target.value })}
                          className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-5 py-4 text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                          placeholder="66.0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Body Measurements */}
                  <div>
                    <h4 className="text-sm font-semibold text-[#111] mb-4">Body Measurements (Optional)</h4>
                    <div className="grid gap-4 sm:grid-cols-4">
                      {MEASUREMENT_FIELDS.map((field) => (
                        <div key={field.key}>
                          <label className="block text-xs uppercase tracking-[0.2em] text-[#777] mb-3">
                            {field.label}
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.measurements[field.key] || ""}
                            onChange={(e) => handleMeasurementChange(field.key, e.target.value)}
                            className="w-full bg-white/60 border border-[#D5D3CE] rounded-2xl px-4 py-3 text-sm text-[#111] placeholder:text-[#aaa] focus:border-[#222] transition-colors outline-none"
                            placeholder={field.unit}
                          />
                        </div>
                      ))}
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
                      rows="3"
                      placeholder="How are you feeling today?"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
                    <button
                      onClick={handleAddMeasurement}
                      disabled={adding}
                      className="flex-1 glass-pill bg-[#222] text-white px-6 py-4 text-xs uppercase tracking-[0.2em] hover:bg-[#111] transition-colors font-semibold"
                    >
                      {adding ? (
                        <Loader2 className="size-4 animate-spin mx-auto" />
                      ) : (
                        "Add Measurement"
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
          open={Boolean(measurementPendingDelete)}
          title="Delete measurement?"
          description={`This removes the entry from ${measurementPendingDelete ? formatDate(measurementPendingDelete.createdAt) : "this date"}. Your charts and progress summaries will update without it.`}
          confirmLabel="Delete Entry"
          loading={deleting}
          onCancel={() => setMeasurementPendingDelete(null)}
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}
