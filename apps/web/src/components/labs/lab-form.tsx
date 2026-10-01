"use client";

/**
 * LabForm — handles create and edit of a diagnostic lab result.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FlaskConical, Loader2 } from "lucide-react";
import { cn } from "@nexus/utils";
import { Button, Input, Alert, AlertDescription } from "@nexus/ui";
import {
  LabCategory,
  LabResultStatus,
  LAB_CATEGORY_LABELS,
  LAB_RESULT_STATUS_LABELS,
  type LabResult,
} from "@/types/labs.ts";
import type { HealthRecordListItem } from "@/types/health-records.ts";

// ─── Validation schema ───────────────────────────────────────────────────────

const formSchema = z.object({
  testName: z.string().min(1, "Test name is required").max(200),
  category: z.nativeEnum(LabCategory, { required_error: "Select category" }),
  value: z.string().min(1, "Test value is required").max(100),
  unit: z.string().max(50).optional(),
  referenceRangeMin: z.coerce.number().optional(),
  referenceRangeMax: z.coerce.number().optional(),
  referenceRangeText: z.string().max(100).optional(),
  status: z.nativeEnum(LabResultStatus, { required_error: "Select result status" }),
  labName: z.string().max(200).optional(),
  collectedAt: z.string().optional(),
  resultDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
  healthRecordId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LabFormProps {
  initialData?: LabResult | null;
  isEditing?: boolean;
}

export function LabForm({ initialData, isEditing = false }: LabFormProps) {
  const router = useRouter();
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [labReports, setLabReports] = React.useState<HealthRecordListItem[]>([]);

  // Load lab report documents for optional link dropdown
  React.useEffect(() => {
    async function loadLabReports() {
      try {
        const res = await fetch("/api/records?category=LAB_REPORT");
        if (res.ok) {
          const json = (await res.json()) as {
            data: { records: HealthRecordListItem[] };
          };
          setLabReports(json.data.records);
        }
      } catch {
        // Silently fallback — user can still type or leave empty
      }
    }
    void loadLabReports();
  }, []);

  const formatDateForInput = (d?: Date | string | null): string => {
    if (!d) return "";
    const dateObj = typeof d === "string" ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return "";
    return dateObj.toISOString().split("T")[0] ?? "";
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      testName: initialData?.testName ?? "",
      category: initialData?.category ?? LabCategory.BIOCHEMISTRY,
      value: initialData?.value ?? "",
      unit: initialData?.unit ?? "",
      referenceRangeMin: initialData?.referenceRangeMin ?? undefined,
      referenceRangeMax: initialData?.referenceRangeMax ?? undefined,
      referenceRangeText: initialData?.referenceRangeText ?? "",
      status: initialData?.status ?? LabResultStatus.NORMAL,
      labName: initialData?.labName ?? "",
      collectedAt: formatDateForInput(initialData?.collectedAt),
      resultDate: formatDateForInput(initialData?.resultDate || initialData?.createdAt),
      notes: initialData?.notes ?? "",
      healthRecordId: initialData?.healthRecordId ?? "",
    },
  });

  const selectedCategory = watch("category");
  const selectedStatus = watch("status");

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const payload: Record<string, unknown> = {
        testName: values.testName.trim(),
        category: values.category,
        value: values.value.trim(),
        status: values.status,
      };

      if (values.unit) payload.unit = values.unit.trim();
      if (values.referenceRangeMin !== undefined && !isNaN(values.referenceRangeMin)) {
        payload.referenceRangeMin = values.referenceRangeMin;
      }
      if (values.referenceRangeMax !== undefined && !isNaN(values.referenceRangeMax)) {
        payload.referenceRangeMax = values.referenceRangeMax;
      }
      if (values.referenceRangeText) payload.referenceRangeText = values.referenceRangeText.trim();
      if (values.labName) payload.labName = values.labName.trim();
      if (values.collectedAt) payload.collectedAt = values.collectedAt;
      if (values.resultDate) payload.resultDate = values.resultDate;
      if (values.notes) payload.notes = values.notes.trim();
      if (values.healthRecordId) payload.healthRecordId = values.healthRecordId;

      const endpoint = isEditing ? `/api/labs/${initialData?.id}` : "/api/labs";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as {
        data?: LabResult;
        error?: { message?: string };
      };

      if (!res.ok) {
        throw new Error(json.error?.message ?? "Failed to save lab result");
      }

      router.push(isEditing ? `/labs/${initialData?.id}` : "/labs");
      router.refresh();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {apiError && (
        <Alert variant="destructive">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {/* Primary Details Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Biomarker & Diagnostic Information
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Test Name */}
          <div className="sm:col-span-2">
            <label
              htmlFor="testName"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Test / Biomarker Name <span className="text-rose-500">*</span>
            </label>
            <Input
              id="testName"
              placeholder="e.g. HbA1c (Glycated Hemoglobin), Fasting Glucose, Serum Creatinine"
              {...register("testName")}
              aria-invalid={!!errors.testName}
            />
            {errors.testName && (
              <p className="mt-1 text-xs text-rose-600">{errors.testName.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setValue("category", e.target.value as LabCategory)}
              className={cn(
                "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              {Object.entries(LAB_CATEGORY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-xs text-rose-600">{errors.category.message}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Result Interpretation Status <span className="text-rose-500">*</span>
            </label>
            <select
              id="status"
              value={selectedStatus}
              onChange={(e) => setValue("status", e.target.value as LabResultStatus)}
              className={cn(
                "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              {Object.entries(LAB_RESULT_STATUS_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-xs text-rose-600">{errors.status.message}</p>
            )}
          </div>

          {/* Value */}
          <div>
            <label
              htmlFor="value"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Observed Value <span className="text-rose-500">*</span>
            </label>
            <Input
              id="value"
              placeholder="e.g. 5.8 or Negative or 140"
              {...register("value")}
              aria-invalid={!!errors.value}
            />
            {errors.value && (
              <p className="mt-1 text-xs text-rose-600">{errors.value.message}</p>
            )}
          </div>

          {/* Unit */}
          <div>
            <label
              htmlFor="unit"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Measurement Unit
            </label>
            <Input
              id="unit"
              placeholder="e.g. %, mg/dL, mmol/L, U/L, cells/mcL"
              {...register("unit")}
            />
          </div>
        </div>
      </div>

      {/* Reference Ranges Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Reference Range / Benchmark Limits
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Min */}
          <div>
            <label
              htmlFor="referenceRangeMin"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Min Normal Value
            </label>
            <Input
              id="referenceRangeMin"
              type="number"
              step="any"
              placeholder="e.g. 70"
              {...register("referenceRangeMin")}
            />
          </div>

          {/* Max */}
          <div>
            <label
              htmlFor="referenceRangeMax"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Max Normal Value
            </label>
            <Input
              id="referenceRangeMax"
              type="number"
              step="any"
              placeholder="e.g. 99"
              {...register("referenceRangeMax")}
            />
          </div>

          {/* Reference Text */}
          <div>
            <label
              htmlFor="referenceRangeText"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Reference Range Label
            </label>
            <Input
              id="referenceRangeText"
              placeholder="e.g. 70 – 99 mg/dL or < 5.7 %"
              {...register("referenceRangeText")}
            />
          </div>
        </div>
      </div>

      {/* Source & Lab Center Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Provider & Report Link
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Lab Provider */}
          <div>
            <label
              htmlFor="labName"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Diagnostic Center / Lab Provider
            </label>
            <Input
              id="labName"
              placeholder="e.g. Dr. Lal PathLabs, Apollo Diagnostics, Metropolis"
              {...register("labName")}
            />
          </div>

          {/* Link to Health Record */}
          <div>
            <label
              htmlFor="healthRecordId"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Linked Lab Report Document
            </label>
            <select
              id="healthRecordId"
              {...register("healthRecordId")}
              className={cn(
                "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <option value="">None (Independent biomarker record)</option>
              {labReports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.fileName})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Link this test to an uploaded Lab Report in your Health Records.
            </p>
          </div>

          {/* Collection Date */}
          <div>
            <label
              htmlFor="collectedAt"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Sample Collection Date
            </label>
            <Input id="collectedAt" type="date" {...register("collectedAt")} />
          </div>

          {/* Result Date */}
          <div>
            <label
              htmlFor="resultDate"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Report Finalized Date
            </label>
            <Input id="resultDate" type="date" {...register("resultDate")} />
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label
              htmlFor="notes"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Clinical Notes / Observations
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Additional findings, fasting instructions, doctor remarks, or follow-up recommendations..."
              {...register("notes")}
              className={cn(
                "flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          leftIcon={
            isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <FlaskConical />
            )
          }
        >
          {isSubmitting
            ? "Saving..."
            : isEditing
            ? "Update Lab Result"
            : "Record Lab Result"}
        </Button>
      </div>
    </form>
  );
}
