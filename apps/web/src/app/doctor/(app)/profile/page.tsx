"use client";

/**
 * Doctor Profile Management — Phase 11B.
 *
 * Allows the authenticated practitioner to view and edit their profile.
 * All data is loaded via GET /api/doctor/profile and saved via PATCH /api/doctor/profile.
 *
 * Registration numbers are explicitly labeled as self-reported only.
 * No false claims of verification, licensing, or certification.
 */

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context.tsx";
import {
  Button,
  Input,
  Alert,
  AlertDescription,
  Badge,
} from "@nexus/ui";
import {
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Building2,
  ShieldAlert,
} from "lucide-react";

interface ProfileFormData {
  displayName: string;
  email: string;
  specialization: string;
  qualifications: string;
  clinicName: string;
  registrationNumber: string;
  consultationAddress: string;
  consultationPhone: string;
  profileStatus: "ACTIVE" | "INCOMPLETE" | string;
  updatedAt: string | null;
}

interface FormErrors {
  displayName?: string;
  specialization?: string;
  clinicName?: string;
  email?: string;
}

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [errors, setErrors] = React.useState<FormErrors>({});

  const [form, setForm] = React.useState<ProfileFormData>({
    displayName: "",
    email: "",
    specialization: "",
    qualifications: "",
    clinicName: "",
    registrationNumber: "",
    consultationAddress: "",
    consultationPhone: "",
    profileStatus: "INCOMPLETE",
    updatedAt: null,
  });

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/doctor/profile");
        const json = (await res.json()) as {
          success: boolean;
          data?: {
            displayName?: string;
            email?: string;
            specialization?: string;
            qualifications?: string;
            clinicName?: string;
            registrationNumber?: string;
            consultationAddress?: string;
            consultationPhone?: string;
            profileStatus?: string;
            updatedAt?: string;
          };
          error?: { message: string };
        };
        if (!cancelled && json.success && json.data) {
          setForm({
            displayName: json.data.displayName || "",
            email: json.data.email || "",
            specialization: json.data.specialization || "",
            qualifications: json.data.qualifications || "",
            clinicName: json.data.clinicName || "",
            registrationNumber: json.data.registrationNumber || "",
            consultationAddress: json.data.consultationAddress || "",
            consultationPhone: json.data.consultationPhone || "",
            profileStatus: json.data.profileStatus || "INCOMPLETE",
            updatedAt: json.data.updatedAt ? String(json.data.updatedAt) : null,
          });
        }
      } catch {
        if (!cancelled) setError("Failed to load doctor profile. Please refresh.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.displayName.trim()) {
      errs.displayName = "Display name is required";
    } else if (form.displayName.trim().length < 2) {
      errs.displayName = "Display name must be at least 2 characters";
    }

    if (!form.specialization.trim()) {
      errs.specialization = "Specialization is required";
    }

    if (!form.clinicName.trim()) {
      errs.clinicName = "Clinic or Hospital name is required";
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Please enter a valid email address";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validate()) {
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/doctor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName.trim(),
          email: form.email.trim() || undefined,
          specialization: form.specialization.trim(),
          qualifications: form.qualifications.trim() || null,
          clinicName: form.clinicName.trim(),
          registrationNumber: form.registrationNumber.trim() || null,
          consultationAddress: form.consultationAddress.trim() || null,
          consultationPhone: form.consultationPhone.trim() || null,
        }),
      });

      const json = (await res.json()) as {
        success: boolean;
        data?: {
          displayName?: string;
          email?: string;
          specialization?: string;
          qualifications?: string;
          clinicName?: string;
          registrationNumber?: string;
          consultationAddress?: string;
          consultationPhone?: string;
          profileStatus?: string;
          updatedAt?: string;
        };
        error?: { message: string };
      };

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to update profile.");
        return;
      }

      if (json.data) {
        setForm((prev) => ({
          ...prev,
          profileStatus: json.data?.profileStatus || prev.profileStatus,
          updatedAt: json.data?.updatedAt ? String(json.data.updatedAt) : prev.updatedAt,
        }));
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      setError("Network error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ProfileFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const isActive = form.profileStatus === "ACTIVE";

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading doctor profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/doctor/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="size-3.5" />
            Back to Doctor Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Doctor Profile
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your professional credentials and practice information
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={isActive ? "success" : "warning"}>
                {isActive ? "ACTIVE PROFILE" : "INCOMPLETE PROFILE"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <Alert variant="error" className="animate-fade-in">
            <AlertDescription className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="animate-fade-in">
            <AlertDescription className="flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              Doctor profile saved successfully.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Section 1: Professional Identity (Required) */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
              <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Stethoscope className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Professional Identity
                </h2>
                <p className="text-xs text-muted-foreground">
                  Required fields to establish active doctor status
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Display Name *"
                  id="doctor-displayName"
                  value={form.displayName}
                  onChange={(e) => updateField("displayName", e.target.value)}
                  placeholder="e.g. Dr. Sunita Patel"
                  required
                  {...(errors.displayName ? { errorMessage: errors.displayName } : {})}
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Specialization *"
                  id="doctor-specialization"
                  value={form.specialization}
                  onChange={(e) => updateField("specialization", e.target.value)}
                  placeholder="e.g. Cardiology, Pediatrics, Ayurveda, General Medicine"
                  required
                  {...(errors.specialization ? { errorMessage: errors.specialization } : {})}
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Qualifications (optional)"
                  id="doctor-qualifications"
                  value={form.qualifications}
                  onChange={(e) => updateField("qualifications", e.target.value)}
                  placeholder="e.g. MBBS, MD, BAMS, MS"
                  helperText="Academic and medical degrees"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Registration & Medical License (Self-Reported) */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Registration Number (Self-Reported)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Practitioner council identification (non-verified)
                </p>
              </div>
            </div>

            <div>
              <Input
                label="Council Registration Number"
                id="doctor-registrationNumber"
                value={form.registrationNumber}
                onChange={(e) => updateField("registrationNumber", e.target.value)}
                placeholder="e.g. MCI-123456, DMC-98765"
              />
              <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="size-3 text-amber-500 shrink-0" />
                <span>
                  This registration number is self-reported by the practitioner. Ayush-Life Nexus does not verify medical council registries in this release.
                </span>
              </p>
            </div>
          </div>

          {/* Section 3: Practice & Consultation Details */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
              <div className="flex size-7 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                <Building2 className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Practice Location & Contact
                </h2>
                <p className="text-xs text-muted-foreground">
                  Details for patient communication and consent records
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Clinic / Hospital Name *"
                  id="doctor-clinicName"
                  value={form.clinicName}
                  onChange={(e) => updateField("clinicName", e.target.value)}
                  placeholder="e.g. Apollo Clinic, City Health Center"
                  required
                  {...(errors.clinicName ? { errorMessage: errors.clinicName } : {})}
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Consultation Address"
                  id="doctor-consultationAddress"
                  value={form.consultationAddress}
                  onChange={(e) => updateField("consultationAddress", e.target.value)}
                  placeholder="e.g. 102 Health Avenue, Bandra West, Mumbai"
                />
              </div>

              <div>
                <Input
                  label="Consultation Phone"
                  id="doctor-consultationPhone"
                  type="tel"
                  value={form.consultationPhone}
                  onChange={(e) => updateField("consultationPhone", e.target.value)}
                  placeholder="e.g. 022-26401122"
                />
              </div>

              <div>
                <Input
                  label="Professional Email"
                  id="doctor-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="doctor@hospital.org"
                  {...(errors.email ? { errorMessage: errors.email } : {})}
                />
              </div>
            </div>
          </div>

          {/* Section 4: System Identity (Read-only) */}
          <div className="rounded-2xl border border-border bg-muted/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold text-foreground">Unique Nexus ID</span>
              <p className="font-mono text-muted-foreground mt-0.5">{user.nexusId}</p>
            </div>
            {form.updatedAt && (
              <div className="text-muted-foreground text-right">
                Last updated: {new Date(form.updatedAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto min-w-[160px] gap-2"
              isLoading={saving}
            >
              <Save className="size-4" />
              {saving ? "Saving Changes…" : "Save Profile"}
            </Button>
            <Link
              href="/doctor/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
