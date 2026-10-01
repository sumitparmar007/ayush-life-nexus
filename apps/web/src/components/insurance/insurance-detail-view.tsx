"use client";

/**
 * InsuranceDetailView — full detail view of a single insurance policy.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Building2,
  Calendar,
  ArrowLeft,
  Trash2,
  Edit3,
  FileText,
  Tag,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Phone,
  ExternalLink,
  IndianRupee,
} from "lucide-react";
import { cn } from "@nexus/utils";
import { Button, Badge, Alert, AlertDescription } from "@nexus/ui";
import {
  InsurancePolicyStatus,
  INSURANCE_POLICY_TYPE_LABELS,
  INSURANCE_POLICY_STATUS_LABELS,
  type InsurancePolicy,
} from "@/types/insurance.ts";
import { formatCoverageAmount } from "@/components/insurance/insurance-card.tsx";
import { format } from "date-fns";

const STATUS_CONFIG: Record<
  InsurancePolicyStatus,
  {
    label: string;
    badgeVariant: "success" | "warning" | "error" | "default";
    bg: string;
    iconColor: string;
    icon: React.ElementType;
  }
> = {
  ACTIVE: {
    label: "Active",
    badgeVariant: "success",
    bg: "bg-sage-100 dark:bg-sage-950",
    iconColor: "text-sage-600 dark:text-sage-400",
    icon: CheckCircle2,
  },
  EXPIRED: {
    label: "Expired",
    badgeVariant: "error",
    bg: "bg-rose-100 dark:bg-rose-950",
    iconColor: "text-rose-600 dark:text-rose-400",
    icon: XCircle,
  },
  GRACE_PERIOD: {
    label: "Grace Period",
    badgeVariant: "warning",
    bg: "bg-amber-100 dark:bg-amber-950",
    iconColor: "text-amber-600 dark:text-amber-400",
    icon: AlertTriangle,
  },
  CANCELLED: {
    label: "Cancelled",
    badgeVariant: "default",
    bg: "bg-neutral-100 dark:bg-neutral-800",
    iconColor: "text-neutral-600 dark:text-neutral-400",
    icon: Clock,
  },
};

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="size-4 mt-0.5 text-muted-foreground shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <span className="text-sm text-foreground">{value}</span>
      </div>
    </div>
  );
}

interface InsuranceDetailViewProps {
  policy: InsurancePolicy;
}

export function InsuranceDetailView({ policy }: InsuranceDetailViewProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const statusConfig = STATUS_CONFIG[policy.status] ?? STATUS_CONFIG.ACTIVE;
  const StatusIcon = statusConfig.icon;

  // Calculate renewal days countdown
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const expiryUtc = Date.UTC(
    new Date(policy.expiryDate).getUTCFullYear(),
    new Date(policy.expiryDate).getUTCMonth(),
    new Date(policy.expiryDate).getUTCDate()
  );
  const diffDays = Math.round((expiryUtc - todayUtc) / (24 * 60 * 60 * 1000));

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/insurance/${policy.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Failed to delete policy");
      }
      router.push("/insurance");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/insurance">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft />}>
            Back to Policies
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/insurance/${policy.id}/edit`}>
            <Button variant="outline" size="sm" leftIcon={<Edit3 />}>
              Edit policy
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            leftIcon={<Trash2 />}
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Delete Confirmation Modal / Banner */}
      {showDeleteConfirm && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/50">
          <div className="flex items-start gap-3">
            <Trash2 className="size-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                Are you sure you want to delete this insurance policy?
              </h3>
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">
                This will soft-delete policy &ldquo;{policy.policyName}&rdquo; ({policy.policyNumber}).
                You can re-link it anytime.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  leftIcon={isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                >
                  {isDeleting ? "Deleting..." : "Confirm delete"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-2xl",
                statusConfig.bg
              )}
              aria-hidden="true"
            >
              <Shield className={cn("size-7", statusConfig.iconColor)} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{policy.policyName}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {policy.providerName}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {policy.policyNumber}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium">
                  {INSURANCE_POLICY_TYPE_LABELS[policy.policyType] || policy.policyType}
                </span>
              </div>
            </div>
          </div>

          <Badge variant={statusConfig.badgeVariant} size="lg">
            <StatusIcon className="mr-1.5 size-4" />
            {INSURANCE_POLICY_STATUS_LABELS[policy.status] || policy.status}
          </Badge>
        </div>

        {/* Coverage and Renewal Highlights */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-xl bg-muted/40 p-4 border border-border/40">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Sum Insured (Coverage)
            </span>
            <span className="text-2xl font-extrabold tabular-nums text-foreground">
              {formatCoverageAmount(policy.sumInsured)}
            </span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              ₹{policy.sumInsured.toLocaleString("en-IN")}
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Annual Premium
            </span>
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {policy.premiumAmount !== undefined && policy.premiumAmount !== null
                ? `₹${policy.premiumAmount.toLocaleString("en-IN")}`
                : "—"}
            </span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              Per annum
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Renewal Date
            </span>
            <span className="text-lg font-bold tabular-nums text-foreground">
              {format(new Date(policy.expiryDate), "dd MMM yyyy")}
            </span>
            {policy.status === "ACTIVE" && (
              <span
                className={cn(
                  "block text-xs font-medium mt-0.5",
                  diffDays <= 30
                    ? "text-amber-600 dark:text-amber-400 font-semibold"
                    : "text-muted-foreground"
                )}
              >
                {diffDays === 0
                  ? "Renews today"
                  : diffDays === 1
                  ? "Renews tomorrow"
                  : diffDays > 1
                  ? `Renews in ${diffDays} days`
                  : `Expired ${Math.abs(diffDays)}d ago`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Policy Parameters & TPA / Documents */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Policy Details Card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Policy Terms & Validity
          </h2>
          <div className="divide-y divide-border/60">
            <DetailRow
              icon={Tag}
              label="Policy Type"
              value={INSURANCE_POLICY_TYPE_LABELS[policy.policyType] || policy.policyType}
            />
            <DetailRow
              icon={Building2}
              label="Insurance Company"
              value={policy.providerName}
            />
            <DetailRow
              icon={Calendar}
              label="Start Date"
              value={
                policy.startDate
                  ? format(new Date(policy.startDate), "dd MMMM yyyy")
                  : "Not specified"
              }
            />
            <DetailRow
              icon={Calendar}
              label="Renewal / Expiry Date"
              value={format(new Date(policy.expiryDate), "dd MMMM yyyy")}
            />
            <DetailRow
              icon={IndianRupee}
              label="Premium Amount"
              value={
                policy.premiumAmount !== undefined && policy.premiumAmount !== null
                  ? `₹${policy.premiumAmount.toLocaleString("en-IN")}`
                  : "Not recorded"
              }
            />
          </div>
        </div>

        {/* Claims & Document Link Card */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Cashless Claims & TPA
            </h2>
            <div className="divide-y divide-border/60">
              <DetailRow
                icon={Building2}
                label="Third Party Administrator (TPA)"
                value={policy.tpaName || "Direct Insurer Settlement"}
              />
              <DetailRow
                icon={Phone}
                label="TPA Contact / Helpline"
                value={
                  policy.tpaContact ? (
                    <a
                      href={`tel:${policy.tpaContact}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {policy.tpaContact}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not specified</span>
                  )
                }
              />
              <DetailRow
                icon={ExternalLink}
                label="Network Hospitals Locator"
                value={
                  policy.networkHospitalUrl ? (
                    <a
                      href={policy.networkHospitalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline font-medium"
                    >
                      <span>Find Cashless Hospitals</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )
                }
              />
              <DetailRow
                icon={FileText}
                label="Source Policy Document"
                value={
                  policy.policyDocumentRecordId ? (
                    <Link
                      href={`/records/${policy.policyDocumentRecordId}`}
                      className="flex items-center gap-1.5 text-primary hover:underline font-medium"
                    >
                      <FileText className="size-4" />
                      <span>View document in Health Records</span>
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">No linked document</span>
                  )
                }
              />
            </div>
          </div>

          {/* Policy Notes Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex-1">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Policy Notes & Key Clauses
            </h2>
            {policy.notes ? (
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                {policy.notes}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                No policy notes or specific clauses recorded.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* System Audit Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          System Record Audit
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          <div>
            <span className="text-muted-foreground block mb-0.5">Policy Record ID</span>
            <span className="font-mono text-muted-foreground">{policy.id}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-0.5">Recorded On</span>
            <span className="text-foreground">
              {format(new Date(policy.createdAt), "dd MMM yyyy, HH:mm")}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-0.5">Last Updated</span>
            <span className="text-foreground">
              {format(new Date(policy.updatedAt), "dd MMM yyyy, HH:mm")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
