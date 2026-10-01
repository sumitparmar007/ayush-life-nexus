import * as React from "react";
import Link from "next/link";
import { FileText, Shield, ShieldCheck, FlaskConical, Pill, ArrowRight } from "lucide-react";
import { cn } from "@nexus/utils";
import { Badge } from "@nexus/ui";
import { WidgetContainer, WidgetEmpty } from "./widget-container.tsx";
import type {
  MedicalRecordsSummary,
  InsuranceSummary,
  ConsentSummary,
  LabSummary,
  MedicationSummary,
  WidgetStatus,
} from "@/types/dashboard.ts";

// ─── Shared ───────────────────────────────────────────────────────────────────

interface StatRowProps {
  label: string;
  value: string | number;
  highlight?: "success" | "warning" | "error";
}

function StatRow({ label, value, highlight }: StatRowProps) {
  const color =
    highlight === "success" ? "text-sage-700 dark:text-sage-400" :
    highlight === "warning" ? "text-amber-700 dark:text-amber-400" :
    highlight === "error"   ? "text-rose-700 dark:text-rose-400" :
    "text-foreground";
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", color)}>{value}</span>
    </div>
  );
}

function ViewAllLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-2"
    >
      {label}
      <ArrowRight className="size-3.5" aria-hidden="true" />
    </Link>
  );
}

// ─── Medical Records ──────────────────────────────────────────────────────────

interface MedicalRecordsWidgetProps { data: MedicalRecordsSummary | null; status: WidgetStatus; onRetry?: () => void; }

export function MedicalRecordsWidget({ data, status, onRetry }: MedicalRecordsWidgetProps) {
  return (
    <WidgetContainer title="Health Records" status={status} {...(onRetry !== undefined ? { onRetry } : {})}>
      {status === "empty" || (data && data.totalRecords === 0) ? (
        <WidgetEmpty icon={FileText} message="No records yet. Upload your first document." actionLabel="Upload record" actionHref="/records/upload" />
      ) : data ? (
        <>
          <div className="divide-y divide-border/60">
            <StatRow label="Total records" value={data.totalRecords} />
            <StatRow label="Added this month" value={data.recentCount} {...(data.recentCount > 0 ? { highlight: "success" as const } : {})} />
            <StatRow label="Pending review" value={data.pendingVerification} {...(data.pendingVerification > 0 ? { highlight: "warning" as const } : {})} />
          </div>
          <ViewAllLink href="/records" label="View all records" />
        </>
      ) : null}
    </WidgetContainer>
  );
}

// ─── Insurance ────────────────────────────────────────────────────────────────

interface InsuranceWidgetProps { data: InsuranceSummary | null; status: WidgetStatus; onRetry?: () => void; }

export function InsuranceWidget({ data, status, onRetry }: InsuranceWidgetProps) {
  return (
    <WidgetContainer title="Insurance" status={status} {...(onRetry !== undefined ? { onRetry } : {})}>
      {status === "empty" || (data && data.activePolicies === 0) ? (
        <WidgetEmpty icon={Shield} message="No insurance policies linked." actionLabel="Add policy" actionHref="/insurance/add" />
      ) : data ? (
        <>
          <div className="divide-y divide-border/60">
            <StatRow label="Active policies" value={data.activePolicies} />
            <StatRow label="Total coverage" value={data.totalCoverage !== null ? `₹${(data.totalCoverage / 100000).toFixed(1)}L` : "—"} />
            {data.nearestRenewalDays !== null && (
              <StatRow label="Next renewal" value={`${data.nearestRenewalDays}d`} highlight={data.nearestRenewalDays <= 30 ? "warning" : "success"} />
            )}
          </div>
          <ViewAllLink href="/insurance" label="View policies" />
        </>
      ) : null}
    </WidgetContainer>
  );
}

// ─── Consent ─────────────────────────────────────────────────────────────────

interface ConsentWidgetProps { data: ConsentSummary | null; status: WidgetStatus; onRetry?: () => void; }

export function ConsentWidget({ data, status, onRetry }: ConsentWidgetProps) {
  return (
    <WidgetContainer title="Consent & Privacy" status={status} {...(onRetry !== undefined ? { onRetry } : {})}>
      {data ? (
        <>
          <div className="divide-y divide-border/60">
            <StatRow label="Active consents" value={data.activeConsents} />
            <div className="flex items-center justify-between gap-2 py-1.5">
              <span className="text-sm text-muted-foreground">Pending requests</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums text-foreground">{data.pendingRequests}</span>
                {data.pendingRequests > 0 && <Badge variant="warning" size="sm" dot>Action needed</Badge>}
              </div>
            </div>
          </div>
          <ViewAllLink href="/consent" label="Manage consent" />
        </>
      ) : (
        <WidgetEmpty icon={ShieldCheck} message="No consent activity yet." />
      )}
    </WidgetContainer>
  );
}

// ─── Labs ─────────────────────────────────────────────────────────────────────

interface LabsWidgetProps { data: LabSummary | null; status: WidgetStatus; onRetry?: () => void; }

export function LabsWidget({ data, status, onRetry }: LabsWidgetProps) {
  return (
    <WidgetContainer title="Lab Results" status={status} {...(onRetry !== undefined ? { onRetry } : {})}>
      {status === "empty" || (data && data.totalResults === 0) ? (
        <WidgetEmpty icon={FlaskConical} message="No lab results yet." actionLabel="Record lab test" actionHref="/labs/add" />
      ) : data ? (
        <>
          <div className="divide-y divide-border/60">
            <StatRow label="Total results" value={data.totalResults} />
            <StatRow label="Recent (30d)" value={data.recentCount} />
            <StatRow label="Flagged values" value={data.flaggedResults} {...(data.flaggedResults > 0 ? { highlight: "warning" as const } : {})} />
          </div>
          <ViewAllLink href="/labs" label="View lab results" />
        </>
      ) : null}
    </WidgetContainer>
  );
}

// ─── Medications ──────────────────────────────────────────────────────────────

interface MedicationsWidgetProps { data: MedicationSummary | null; status: WidgetStatus; onRetry?: () => void; }

export function MedicationsWidget({ data, status, onRetry }: MedicationsWidgetProps) {
  return (
    <WidgetContainer title="Medications" status={status} {...(onRetry !== undefined ? { onRetry } : {})}>
      {status === "empty" || (data && data.activeMedications === 0) ? (
        <WidgetEmpty icon={Pill} message="No active medications tracked." actionLabel="Add medication" actionHref="/medications/add" />
      ) : data ? (
        <>
          <div className="divide-y divide-border/60">
            <StatRow label="Active medications" value={data.activeMedications} />
            <StatRow
              label="Adherence rate"
              value={data.adherenceRate !== null ? `${data.adherenceRate}%` : "—"}
              {...(data.adherenceRate !== null ? { highlight: (data.adherenceRate >= 80 ? "success" : "warning") as "success" | "warning" } : {})}
            />
            <StatRow label="Pending refills" value={data.pendingRefills} {...(data.pendingRefills > 0 ? { highlight: "warning" as const } : {})} />
          </div>
          <ViewAllLink href="/medications" label="View medications" />
        </>
      ) : null}
    </WidgetContainer>
  );
}
