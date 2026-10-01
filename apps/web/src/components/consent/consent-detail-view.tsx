"use client";

/**
 * ConsentDetailView — full detail view of a single consent record.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  Calendar,
  ArrowLeft,
  Trash2,
  Edit3,
  Lock,
  Tag,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Ban,
  Check,
  FileCheck,
} from "lucide-react";
import { cn } from "@nexus/utils";
import { Button, Badge, Alert, AlertDescription } from "@nexus/ui";
import {
  ConsentStatus,
  CONSENT_STATUS_LABELS,
  CONSENT_RECIPIENT_TYPE_LABELS,
  CONSENT_PURPOSE_LABELS,
  CONSENT_DATA_SCOPE_LABELS,
  CONSENT_PERMISSION_LABELS,
  type ConsentRecord,
} from "@/types/consent.ts";
import { format } from "date-fns";

const STATUS_CONFIG: Record<
  ConsentStatus,
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
  PENDING_APPROVAL: {
    label: "Pending Request",
    badgeVariant: "warning",
    bg: "bg-amber-100 dark:bg-amber-950",
    iconColor: "text-amber-600 dark:text-amber-400",
    icon: AlertTriangle,
  },
  REVOKED: {
    label: "Revoked",
    badgeVariant: "error",
    bg: "bg-rose-100 dark:bg-rose-950",
    iconColor: "text-rose-600 dark:text-rose-400",
    icon: XCircle,
  },
  EXPIRED: {
    label: "Expired",
    badgeVariant: "default",
    bg: "bg-neutral-100 dark:bg-neutral-800",
    iconColor: "text-neutral-600 dark:text-neutral-400",
    icon: Clock,
  },
  REJECTED: {
    label: "Declined",
    badgeVariant: "error",
    bg: "bg-rose-100 dark:bg-rose-950",
    iconColor: "text-rose-600 dark:text-rose-400",
    icon: XCircle,
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

interface ConsentDetailViewProps {
  consent: ConsentRecord;
}

export function ConsentDetailView({ consent }: ConsentDetailViewProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const statusConfig = STATUS_CONFIG[consent.status] ?? STATUS_CONFIG.ACTIVE;
  const StatusIcon = statusConfig.icon;

  // Expiration countdown
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const expiryUtc = Date.UTC(
    new Date(consent.expiresAt).getUTCFullYear(),
    new Date(consent.expiresAt).getUTCMonth(),
    new Date(consent.expiresAt).getUTCDate()
  );
  const diffDays = Math.round((expiryUtc - todayUtc) / (24 * 60 * 60 * 1000));

  const handleApprove = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch(`/api/consent/${consent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Failed to approve consent");
      }
      router.refresh();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch(`/api/consent/${consent.id}/reject`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Failed to decline consent");
      }
      router.refresh();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline");
      setIsProcessing(false);
    }
  };

  const handleRevoke = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch(`/api/consent/${consent.id}/revoke`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Failed to revoke consent");
      }
      setShowRevokeConfirm(false);
      router.refresh();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke");
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch(`/api/consent/${consent.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Failed to delete consent record");
      }
      router.push("/consent");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/consent">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft />}>
            Back to Consents
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {consent.status === "PENDING_APPROVAL" && (
            <>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Check />}
                disabled={isProcessing}
                onClick={handleApprove}
              >
                Approve Access
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950"
                disabled={isProcessing}
                onClick={handleReject}
              >
                Decline Request
              </Button>
            </>
          )}

          {consent.status === "ACTIVE" && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Ban />}
              disabled={isProcessing}
              className="text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950"
              onClick={() => setShowRevokeConfirm(true)}
            >
              Revoke Access
            </Button>
          )}

          <Link href={`/consent/${consent.id}/edit`}>
            <Button variant="outline" size="sm" leftIcon={<Edit3 />}>
              Edit
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

      {/* Revoke Confirmation Banner */}
      {showRevokeConfirm && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/50">
          <div className="flex items-start gap-3">
            <Ban className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Revoke consent for &ldquo;{consent.recipientName}&rdquo;?
              </h3>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                This entity will immediately lose all access to view or download your health data.
                This action is permanent for this consent grant.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isProcessing}
                  onClick={handleRevoke}
                  leftIcon={isProcessing ? <Loader2 className="animate-spin" /> : <Ban />}
                >
                  {isProcessing ? "Revoking..." : "Confirm Revocation"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => setShowRevokeConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Banner */}
      {showDeleteConfirm && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/50">
          <div className="flex items-start gap-3">
            <Trash2 className="size-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                Delete this consent record from history?
              </h3>
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">
                This will remove the record from your consent list.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isProcessing}
                  onClick={handleDelete}
                  leftIcon={isProcessing ? <Loader2 className="animate-spin" /> : <Trash2 />}
                >
                  {isProcessing ? "Deleting..." : "Confirm delete"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
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
              <ShieldCheck className={cn("size-7", statusConfig.iconColor)} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {consent.recipientName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {CONSENT_RECIPIENT_TYPE_LABELS[consent.recipientType] ||
                    consent.recipientType}
                </span>
                {consent.organizationName && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-xs text-muted-foreground">
                      {consent.organizationName}
                    </span>
                  </>
                )}
                <span className="text-muted-foreground/40">•</span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium">
                  {CONSENT_PURPOSE_LABELS[consent.purpose] || consent.purpose}
                </span>
              </div>
            </div>
          </div>

          <Badge variant={statusConfig.badgeVariant} size="lg">
            <StatusIcon className="mr-1.5 size-4" />
            {CONSENT_STATUS_LABELS[consent.status] || consent.status}
          </Badge>
        </div>

        {/* Validity Summary Banner */}
        <div className="mt-6 rounded-xl bg-muted/40 p-4 border border-border/40 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Consent Status & Validity
            </span>
            <span className="text-base font-bold text-foreground">
              {consent.status === "ACTIVE"
                ? diffDays <= 0
                  ? "Active • Expires today"
                  : diffDays === 1
                  ? "Active • Expires tomorrow"
                  : `Active • Valid for ${diffDays} days`
                : consent.status === "PENDING_APPROVAL"
                ? "Pending approval by you"
                : consent.status === "REVOKED"
                ? `Access revoked on ${
                    consent.revokedAt
                      ? format(new Date(consent.revokedAt), "dd MMM yyyy, HH:mm")
                      : "recently"
                  }`
                : `Expired on ${format(new Date(consent.expiresAt), "dd MMM yyyy")}`}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs text-muted-foreground block mb-0.5">
              Expiration Date
            </span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {format(new Date(consent.expiresAt), "dd MMMM yyyy")}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Permitted Data Scopes & Terms */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Permitted Data Scopes Card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileCheck className="size-4 text-primary" />
            Permitted Data Scopes
          </h2>
          <div className="flex flex-col gap-2">
            {consent.dataScopes.map((scope) => (
              <div
                key={scope}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50 border border-border/40 text-xs font-medium text-foreground"
              >
                <CheckCircle2 className="size-4 text-sage-600 dark:text-sage-400 shrink-0" />
                <span>{CONSENT_DATA_SCOPE_LABELS[scope] || scope}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-border/60">
            <DetailRow
              icon={Lock}
              label="Access Permission Level"
              value={CONSENT_PERMISSION_LABELS[consent.permission] || consent.permission}
            />
          </div>
        </div>

        {/* Purpose & Terms Card */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Consent Scope & Terms
            </h2>
            <div className="divide-y divide-border/60">
              <DetailRow
                icon={Tag}
                label="Declared Healthcare Purpose"
                value={CONSENT_PURPOSE_LABELS[consent.purpose] || consent.purpose}
              />
              <DetailRow
                icon={Building2}
                label="Healthcare Facility / Organization"
                value={consent.organizationName || "Not specified"}
              />
              <DetailRow
                icon={Calendar}
                label="Granted On"
                value={
                  consent.grantedAt
                    ? format(new Date(consent.grantedAt), "dd MMMM yyyy, HH:mm")
                    : "Pending approval"
                }
              />
            </div>
          </div>

          {/* Notes Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex-1">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Consent Notes & Restrictions
            </h2>
            {consent.notes ? (
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                {consent.notes}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                No specific notes or restrictions recorded.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lifecycle Timestamps Audit */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Consent Lifecycle Timestamps
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 text-xs">
          <div>
            <span className="text-muted-foreground block mb-0.5">Consent ID</span>
            <span className="font-mono text-muted-foreground">{consent.id}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-0.5">Created At</span>
            <span className="text-foreground">
              {format(new Date(consent.createdAt), "dd MMM yyyy, HH:mm")}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-0.5">Granted At</span>
            <span className="text-foreground">
              {consent.grantedAt
                ? format(new Date(consent.grantedAt), "dd MMM yyyy, HH:mm")
                : "—"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-0.5">Revoked At</span>
            <span className="text-foreground">
              {consent.revokedAt
                ? format(new Date(consent.revokedAt), "dd MMM yyyy, HH:mm")
                : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
