"use client";

/**
 * MedicationForm — handles create and edit of a medication.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pill, Loader2, FileText } from "lucide-react";
import { cn } from "@nexus/utils";
import { Button, Input, Alert, AlertDescription } from "@nexus/ui";
import {
  MedicationStatus,
  MedicationFrequency,
  MedicationRoute,
  MEDICATION_STATUS_LABELS,
  MEDICATION_FREQUENCY_LABELS,
  MEDICATION_ROUTE_LABELS,
  type Medication,
} from "@/types/medications.ts";
import type { HealthRecordListItem } from "@/types/health-records.ts";

// ─── Validation schema ───────────────────────────────────────────────────────

const formSchema = z.object({
  name: z.string().min(1, "Medication name is required").max(200),
  dosage: z.string().min(1, "Dosage amount is required").max(50),
  dosageUnit: z.string().min(1, "Dosage unit is required").max(50),
  frequency: z.nativeEnum(MedicationFrequency, { required_error: "Select frequency" }),
  route: z.nativeEnum(MedicationRoute, { required_error: "Select administration route" }),
  instructions: z.string().max(1000).optional(),
  prescribedBy: z.string().max(200).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  refillsRemaining: z.coerce.number().int().min(0).optional(),
  prescriptionRecordId: z.string().optional(),
  status: z.nativeEnum(MedicationStatus).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MedicationFormProps {
  initialData?: Medication | null;
  isEditing?: boolean;
}

export function MedicationForm({
  initialData,
  isEditing = false,
}: MedicationFormProps) {
  const router = useRouter();
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [prescriptions, setPrescriptions] = React.useState<HealthRecordListItem[]>([]);

  // Load prescription documents for optional link dropdown
  React.useEffect(() => {
    async function loadPrescriptions() {
      try {
        const res = await fetch("/api/records?category=PRESCRIPTION");
        if (res.ok) {
          const json = await res.json() as { data: { records: HealthRecordListItem[] } };
          setPrescriptions(json.data.records);
        }
      } catch {
        // Silently fallback — user can still type or leave empty
      }
    }
    void loadPrescriptions();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      dosage: initialData?.dosage ?? "",
      dosageUnit: initialData?.dosageUnit ?? "mg",
      frequency: initialData?.frequency ?? MedicationFrequency.ONCE_DAILY,
      route: initialData?.route ?? MedicationRoute.ORAL_TABLET,
      instructions: initialData?.instructions ?? "",
      prescribedBy: initialData?.prescribedBy ?? "",
      startDate: initialData?.startDate
        ? new Date(initialData.startDate).toISOString().split("T")[0]
        : "",
      endDate: initialData?.endDate
        ? new Date(initialData.endDate).toISOString().split("T")[0]
        : "",
      refillsRemaining: initialData?.refillsRemaining ?? 0,
      prescriptionRecordId: initialData?.prescriptionRecordId ?? "",
      status: initialData?.status ?? MedicationStatus.ACTIVE,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const payload = {
        ...values,
        instructions: values.instructions || undefined,
        prescribedBy: values.prescribedBy || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
        prescriptionRecordId: values.prescriptionRecordId || undefined,
        refillsRemaining:
          values.refillsRemaining !== undefined && !isNaN(values.refillsRemaining)
            ? values.refillsRemaining
            : undefined,
      };

      const url = isEditing && initialData
        ? `/api/medications/${initialData.id}`
        : "/api/medications";

      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Failed to save medication");
      }

      router.push("/medications");
      router.refresh();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
      noValidate
    >
      {apiError && (
        <Alert variant="destructive">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Medication Name */}
        <div className="sm:col-span-2">
          <Input
            label="Medication / Drug Name *"
            placeholder="e.g. Metformin, Amlodipine, Paracetamol"
            errorMessage={errors.name?.message}
            {...register("name")}
          />
        </div>

        {/* Dosage Strength & Unit */}
        <div>
          <Input
            label="Dosage Strength *"
            placeholder="e.g. 500, 10, 250"
            errorMessage={errors.dosage?.message}
            {...register("dosage")}
          />
        </div>

        <div>
          <Input
            label="Dosage Unit *"
            placeholder="e.g. mg, ml, mcg, tablet, drops"
            errorMessage={errors.dosageUnit?.message}
            {...register("dosageUnit")}
          />
        </div>

        {/* Frequency */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="frequency"
            className="text-sm font-medium text-foreground"
          >
            Frequency / Schedule *
          </label>
          <select
            id="frequency"
            {...register("frequency")}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              errors.frequency && "border-destructive focus-visible:ring-destructive"
            )}
          >
            {Object.entries(MEDICATION_FREQUENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.frequency && (
            <p className="text-xs text-destructive">{errors.frequency.message}</p>
          )}
        </div>

        {/* Route / Form */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="route" className="text-sm font-medium text-foreground">
            Administration Route *
          </label>
          <select
            id="route"
            {...register("route")}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              errors.route && "border-destructive focus-visible:ring-destructive"
            )}
          >
            {Object.entries(MEDICATION_ROUTE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.route && (
            <p className="text-xs text-destructive">{errors.route.message}</p>
          )}
        </div>

        {/* Status (when editing) */}
        {isEditing && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="text-sm font-medium text-foreground">
              Status
            </label>
            <select
              id="status"
              {...register("status")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {Object.entries(MEDICATION_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Prescribing Doctor */}
        <Input
          label="Prescribed By"
          placeholder="e.g. Dr. Rajesh Kumar (Cardiologist)"
          {...register("prescribedBy")}
        />

        {/* Refills Remaining */}
        <Input
          label="Refills Remaining"
          type="number"
          min="0"
          placeholder="0"
          {...register("refillsRemaining")}
        />

        {/* Start & End Dates */}
        <Input
          label="Start Date"
          type="date"
          {...register("startDate")}
        />

        <Input
          label="End Date (if finite course)"
          type="date"
          {...register("endDate")}
        />

        {/* Optional Linked Prescription Record */}
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label
            htmlFor="prescriptionRecordId"
            className="text-sm font-medium text-foreground flex items-center gap-1.5"
          >
            <FileText className="size-4 text-muted-foreground" />
            Link to Health Record Prescription (Optional)
          </label>
          {prescriptions.length > 0 ? (
            <select
              id="prescriptionRecordId"
              {...register("prescriptionRecordId")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">No prescription document linked</option>
              {prescriptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} {p.providerName ? `(${p.providerName})` : ""}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id="prescriptionRecordId"
              placeholder="e.g. rec_12345 (or leave blank if none)"
              {...register("prescriptionRecordId")}
            />
          )}
          <p className="text-xs text-muted-foreground">
            Connects this medication to an uploaded doctor&apos;s prescription record.
          </p>
        </div>

        {/* Instructions */}
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label
            htmlFor="instructions"
            className="text-sm font-medium text-foreground"
          >
            Special Instructions
          </label>
          <textarea
            id="instructions"
            rows={3}
            placeholder="e.g. Take immediately after meals with a full glass of water. Avoid taking with antacids."
            {...register("instructions")}
            className={cn(
              "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "resize-none"
            )}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
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
              <Pill />
            )
          }
        >
          {isSubmitting
            ? "Saving…"
            : isEditing
            ? "Update Medication"
            : "Add Medication"}
        </Button>
      </div>
    </form>
  );
}
