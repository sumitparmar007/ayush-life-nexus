"use client";

import * as React from "react";
import Link from "next/link";
import { Phone, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Alert, AlertDescription } from "@nexus/ui";
import { AuthCard, AuthLogo, AuthHeading } from "@/components/auth/auth-card.tsx";

const schema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: data.phone }),
      });
      const json = await res.json() as { success: boolean; data?: { requestId: string; maskedPhone: string }; otp?: string; error?: { message: string } };
      if (!res.ok || !json.success || !json.data) {
        setApiError(json.error?.message ?? "Failed to send OTP");
        return;
      }
      const params = new URLSearchParams({
        requestId: json.data.requestId,
        masked: json.data.maskedPhone,
        phone: data.phone,
      });
      if (process.env.NODE_ENV === "development" && typeof json.otp === "string" && json.otp) {
        params.set("otp", json.otp);
      }
      window.location.href = `/auth/verify-otp?${params.toString()}`;
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthLogo />
      <AuthHeading title="Welcome back" description="Enter your mobile number to receive a one-time password." />

      {apiError && (
        <div className="mb-4">
          <Alert variant="error"><AlertDescription>{apiError}</AlertDescription></Alert>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Input
          {...register("phone")}
          label="Mobile number"
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
        <Button type="submit" size="lg" className="w-full" isLoading={isLoading} rightIcon={<ArrowRight />}>
          Send OTP
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By continuing you agree to our{" "}
        <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>
        {" "}and{" "}
        <Link href="/legal/terms" className="underline underline-offset-2 hover:text-foreground">Terms of Service</Link>.
      </p>

      <div className="mt-4 pt-4 border-t border-border text-center text-xs text-muted-foreground">
        Healthcare practitioner?{" "}
        <Link href="/auth/register-doctor" className="font-medium text-primary hover:underline underline-offset-2">
          Doctor Portal Registration
        </Link>
      </div>
    </AuthCard>
  );
}
