"use client";

/**
 * Doctor Prescription Creation Dialog — Phase 11E
 *
 * Provides an accessible modal dialog for doctors with active patient consent
 * to prescribe a new medication for the target patient.
 */

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pill, X, Loader2, AlertCircle } from "lucide-react";
import { Button, Input, Alert, AlertDescription } from "@nexus/ui";
import {
  MedicationStatus,
  MedicationFrequency,
  MedicationRoute,
  MEDICATION_FREQUENCY_LABELS,
  MEDICATION_ROUTE_LABELS,
} from "@/types/medications.ts";

const prescriptionSchema = z.object({
  name: z.string().min(1, "Medication name is required").max(200),
  dosage: z.string().min(1, "Dosage amount is required").max(50),
  dosageUnit: z.string().min(1, "Dosage unit is required").max(50),
  frequency: z.nativeEnum(MedicationFrequency, {
    required_error: "Please select frequency",
  }),
  route: z.nativeEnum(MedicationRoute, {
    required_error: "Please select administration route",
  }),
  instructions: z.string().max(1000).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      const s = new Date(data.startDate).getTime();
      const e = new Date(data.endDate).getTime();
      return !isNaN(s) && !isNaN(e) && e >= s;
    }
    return true;
  },
  {
    message: "End date cannot precede start date",
    path: ["endDate"],
  }
);

type PrescriptionFormValues = z.infer<typeof prescriptionSchema>;

interface DoctorPrescriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientNexusId: string;
  patientName: string;
  onPrescriptionCreated: () => void;
}

export function DoctorPrescriptionDialog({
  isOpen,
  onClose,
  patientNexusId,
  patientName,
  onPrescriptionCreated,
}: DoctorPrescriptionDialogProps) {
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      name: "",
      dosage: "",
      dosageUnit: "mg",
      frequency: MedicationFrequency.ONCE_DAILY,
      route: MedicationRoute.ORAL_TABLET,
      instructions: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      setApiError(null);
      reset({
        name: "",
        dosage: "",
        dosageUnit: "mg",
        frequency: MedicationFrequency.ONCE_DAILY,
        route: MedicationRoute.ORAL_TABLET,
        instructions: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
      });
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (values: PrescriptionFormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const payload: Record<string, unknown> = {
        name: values.name.trim(),
        dosage: values.dosage.trim(),
        dosageUnit: values.dosageUnit.trim(),
        frequency: values.frequency,
        route: values.route,
        status: MedicationStatus.ACTIVE,
      };

      if (values.instructions?.trim()) {
        payload.instructions = values.instructions.trim();
      }
      if (values.startDate) {
        payload.startDate = values.startDate;
      }
      if (values.endDate) {
        payload.endDate = values.endDate;
      }

      const res = await fetch(`/api/doctor/patients/${patientNexusId}/medications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as {
        success: boolean;
        error?: { message?: string };
      };

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to create prescription");
      }

      onPrescriptionCreated();
      onClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Prescription creation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prescription-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Pill className="size-5" />
            </div>
            <div>
              <h2 id="prescription-dialog-title" className="text-base font-semibold text-foreground">
                Prescribe Medication
              </h2>
              <p className="text-xs text-muted-foreground">
                Patient: <span className="font-medium text-foreground">{patientName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Error banner */}
        {apiError && (
          <Alert variant="error">
            <AlertCircle className="size-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Medication Name */}
          <div className="space-y-1.5">
            <label htmlFor="med-name" className="text-xs font-semibold text-foreground">
              Medication Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="med-name"
              placeholder="e.g. Ashwagandha Tablet, Metformin"
              {...register("name")}
              disabled={isSubmitting}
              className="text-xs"
            />
            {errors.name && (
              <p className="text-2xs font-medium text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Dosage and Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="med-dosage" className="text-xs font-semibold text-foreground">
                Dosage Strength <span className="text-destructive">*</span>
              </label>
              <Input
                id="med-dosage"
                placeholder="e.g. 500, 10"
                {...register("dosage")}
                disabled={isSubmitting}
                className="text-xs"
              />
              {errors.dosage && (
                <p className="text-2xs font-medium text-destructive">{errors.dosage.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="med-unit" className="text-xs font-semibold text-foreground">
                Unit <span className="text-destructive">*</span>
              </label>
              <Input
                id="med-unit"
                placeholder="e.g. mg, ml, drops"
                {...register("dosageUnit")}
                disabled={isSubmitting}
                className="text-xs"
              />
              {errors.dosageUnit && (
                <p className="text-2xs font-medium text-destructive">{errors.dosageUnit.message}</p>
              )}
            </div>
          </div>

          {/* Frequency and Route */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="med-freq" className="text-xs font-semibold text-foreground">
                Frequency <span className="text-destructive">*</span>
              </label>
              <select
                id="med-freq"
                {...register("frequency")}
                disabled={isSubmitting}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                {Object.entries(MEDICATION_FREQUENCY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.frequency && (
                <p className="text-2xs font-medium text-destructive">{errors.frequency.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="med-route" className="text-xs font-semibold text-foreground">
                Route / Form <span className="text-destructive">*</span>
              </label>
              <select
                id="med-route"
                {...register("route")}
                disabled={isSubmitting}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                {Object.entries(MEDICATION_ROUTE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.route && (
                <p className="text-2xs font-medium text-destructive">{errors.route.message}</p>
              )}
            </div>
          </div>

          {/* Start and End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="med-start" className="text-xs font-semibold text-foreground">
                Start Date
              </label>
              <Input
                id="med-start"
                type="date"
                {...register("startDate")}
                disabled={isSubmitting}
                className="text-xs"
              />
              {errors.startDate && (
                <p className="text-2xs font-medium text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="med-end" className="text-xs font-semibold text-foreground">
                End Date (Optional)
              </label>
              <Input
                id="med-end"
                type="date"
                {...register("endDate")}
                disabled={isSubmitting}
                className="text-xs"
              />
              {errors.endDate && (
                <p className="text-2xs font-medium text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <label htmlFor="med-instructions" className="text-xs font-semibold text-foreground">
              Directions / Clinical Instructions
            </label>
            <textarea
              id="med-instructions"
              rows={2}
              placeholder="e.g. Take after breakfast with warm water"
              {...register("instructions")}
              disabled={isSubmitting}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
            {errors.instructions && (
              <p className="text-2xs font-medium text-destructive">{errors.instructions.message}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isSubmitting}
              leftIcon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Pill className="size-4" />}
            >
              {isSubmitting ? "Prescribing…" : "Prescribe Medication"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
