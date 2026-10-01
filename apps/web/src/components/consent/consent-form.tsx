"use client";

/**
 * ConsentForm — handles grant (create) and edit of a consent record.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@nexus/utils";
import { Button, Input, Alert, AlertDescription } from "@nexus/ui";
import {
  ConsentStatus,
  ConsentRecipientType,
  ConsentPurpose,
  ConsentDataScope,
  ConsentPermission,
  CONSENT_STATUS_LABELS,
  CONSENT_RECIPIENT_TYPE_LABELS,
  CONSENT_PURPOSE_LABELS,
  CONSENT_DATA_SCOPE_LABELS,
  CONSENT_PERMISSION_LABELS,
  type ConsentRecord,
} from "@/types/consent.ts";

const formSchema = z.object({
  recipientName: z.string().min(1, "Recipient / Doctor name is required").max(200),
  recipientType: z.nativeEnum(ConsentRecipientType, { required_error: "Select recipient type" }),
  organizationName: z.string().max(200).optional(),
  purpose: z.nativeEnum(ConsentPurpose, { required_error: "Select purpose" }),
  dataScopes: z
    .array(z.nativeEnum(ConsentDataScope))
    .min(1, "Select at least one permitted data category"),
  permission: z.nativeEnum(ConsentPermission, { required_error: "Select permission level" }),
  status: z.nativeEnum(ConsentStatus).optional(),
  expiresAt: z.string().min(1, "Expiration date is required"),
  notes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ConsentFormProps {
  initialData?: ConsentRecord | null;
  isEditing?: boolean;
}

export function ConsentForm({
  initialData,
  isEditing = false,
}: ConsentFormProps) {
  const router = useRouter();
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const formatDateForInput = (d?: Date | string | null): string => {
    if (!d) return "";
    const dateObj = typeof d === "string" ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return "";
    return dateObj.toISOString().split("T")[0] ?? "";
  };

  // Default expiry date: 30 days from now
  const defaultExpiry = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return formatDateForInput(d);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientName: initialData?.recipientName ?? "",
      recipientType: initialData?.recipientType ?? ConsentRecipientType.DOCTOR,
      organizationName: initialData?.organizationName ?? "",
      purpose: initialData?.purpose ?? ConsentPurpose.DIRECT_CARE,
      dataScopes: initialData?.dataScopes ?? [ConsentDataScope.ALL_DATA],
      permission: initialData?.permission ?? ConsentPermission.VIEW_ONLY,
      status: initialData?.status ?? ConsentStatus.ACTIVE,
      expiresAt: initialData?.expiresAt
        ? formatDateForInput(initialData.expiresAt)
        : defaultExpiry,
      notes: initialData?.notes ?? "",
    },
  });

  const selectedType = watch("recipientType");
  const selectedPurpose = watch("purpose");
  const selectedPermission = watch("permission");
  const selectedStatus = watch("status");
  const selectedScopes = watch("dataScopes") || [];

  const handleScopeToggle = (scope: ConsentDataScope) => {
    if (scope === ConsentDataScope.ALL_DATA) {
      // Toggle ALL_DATA
      if (selectedScopes.includes(ConsentDataScope.ALL_DATA)) {
        setValue("dataScopes", []);
      } else {
        setValue("dataScopes", [ConsentDataScope.ALL_DATA]);
      }
      return;
    }

    // Specific category toggled
    const withoutAll = selectedScopes.filter((s) => s !== ConsentDataScope.ALL_DATA);
    if (withoutAll.includes(scope)) {
      setValue(
        "dataScopes",
        withoutAll.filter((s) => s !== scope)
      );
    } else {
      setValue("dataScopes", [...withoutAll, scope]);
    }
  };

  const setExpiryDaysPreset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setValue("expiresAt", formatDateForInput(d));
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const payload: Record<string, unknown> = {
        recipientName: values.recipientName.trim(),
        recipientType: values.recipientType,
        purpose: values.purpose,
        dataScopes: values.dataScopes,
        permission: values.permission,
        expiresAt: values.expiresAt,
      };

      if (values.organizationName) {
        payload.organizationName = values.organizationName.trim();
      }
      if (values.status) {
        payload.status = values.status;
      }
      if (values.notes) {
        payload.notes = values.notes.trim();
      }

      const endpoint = isEditing
        ? `/api/consent/${initialData?.id}`
        : "/api/consent";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as {
        data?: ConsentRecord;
        error?: { message?: string };
      };

      if (!res.ok) {
        throw new Error(json.error?.message ?? "Failed to save consent");
      }

      router.push(isEditing ? `/consent/${initialData?.id}` : "/consent");
      router.refresh();
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
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

      {/* Recipient Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recipient & Medical Purpose
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Recipient Name */}
          <div>
            <label
              htmlFor="recipientName"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Recipient / Doctor / Provider Name <span className="text-rose-500">*</span>
            </label>
            <Input
              id="recipientName"
              placeholder="e.g. Dr. Sneha Verma, Cardiologist"
              {...register("recipientName")}
              aria-invalid={!!errors.recipientName}
            />
            {errors.recipientName && (
              <p className="mt-1 text-xs text-rose-600">{errors.recipientName.message}</p>
            )}
          </div>

          {/* Recipient Type */}
          <div>
            <label
              htmlFor="recipientType"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Entity Classification <span className="text-rose-500">*</span>
            </label>
            <select
              id="recipientType"
              value={selectedType}
              onChange={(e) =>
                setValue("recipientType", e.target.value as ConsentRecipientType)
              }
              className={cn(
                "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              {Object.entries(CONSENT_RECIPIENT_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
            {errors.recipientType && (
              <p className="mt-1 text-xs text-rose-600">{errors.recipientType.message}</p>
            )}
          </div>

          {/* Organization Name */}
          <div>
            <label
              htmlFor="organizationName"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Hospital / Clinic / Organization Name
            </label>
            <Input
              id="organizationName"
              placeholder="e.g. Max Super Speciality Hospital, Saket"
              {...register("organizationName")}
            />
          </div>

          {/* Purpose */}
          <div>
            <label
              htmlFor="purpose"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Healthcare Purpose <span className="text-rose-500">*</span>
            </label>
            <select
              id="purpose"
              value={selectedPurpose}
              onChange={(e) =>
                setValue("purpose", e.target.value as ConsentPurpose)
              }
              className={cn(
                "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              {Object.entries(CONSENT_PURPOSE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
            {errors.purpose && (
              <p className="mt-1 text-xs text-rose-600">{errors.purpose.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Scope & Permissions Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Data Access Permissions & Scope
        </h2>

        <div className="flex flex-col gap-4">
          {/* Multi-select Data Scope Checkboxes */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-foreground">
              Select Permitted Health Data Categories <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(CONSENT_DATA_SCOPE_LABELS).map(([key, label]) => {
                const scope = key as ConsentDataScope;
                const isChecked =
                  selectedScopes.includes(scope) ||
                  (scope !== ConsentDataScope.ALL_DATA &&
                    selectedScopes.includes(ConsentDataScope.ALL_DATA));

                return (
                  <label
                    key={scope}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      isChecked
                        ? "border-primary bg-primary/5 text-foreground font-medium"
                        : "border-border bg-card hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleScopeToggle(scope)}
                      className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-xs">{label}</span>
                  </label>
                );
              })}
            </div>
            {errors.dataScopes && (
              <p className="mt-1.5 text-xs text-rose-600">
                {errors.dataScopes.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
            {/* Permission Level */}
            <div>
              <label
                htmlFor="permission"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Access Level <span className="text-rose-500">*</span>
              </label>
              <select
                id="permission"
                value={selectedPermission}
                onChange={(e) =>
                  setValue("permission", e.target.value as ConsentPermission)
                }
                className={cn(
                  "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                {Object.entries(CONSENT_PERMISSION_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Initial Consent Status
              </label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) =>
                  setValue("status", e.target.value as ConsentStatus)
                }
                className={cn(
                  "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                {Object.entries(CONSENT_STATUS_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Validity & Expiry Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Consent Validity Period
        </h2>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              Quick validity presets:
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setExpiryDaysPreset(7)}
            >
              7 Days
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setExpiryDaysPreset(30)}
            >
              30 Days
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setExpiryDaysPreset(90)}
            >
              90 Days
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setExpiryDaysPreset(365)}
            >
              1 Year
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
            <div>
              <label
                htmlFor="expiresAt"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Expiration / Cutoff Date <span className="text-rose-500">*</span>
              </label>
              <Input
                id="expiresAt"
                type="date"
                {...register("expiresAt")}
                aria-invalid={!!errors.expiresAt}
              />
              {errors.expiresAt && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.expiresAt.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="notes"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Consent Notes & Restrictions
              </label>
              <textarea
                id="notes"
                rows={2}
                placeholder="e.g. Granted specifically for post-operative follow up consultation..."
                {...register("notes")}
                className={cn(
                  "flex w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm shadow-xs",
                  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              />
            </div>
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
              <ShieldCheck />
            )
          }
        >
          {isSubmitting
            ? "Saving..."
            : isEditing
            ? "Update Consent"
            : "Grant Consent"}
        </Button>
      </div>
    </form>
  );
}
