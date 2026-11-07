import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, AlertCircle, Droplet, Check } from "lucide-react";
import { TIME_SLOTS, getTodayDateString } from "../utils/glucose.js";
import { fetchReadingById, updateReading } from "../api/readingsApi.js";
import type { TimeSlot } from "../types/index.js";

const editReadingSchema = z.object({
  readingDate: z
    .string()
    .min(1, "Date is required")
    .refine((val) => val <= getTodayDateString(), {
      message: "Date cannot be in the future.",
    }),
  timeSlot: z.enum([
    "Morning (fasting)",
    "After breakfast",
    "After lunch",
    "After dinner",
  ] as const, {
    errorMap: () => ({ message: "Please select a valid time slot." }),
  }),
  glucoseValue: z
    .any()
    .superRefine((val, ctx) => {
      if (val === undefined || val === null || val === "" || String(val).trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a glucose value.",
        });
        return;
      }
      const num = Number(val);
      if (isNaN(num) || !Number.isInteger(num) || num < 40 || num > 600) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Value must be between 40 and 600 mg/dl.",
        });
      }
    })
    .transform((val) => Number(val)),
});

type EditReadingFormData = z.infer<typeof editReadingSchema>;

export const EditReadingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: reading, isLoading, error: fetchError } = useQuery({
    queryKey: ["reading", id],
    queryFn: () => fetchReadingById(id!),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditReadingFormData>({
    resolver: zodResolver(editReadingSchema),
  });

  useEffect(() => {
    if (reading) {
      reset({
        readingDate: reading.readingDate,
        timeSlot: reading.timeSlot as TimeSlot,
        glucoseValue: reading.glucoseValue ?? reading.value,
      });
    }
  }, [reading, reset]);

  const onSubmit = async (data: EditReadingFormData) => {
    if (!id) return;
    setServerError(null);
    setIsSubmitting(true);
    try {
      await updateReading(id, {
        readingDate: data.readingDate,
        timeSlot: data.timeSlot as TimeSlot,
        glucoseValue: data.glucoseValue,
      });

      queryClient.invalidateQueries({ queryKey: ["dailyReadings"] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyTrend"] });
      queryClient.invalidateQueries({ queryKey: ["readings"] });
      queryClient.invalidateQueries({ queryKey: ["reading", id] });

      navigate("/dashboard");
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        "An error occurred while updating the reading.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-2xl mx-auto flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-lavender-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchError || !reading) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Reading Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            The requested reading may have been removed or belongs to another user.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto w-full">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3.5 bg-slate-50/50">
          <div className="w-10 h-10 rounded-xl bg-lavender-100 text-lavender-700 flex items-center justify-center">
            <Droplet className="w-5 h-5 fill-lavender-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Edit Glucose Reading</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Update recorded clinical slot or measurement
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-5">
          {serverError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reading Date
            </label>
            <input
              type="date"
              max={getTodayDateString()}
              {...register("readingDate")}
              className={`block w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-lavender-500 ${
                errors.readingDate ? "border-rose-300" : "border-slate-200"
              }`}
            />
            {errors.readingDate && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">
                {errors.readingDate.message as string}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Time Slot
            </label>
            <select
              {...register("timeSlot")}
              className={`block w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-lavender-500 ${
                errors.timeSlot ? "border-rose-300" : "border-slate-200"
              }`}
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            {errors.timeSlot && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">
                {errors.timeSlot.message as string}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Glucose Value
              </label>
              <span className="text-xs text-slate-400 font-medium">mg/dl</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="40"
                max="600"
                {...register("glucoseValue")}
                className={`block w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-base font-semibold transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-lavender-500 ${
                  errors.glucoseValue ? "border-rose-300" : "border-slate-200"
                }`}
              />
              <span className="absolute right-3.5 top-3 text-xs font-medium text-slate-400">
                mg/dl
              </span>
            </div>
            {errors.glucoseValue && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">
                {errors.glucoseValue.message as string}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-50"
              style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? "Updating..." : "Update Reading"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
