"use client";

import * as React from "react";
import {
  Smartphone,
  KeyRound,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import { Button, Badge } from "@nexus/ui";
import { useAuth } from "@/contexts/auth-context.tsx";
import type { UserSettings } from "@/types/settings.ts";
import { format } from "date-fns";

interface SecuritySessionCardProps {
  settings: UserSettings;
}

const TRUST_LEVEL_LABELS: Record<number, { label: string; variant: "default" | "success" | "warning" }> = {
  1: { label: "Level 1 • Phone Verified", variant: "warning" },
  2: { label: "Level 2 • Email Verified", variant: "warning" },
  3: { label: "Level 3 • ABHA Verified", variant: "success" },
  4: { label: "Level 4 • Aadhaar Verified", variant: "success" },
  5: { label: "Level 5 • Staff Elevated", variant: "default" },
};

export function SecuritySessionCard({ settings }: SecuritySessionCardProps) {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const trust = TRUST_LEVEL_LABELS[settings.trustLevel] ?? TRUST_LEVEL_LABELS[1]!;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Account Identity Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Smartphone className="size-4 text-primary" />
              Authenticated Identity
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Nexus account ID and security verification tier.
            </p>
          </div>
          <Badge variant={trust.variant} size="sm">
            <CheckCircle2 className="mr-1 size-3" />
            {trust.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/40 text-xs">
          <div>
            <span className="text-muted-foreground block mb-0.5">Nexus ID</span>
            <span className="font-mono text-foreground font-medium">
              {settings.nexusId}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block mb-0.5">Account Role</span>
            <span className="font-medium text-foreground">
              {settings.role}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block mb-0.5">Member Since</span>
            <span className="text-foreground">
              {format(settings.createdAt, "dd MMMM yyyy")}
            </span>
          </div>
        </div>
      </div>

      {/* Active Session & Authentication Security */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <KeyRound className="size-4 text-primary" />
          Active Session & Authentication
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Current authentication mode and cryptographic session validity.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/40 text-xs">
          <div>
            <span className="text-muted-foreground block mb-0.5">Auth Protocol</span>
            <span className="font-medium text-foreground">
              {settings.authMode === "MODE_B"
                ? "Phone OTP (Passwordless)"
                : "Dual-Mode OTP"}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block mb-0.5">Session Issued</span>
            <span className="text-foreground">
              {settings.sessionIssuedAt
                ? format(settings.sessionIssuedAt, "dd MMM yyyy, HH:mm")
                : "Active"}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block mb-0.5">Session Cutoff</span>
            <span className="text-foreground">
              {settings.sessionExpiresAt
                ? format(settings.sessionExpiresAt, "dd MMM yyyy, HH:mm")
                : "7 days from login"}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-foreground">Sign Out</span>
            <span className="text-[11px] text-muted-foreground">
              Terminate your session and clear local authorization cookies.
            </span>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            leftIcon={<LogOut className="size-4" />}
          >
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </div>
    </div>
  );
}
