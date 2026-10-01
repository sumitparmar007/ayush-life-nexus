"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Activity, ArrowRight, Lock, Eye, Database } from "lucide-react";
import { Button } from "@nexus/ui";

export function PrivacyDataSettings() {
  return (
    <div className="flex flex-col gap-6">
      {/* Sovereignty Summary Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Lock className="size-4 text-primary" />
          Patient Data Sovereignty
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          You have absolute control over your health intelligence. Ayush Nexus enforces end-to-end patient consent and maintains an immutable audit log of all system interactions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex flex-col gap-1 p-3 rounded-xl bg-muted/40 border border-border/40">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Eye className="size-3.5 text-sage-600 dark:text-sage-400" />
              Granular Consent
            </span>
            <span className="text-[11px] text-muted-foreground">
              Authorize specific doctors or insurers to view only selected record categories.
            </span>
          </div>

          <div className="flex flex-col gap-1 p-3 rounded-xl bg-muted/40 border border-border/40">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Activity className="size-3.5 text-indigo-600 dark:text-indigo-400" />
              Immutable Audit
            </span>
            <span className="text-[11px] text-muted-foreground">
              Every data addition, consent grant, and sign-in session is permanently recorded.
            </span>
          </div>

          <div className="flex flex-col gap-1 p-3 rounded-xl bg-muted/40 border border-border/40">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Database className="size-3.5 text-amber-600 dark:text-amber-400" />
              Zero Third-Party Sharing
            </span>
            <span className="text-[11px] text-muted-foreground">
              Your medical records are never monetized, indexed, or shared without explicit authorization.
            </span>
          </div>
        </div>
      </div>

      {/* Direct Module Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Consent Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-sage-100 dark:bg-sage-950 text-sage-600 dark:text-sage-400">
                <ShieldCheck className="size-4" />
              </span>
              <h3 className="text-sm font-semibold text-foreground">
                Consent & Privacy Manager
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Review authorized doctors, hospital clinics, and insurance providers. Grant new access permissions or revoke existing authorizations at any time.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-border/40">
            <Link href="/consent">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                rightIcon={<ArrowRight className="size-3.5" />}
              >
                Manage Data Consents
              </Button>
            </Link>
          </div>
        </div>

        {/* Activity Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Activity className="size-4" />
              </span>
              <h3 className="text-sm font-semibold text-foreground">
                Activity Log & Audit Trail
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Examine the chronological audit history of record uploads, prescriptions added, lab test recordings, and authentication timestamps.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-border/40">
            <Link href="/activity">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                rightIcon={<ArrowRight className="size-3.5" />}
              >
                View Full Audit History
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
