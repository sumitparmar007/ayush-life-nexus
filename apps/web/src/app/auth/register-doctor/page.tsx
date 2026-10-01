"use client";

/**
 * Doctor Registration Page — /auth/register-doctor
 *
 * Two-step flow:
 * Step 1: Collect doctor info + phone → send OTP
 * Step 2: Verify OTP → create doctor account
 *
 * Reuses existing OTP infrastructure. Does NOT duplicate OTP logic.
 */

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft, RefreshCw, Stethoscope, Phone } from "lucide-react";
import { Button, Input, Alert, AlertDescription } from "@nexus/ui";
import { AuthCard, AuthLogo, AuthHeading } from "@/components/auth/auth-card.tsx";
import { OtpInput } from "@/components/auth/otp-input.tsx";

const registrationSchema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  specialization: z.string().trim().min(2, "Specialization is required").max(100),
  clinicName: z.string().trim().min(2, "Clinic name is required").max(200),
  qualifications: z.string().trim().max(200).optional(),
  registrationNumber: z.string().trim().max(100).optional(),
  consultationAddress: z.string().trim().max(300).optional(),
  consultationPhone: z.string().trim().max(20).optional(),
});
type RegistrationData = z.infer<typeof registrationSchema>;

const RESEND_COOLDOWN_S = 30;

export default function RegisterDoctorPage() {
  const [step, setStep] = React.useState<"info" | "otp">("info");
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [registrationData, setRegistrationData] = React.useState<RegistrationData | null>(null);
  const [requestId, setRequestId] = React.useState("");
  const [maskedPhone, setMaskedPhone] = React.useState("");
  const [devOtp, setDevOtp] = React.useState<string | null>(null);
  const [otp, setOtp] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);
  const isDevelopment = process.env.NODE_ENV === "development";

  const { register, handleSubmit, formState: { errors } } = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
  });

  // Countdown timer
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Auto-fill dev OTP
  React.useEffect(() => {
    if (isDevelopment && devOtp) {
      setOtp(devOtp);
    }
  }, [devOtp, isDevelopment]);

  // Step 1: Submit registration info → send OTP
  const onSubmitInfo = async (data: RegistrationData) => {
    setApiError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/doctor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json() as {
        success: boolean;
        data?: { requestId: string; maskedPhone: string };
        otp?: string;
        error?: { message: string };
      };
      if (!res.ok || !json.success || !json.data) {
        setApiError(json.error?.message ?? "Registration failed");
        return;
      }
      setRegistrationData(data);
      setRequestId(json.data.requestId);
      setMaskedPhone(json.data.maskedPhone);
      setCooldown(RESEND_COOLDOWN_S);
      if (isDevelopment && typeof json.otp === "string") {
        setDevOtp(json.otp);
      }
      setStep("otp");
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP → create account
  const doVerify = React.useCallback(async (code: string) => {
    if (code.length !== 6 || isVerifying || !registrationData) return;
    setIsVerifying(true);
    setApiError(null);
    try {
      const res = await fetch("/api/doctor/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          otp: code,
          phone: registrationData.phone,
          displayName: registrationData.displayName,
          specialization: registrationData.specialization,
          clinicName: registrationData.clinicName,
          qualifications: registrationData.qualifications || undefined,
          registrationNumber: registrationData.registrationNumber || undefined,
          consultationAddress: registrationData.consultationAddress || undefined,
          consultationPhone: registrationData.consultationPhone || undefined,
        }),
      });
      const json = await res.json() as {
        success: boolean;
        data?: { role: string };
        error?: { message: string };
      };
      if (!res.ok || !json.success) {
        setApiError(json.error?.message ?? "Verification failed");
        setOtp("");
        return;
      }
      // Redirect to doctor dashboard
      window.location.href = "/doctor/dashboard";
    } catch {
      setApiError("Network error. Please try again.");
      setOtp("");
    } finally {
      setIsVerifying(false);
    }
  }, [requestId, registrationData, isVerifying]);

  // Resend OTP
  const handleResend = async () => {
    if (!registrationData) return;
    setIsSending(true);
    setApiError(null);
    try {
      const res = await fetch("/api/doctor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });
      const json = await res.json() as {
        success: boolean;
        data?: { requestId: string };
        otp?: string;
        error?: { message: string };
      };
      if (!res.ok || !json.success || !json.data) {
        setApiError(json.error?.message ?? "Failed to resend OTP");
        return;
      }
      setRequestId(json.data.requestId);
      setCooldown(RESEND_COOLDOWN_S);
      if (isDevelopment && typeof json.otp === "string") {
        setDevOtp(json.otp);
        setOtp(json.otp);
      } else {
        setDevOtp(null);
        setOtp("");
      }
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // ─── Step 1: Info Form ──────────────────────────────────────────────────────

  if (step === "info") {
    return (
      <AuthCard className="max-w-lg">
        <AuthLogo />
        <AuthHeading
          title="Doctor Registration"
          description="Create your Ayush Nexus doctor account."
        />

        <div className="mb-5 flex items-center gap-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 px-3 py-2">
          <Stethoscope className="size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <p className="text-xs text-indigo-700 dark:text-indigo-300">
            This registration is for healthcare practitioners only.
          </p>
        </div>

        {apiError && (
          <div className="mb-4">
            <Alert variant="error"><AlertDescription>{apiError}</AlertDescription></Alert>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmitInfo)} noValidate className="flex flex-col gap-3.5">
          <Input
            {...register("phone")}
            label="Mobile Number"
            type="tel"
            inputMode="numeric"
            placeholder="Enter 10-digit number"
            required
            autoFocus
            autoComplete="tel-national"
            leftIcon={<Phone />}
            {...(errors.phone?.message ? { errorMessage: errors.phone.message } : {})}
            helperText="India mobile numbers only (6–9XXXXXXXXX)"
          />

          <Input
            {...register("displayName")}
            label="Full Name"
            placeholder="Dr. Full Name"
            required
            {...(errors.displayName?.message ? { errorMessage: errors.displayName.message } : {})}
          />

          <Input
            {...register("specialization")}
            label="Specialization"
            placeholder="e.g. Cardiology, Ayurveda, General Medicine"
            required
            {...(errors.specialization?.message ? { errorMessage: errors.specialization.message } : {})}
          />

          <Input
            {...register("clinicName")}
            label="Clinic / Hospital Name"
            placeholder="e.g. City Health Clinic"
            required
            {...(errors.clinicName?.message ? { errorMessage: errors.clinicName.message } : {})}
          />

          <Input
            {...register("qualifications")}
            label="Qualifications (optional)"
            placeholder="e.g. MBBS, MD, BAMS"
            {...(errors.qualifications?.message ? { errorMessage: errors.qualifications.message } : {})}
          />

          <div>
            <Input
              {...register("registrationNumber")}
              label="Registration Number (optional, self-reported)"
              placeholder="e.g. MCI-123456"
              {...(errors.registrationNumber?.message ? { errorMessage: errors.registrationNumber.message } : {})}
            />
            <p className="mt-0.5 text-xs text-muted-foreground">
              Self-reported only — not verified.
            </p>
          </div>

          <Button type="submit" size="lg" className="w-full mt-1" isLoading={isLoading} rightIcon={<ArrowRight />}>
            Continue with OTP
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-primary hover:underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  // ─── Step 2: OTP Verification ───────────────────────────────────────────────

  return (
    <AuthCard>
      <AuthLogo />
      <AuthHeading title="Verify your phone" description={`We sent a 6-digit code to ${maskedPhone}`} />

      {apiError && (
        <div className="mb-4">
          <Alert variant="error"><AlertDescription>{apiError}</AlertDescription></Alert>
        </div>
      )}

      <div className="flex flex-col items-center gap-6">
        {isDevelopment && devOtp ? (
          <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            Development OTP: {devOtp}
          </div>
        ) : null}

        <OtpInput value={otp} onChange={setOtp} disabled={isVerifying} hasError={Boolean(apiError)} autoFocus />

        <Button
          size="lg"
          className="w-full"
          isLoading={isVerifying}
          onClick={() => void doVerify(otp)}
          disabled={otp.length < 6 || isVerifying}
        >
          Verify & Create Account
        </Button>

        <div className="text-sm text-muted-foreground">
          {cooldown > 0 ? (
            <span>Resend OTP in {cooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isSending}
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline underline-offset-2 disabled:opacity-50"
            >
              <RefreshCw className="size-3.5" />
              Resend OTP
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => { setStep("info"); setApiError(null); setOtp(""); }}
        className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to registration
      </button>
    </AuthCard>
  );
}
