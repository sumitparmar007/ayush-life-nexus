"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Shield, Check, Loader2 } from "lucide-react";
import { Button, Input, Alert, AlertDescription } from "@nexus/ui";
import type { UserSettings } from "@/types/settings.ts";

const profileSchema = z.object({
  displayName: z.string().min(1, "Display name cannot be empty").max(100),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(200)
    .optional()
    .or(z.literal("")),
  abhaId: z.string().max(50).optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileSettingsFormProps {
  settings: UserSettings;
  onUpdate: (values: {
    displayName?: string | undefined;
    email?: string | undefined;
    abhaId?: string | undefined;
  }) => Promise<{ success: boolean; error?: string }>;
}

export function ProfileSettingsForm({
  settings,
  onUpdate,
}: ProfileSettingsFormProps) {
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: settings.displayName ?? "",
      email: settings.email ?? "",
      abhaId: settings.abhaId ?? "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const res = await onUpdate({
      displayName: values.displayName.trim() || undefined,
      email: values.email?.trim() || undefined,
      abhaId: values.abhaId?.trim() || undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage("Profile details updated successfully.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErrorMessage(res.error ?? "Failed to save profile changes.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {successMessage && (
        <Alert variant="default" className="border-sage-300 bg-sage-50 text-sage-900 dark:border-sage-800 dark:bg-sage-950 dark:text-sage-200">
          <Check className="size-4 text-sage-600 dark:text-sage-400" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Personal Information
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Your patient name and optional contact details for your health profile.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Display Name */}
          <div>
            <label
              htmlFor="displayName"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Full Name / Display Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="displayName"
                placeholder="e.g. Ayush Kumar"
                {...register("displayName")}
                aria-invalid={!!errors.displayName}
              />
            </div>
            {errors.displayName && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.displayName.message}
              </p>
            )}
          </div>

          {/* Optional Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Optional Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="e.g. ayush@example.com"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.email.message}
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              Stored as an optional contact field on your profile.
            </p>
          </div>
        </div>
      </div>

      {/* ABHA Identification Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Shield className="size-4 text-primary" />
          National Health Identity (ABHA)
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Ayushman Bharat Health Account number (ABHA ID).
        </p>

        <div className="max-w-md">
          <label
            htmlFor="abhaId"
            className="mb-1.5 block text-xs font-semibold text-foreground"
          >
            ABHA ID / Health Number
          </label>
          <Input
            id="abhaId"
            placeholder="e.g. 91-1234-5678-9012"
            {...register("abhaId")}
            aria-invalid={!!errors.abhaId}
          />
          {errors.abhaId && (
            <p className="mt-1 text-xs text-rose-600">
              {errors.abhaId.message}
            </p>
          )}
          <p className="mt-1 text-[11px] text-muted-foreground">
            {settings.abhaLinked
              ? "✓ ABHA verified & linked"
              : "Note: Entering an ABHA ID records it in your profile. Real ABHA verification bridges are in development."}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          leftIcon={
            isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <User />
            )
          }
        >
          {isSubmitting ? "Saving..." : "Save Profile Changes"}
        </Button>
      </div>
    </form>
  );
}
