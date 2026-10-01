"use client";

/**
 * InsuranceForm — handles create and edit of an insurance policy.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Loader2 } from "lucide-react";
import { cn } from "@nexus/utils";
import { Button, Input, Alert, AlertDescription } from "@nexus/ui";
import {
  InsurancePolicyType,
  InsurancePolicyStatus,
  INSURANCE_POLICY_TYPE_LABELS,
  INSURANCE_POLICY_STATUS_LABELS,
  type InsurancePolicy,
} from "@/types/insurance.ts";
import type { HealthRecordListItem } from "@/types/health-records.ts";

// ─── Validation schema ───────────────────────────────────────────────────────

const formSchema = z.object({
  providerName: z.string().min(1, "Insurance provider name is required").max(200),
  policyName: z.string().min(1, "Policy plan name is required").max(200),
  policyNumber: z.string().min(1, "Policy number is required").max(100),
  policyType: z.nativeEnum(InsurancePolicyType, { required_error: "Select policy type" }),
  sumInsured: z.coerce.number().positive("Sum insured must be greater than 0"),
  premiumAmount: z.coerce.number().nonnegative().optional(),
  startDate: z.string().optional(),
  expiryDate: z.string().min(1, "Policy expiry date is required"),
  status: z.nativeEnum(InsurancePolicyStatus, { required_error: "Select policy status" }),
  tpaName: z.string().max(200).optional(),
  tpaContact: z.string().max(100).optional(),
  networkHospitalUrl: z.string().max(500).optional(),
  policyDocumentRecordId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InsuranceFormProps {
  initialData?: InsurancePolicy | null;
  isEditing?: boolean;
}

export function InsuranceForm({
  initialData,
  isEditing = false,
}: InsuranceFormProps) {
  const router = useRouter();
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [insuranceDocuments, setInsuranceDocuments] = React.useState<
    HealthRecordListItem[]
  >([]);

  // Load insurance documents from Health Records for optional document link dropdown
  React.useEffect(() => {
    async function loadInsuranceDocs() {
      try {
        const res = await fetch("/api/records?category=INSURANCE_DOCUMENT");
        if (res.ok) {
          const json = (await res.json()) as {
            data: { records: HealthRecordListItem[] };
          };
          setInsuranceDocuments(json.data.records);
        }
      } catch {
        // Silently fallback — user can still type or leave empty
      }
    }
    void loadInsuranceDocs();
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
      providerName: initialData?.providerName ?? "",
      policyName: initialData?.policyName ?? "",
      policyNumber: initialData?.policyNumber ?? "",
      policyType: initialData?.policyType ?? InsurancePolicyType.HEALTH_INDIVIDUAL,
      sumInsured: initialData?.sumInsured ?? 500000,
      premiumAmount: initialData?.premiumAmount ?? undefined,
      startDate: formatDateForInput(initialData?.startDate),
      expiryDate: formatDateForInput(initialData?.expiryDate),
      status: initialData?.status ?? InsurancePolicyStatus.ACTIVE,
      tpaName: initialData?.tpaName ?? "",
      tpaContact: initialData?.tpaContact ?? "",
      networkHospitalUrl: initialData?.networkHospitalUrl ?? "",
      policyDocumentRecordId: initialData?.policyDocumentRecordId ?? "",
      notes: initialData?.notes ?? "",
    },
  });

  const selectedType = watch("policyType");
  const selectedStatus = watch("status");

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const payload: Record<string, unknown> = {
        providerName: values.providerName.trim(),
        policyName: values.policyName.trim(),
        policyNumber: values.policyNumber.trim(),
        policyType: values.policyType,
        sumInsured: values.sumInsured,
        expiryDate: values.expiryDate,
        status: values.status,
      };

      if (values.premiumAmount !== undefined && !isNaN(values.premiumAmount)) {
        payload.premiumAmount = values.premiumAmount;
      }
      if (values.startDate) payload.startDate = values.startDate;
      if (values.tpaName) payload.tpaName = values.tpaName.trim();
      if (values.tpaContact) payload.tpaContact = values.tpaContact.trim();
      if (values.networkHospitalUrl) payload.networkHospitalUrl = values.networkHospitalUrl.trim();
      if (values.policyDocumentRecordId) payload.policyDocumentRecordId = values.policyDocumentRecordId;
      if (values.notes) payload.notes = values.notes.trim();

      const endpoint = isEditing
        ? `/api/insurance/${initialData?.id}`
        : "/api/insurance";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as {
        data?: InsurancePolicy;
        error?: { message?: string };
      };

      if (!res.ok) {
        throw new Error(json.error?.message ?? "Failed to save insurance policy");
      }

      router.push(isEditing ? `/insurance/${initialData?.id}` : "/insurance");
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
          Policy Identification & Coverage
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Provider Name */}
          <div>
            <label
              htmlFor="providerName"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Insurance Provider / Company <span className="text-rose-500">*</span>
            </label>
            <Input
              id="providerName"
              placeholder="e.g. Star Health, HDFC ERGO, Niva Bupa, Care"
              {...register("providerName")}
              aria-invalid={!!errors.providerName}
            />
            {errors.providerName && (
              <p className="mt-1 text-xs text-rose-600">{errors.providerName.message}</p>
            )}
          </div>

          {/* Policy Name */}
          <div>
            <label
              htmlFor="policyName"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Plan / Policy Name <span className="text-rose-500">*</span>
            </label>
            <Input
              id="policyName"
              placeholder="e.g. Optima Secure, Young Star, Health Companion"
              {...register("policyName")}
              aria-invalid={!!errors.policyName}
            />
            {errors.policyName && (
              <p className="mt-1 text-xs text-rose-600">{errors.policyName.message}</p>
            )}
          </div>

          {/* Policy Number */}
          <div>
            <label
              htmlFor="policyNumber"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Policy / Member Number <span className="text-rose-500">*</span>
            </label>
            <Input
              id="policyNumber"
              placeholder="e.g. POL-99281203"
              {...register("policyNumber")}
              aria-invalid={!!errors.policyNumber}
            />
            {errors.policyNumber && (
              <p className="mt-1 text-xs text-rose-600">{errors.policyNumber.message}</p>
            )}
          </div>

          {/* Policy Type */}
          <div>
            <label
              htmlFor="policyType"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Plan Type <span className="text-rose-500">*</span>
            </label>
            <select
              id="policyType"
              value={selectedType}
              onChange={(e) => setValue("policyType", e.target.value as InsurancePolicyType)}
              className={cn(
                "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              {Object.entries(INSURANCE_POLICY_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
            {errors.policyType && (
              <p className="mt-1 text-xs text-rose-600">{errors.policyType.message}</p>
            )}
          </div>

          {/* Sum Insured */}
          <div>
            <label
              htmlFor="sumInsured"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Sum Insured (INR ₹) <span className="text-rose-500">*</span>
            </label>
            <Input
              id="sumInsured"
              type="number"
              step="1000"
              placeholder="e.g. 1000000 for ₹10 Lakh"
              {...register("sumInsured")}
              aria-invalid={!!errors.sumInsured}
            />
            {errors.sumInsured && (
              <p className="mt-1 text-xs text-rose-600">{errors.sumInsured.message}</p>
            )}
          </div>

          {/* Premium Amount */}
          <div>
            <label
              htmlFor="premiumAmount"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Annual Premium (INR ₹)
            </label>
            <Input
              id="premiumAmount"
              type="number"
              step="100"
              placeholder="e.g. 18500"
              {...register("premiumAmount")}
            />
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Policy Status <span className="text-rose-500">*</span>
            </label>
            <select
              id="status"
              value={selectedStatus}
              onChange={(e) => setValue("status", e.target.value as InsurancePolicyStatus)}
              className={cn(
                "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              {Object.entries(INSURANCE_POLICY_STATUS_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-xs text-rose-600">{errors.status.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Dates & Validity Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Policy Dates & Validity
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Start Date */}
          <div>
            <label
              htmlFor="startDate"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Coverage Inception / Start Date
            </label>
            <Input id="startDate" type="date" {...register("startDate")} />
          </div>

          {/* Expiry Date */}
          <div>
            <label
              htmlFor="expiryDate"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Renewal / Expiry Date <span className="text-rose-500">*</span>
            </label>
            <Input
              id="expiryDate"
              type="date"
              {...register("expiryDate")}
              aria-invalid={!!errors.expiryDate}
            />
            {errors.expiryDate && (
              <p className="mt-1 text-xs text-rose-600">{errors.expiryDate.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* TPA & Cashless Claims Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Third Party Administrator (TPA) & Hospital Network
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* TPA Name */}
          <div>
            <label
              htmlFor="tpaName"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              TPA Provider Name
            </label>
            <Input
              id="tpaName"
              placeholder="e.g. Medi Assist, Vidal Health, Paramount TPA"
              {...register("tpaName")}
            />
          </div>

          {/* TPA Contact */}
          <div>
            <label
              htmlFor="tpaContact"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              TPA Helpline / Toll-Free
            </label>
            <Input
              id="tpaContact"
              placeholder="e.g. 1800-425-9449"
              {...register("tpaContact")}
            />
          </div>

          {/* Network Hospital Locator URL */}
          <div className="sm:col-span-2">
            <label
              htmlFor="networkHospitalUrl"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Network Hospital Locator URL
            </label>
            <Input
              id="networkHospitalUrl"
              placeholder="e.g. https://www.starhealth.in/network-hospitals"
              {...register("networkHospitalUrl")}
            />
          </div>

          {/* Link to Health Record Document */}
          <div className="sm:col-span-2">
            <label
              htmlFor="policyDocumentRecordId"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Linked Policy Document in Health Records
            </label>
            <select
              id="policyDocumentRecordId"
              {...register("policyDocumentRecordId")}
              className={cn(
                "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <option value="">None (Record metadata only)</option>
              {insuranceDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title} ({doc.fileName})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Link this policy to an uploaded Insurance Document in your Health Records.
            </p>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label
              htmlFor="notes"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Policy Notes / Key Exclusions / Room Rent Limits
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="e.g. No room rent capping, 10% co-pay on senior members, Ayush treatment covered up to 100% of sum insured..."
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
              <Shield />
            )
          }
        >
          {isSubmitting
            ? "Saving..."
            : isEditing
            ? "Update Policy"
            : "Save Policy"}
        </Button>
      </div>
    </form>
  );
}
