"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button, Alert, AlertDescription } from "@nexus/ui";
import { AuthCard, AuthLogo, AuthHeading } from "@/components/auth/auth-card.tsx";
import { OtpInput } from "@/components/auth/otp-input.tsx";

const RESEND_COOLDOWN_S = 30;

function VerifyOtpForm() {
  const params = useSearchParams();
  const requestId = params.get("requestId") ?? "";
  const masked = params.get("masked") ?? "your number";
  const phone = params.get("phone") ?? "";
  const isDevelopment = process.env.NODE_ENV === "development";

  const [otp, setOtp] = React.useState("");
  const [developmentOtp, setDevelopmentOtp] = React.useState<string | null>(
    isDevelopment ? params.get("otp") ?? null : null
  );
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(RESEND_COOLDOWN_S);
  const [currentRequestId, setCurrentRequestId] = React.useState(requestId);

  // Countdown
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const doVerify = React.useCallback(async (code: string) => {
    if (code.length !== 6 || isVerifying) return;
    setIsVerifying(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: currentRequestId, otp: code }),
      });
      const json = await res.json() as { success: boolean; data?: { role?: string }; error?: { message: string } };
      if (!res.ok || !json.success) {
        setError(json.error?.message ?? "Verification failed");
        setOtp("");
        return;
      }
      if (json.data?.role === "DOCTOR") {
        window.location.href = "/doctor/dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Network error. Please try again.");
      setOtp("");
    } finally {
      setIsVerifying(false);
    }
  }, [currentRequestId, isVerifying]);

  React.useEffect(() => {
    if (!isDevelopment || !developmentOtp) return;
    setOtp(developmentOtp);
  }, [developmentOtp, isDevelopment]);

  const handleResend = async () => {
    if (!phone) { window.location.href = "/auth/login"; return; }
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json() as { success: boolean; data?: { requestId: string }; otp?: string; error?: { message: string } };
      if (!res.ok || !json.success || !json.data) {
        setError(json.error?.message ?? "Failed to resend OTP");
        return;
      }
      setCurrentRequestId(json.data.requestId);
      setCooldown(RESEND_COOLDOWN_S);
      if (isDevelopment && typeof json.otp === "string" && json.otp) {
        setDevelopmentOtp(json.otp);
        setOtp(json.otp);
      } else {
        setDevelopmentOtp(null);
        setOtp("");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthCard>
      <AuthLogo />
      <AuthHeading title="Enter your OTP" description={`We sent a 6-digit code to ${masked}`} />

      {error && (
        <div className="mb-4">
          <Alert variant="error"><AlertDescription>{error}</AlertDescription></Alert>
        </div>
      )}

      <div className="flex flex-col items-center gap-6">
        {isDevelopment && developmentOtp ? (
          <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            Development OTP: {developmentOtp}
          </div>
        ) : null}

        <OtpInput value={otp} onChange={setOtp} disabled={isVerifying} hasError={Boolean(error)} autoFocus />

        <Button
          size="lg"
          className="w-full"
          isLoading={isVerifying}
          onClick={() => void doVerify(otp)}
          disabled={otp.length < 6 || isVerifying}
        >
          Verify OTP
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
        onClick={() => { window.location.href = "/auth/login"; }}
        className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </button>
    </AuthCard>
  );
}

export default function VerifyOtpPage() {
  return (
    <React.Suspense fallback={<div className="flex justify-center p-8 text-sm text-muted-foreground">Loading...</div>}>
      <VerifyOtpForm />
    </React.Suspense>
  );
}
