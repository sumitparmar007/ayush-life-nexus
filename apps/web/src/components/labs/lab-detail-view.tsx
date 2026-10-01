"use client";

/**
 * LabDetailView — full detail view of a single diagnostic lab test result.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FlaskConical,
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
  AlertCircle,
  Clock,
  Activity,
  Layers,
} from "lucide-react";
import { cn } from "@nexus/utils";
import { Button, Badge, Alert, AlertDescription } from "@nexus/ui";
import {
  LabResultStatus,
  LAB_CATEGORY_LABELS,
  LAB_RESULT_STATUS_LABELS,
  type LabResult,
} from "@/types/labs.ts";
import { format } from "date-fns";

const STATUS_CONFIG: Record<
  LabResultStatus,
  { label: string; badgeVariant: "success" | "warning" | "error" | "default"; bg: string; iconColor: string; icon: React.ElementType }
> = {
  NORMAL: {
    label: "Normal",
    badgeVariant: "success",
    bg: "bg-sage-100 dark:bg-sage-950",
    iconColor: "text-sage-600 dark:text-sage-400",
    icon: CheckCircle2,
  },
  ABNORMAL: {
    label: "Abnormal",
    badgeVariant: "warning",
    bg: "bg-amber-100 dark:bg-amber-950",
    iconColor: "text-amber-600 dark:text-amber-400",
    icon: AlertTriangle,
  },
  CRITICAL: {
    label: "Critical / Out of Range",
    badgeVariant: "error",
    bg: "bg-rose-100 dark:bg-rose-950",
    iconColor: "text-rose-600 dark:text-rose-400",
    icon: AlertCircle,
  },
  PENDING: {
    label: "Pending Review",
    badgeVariant: "default",
    bg: "bg-blue-100 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400",
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

interface LabDetailViewProps {
  lab: LabResult;
}

export function LabDetailView({ lab }: LabDetailViewProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const statusConfig = STATUS_CONFIG[lab.status] ?? STATUS_CONFIG.NORMAL;
  const StatusIcon = statusConfig.icon;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/labs/${lab.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Failed to delete test result");
      }
      router.push("/labs");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Back button & Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/labs">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft />}>
            Back to Lab Results
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/labs/${lab.id}/edit`}>
            <Button variant="outline" size="sm" leftIcon={<Edit3 />}>
              Edit result
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
                Are you sure you want to delete this lab result?
              </h3>
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">
                This will soft-delete the &ldquo;{lab.testName}&rdquo; record. You can re-record it anytime.
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
              <FlaskConical className={cn("size-7", statusConfig.iconColor)} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{lab.testName}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {LAB_CATEGORY_LABELS[lab.category] || lab.category}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(lab.resultDate || lab.collectedAt || lab.createdAt), "dd MMMM yyyy")}
                </span>
              </div>
            </div>
          </div>

          <Badge variant={statusConfig.badgeVariant} size="lg">
            <StatusIcon className="mr-1.5 size-4" />
            {LAB_RESULT_STATUS_LABELS[lab.status] || lab.status}
          </Badge>
        </div>

        {/* Value and Reference Range Highlight Box */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl bg-muted/40 p-4 border border-border/40">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Recorded Test Value
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tabular-nums text-foreground">
                {lab.value}
              </span>
              {lab.unit && (
                <span className="text-sm font-semibold text-muted-foreground">
                  {lab.unit}
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Reference Range / Normal Limits
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-semibold text-foreground tabular-nums">
                {lab.referenceRangeText || (
                  lab.referenceRangeMin !== undefined || lab.referenceRangeMax !== undefined
                    ? `${lab.referenceRangeMin ?? "—"} – ${lab.referenceRangeMax ?? "—"} ${lab.unit || ""}`
                    : "No specific reference range defined"
                )}
              </span>
              {lab.referenceRangeMin !== undefined && lab.referenceRangeMax !== undefined && (
                <span className="text-xs text-muted-foreground">
                  Min: {lab.referenceRangeMin} {lab.unit} | Max: {lab.referenceRangeMax} {lab.unit}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Test Details & Audit Trail */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Diagnostic Metadata Card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Diagnostic Information
          </h2>
          <div className="divide-y divide-border/60">
            <DetailRow
              icon={Tag}
              label="Category"
              value={LAB_CATEGORY_LABELS[lab.category] || lab.category}
            />
            <DetailRow
              icon={Building2}
              label="Diagnostic Center / Lab"
              value={lab.labName || "Not specified"}
            />
            <DetailRow
              icon={Calendar}
              label="Sample Collection Date"
              value={
                lab.collectedAt
                  ? format(new Date(lab.collectedAt), "dd MMMM yyyy")
                  : "Not specified"
              }
            />
            <DetailRow
              icon={Activity}
              label="Report Finalized Date"
              value={
                lab.resultDate
                  ? format(new Date(lab.resultDate), "dd MMMM yyyy")
                  : format(new Date(lab.createdAt), "dd MMMM yyyy")
              }
            />
            <DetailRow
              icon={FileText}
              label="Source Health Record"
              value={
                lab.healthRecordId ? (
                  <Link
                    href={`/records/${lab.healthRecordId}`}
                    className="flex items-center gap-1.5 text-primary hover:underline underline-offset-2 font-medium"
                  >
                    <FileText className="size-4" />
                    <span>View linked lab report document</span>
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Independent biomarker</span>
                )
              }
            />
          </div>
        </div>

        {/* Clinical Notes & Audit Details Card */}
        <div className="flex flex-col gap-6">
          {/* Notes Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex-1">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Clinical Notes & Remarks
            </h2>
            {lab.notes ? (
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                {lab.notes}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                No clinical observations or notes provided.
              </p>
            )}
          </div>

          {/* Record Metadata Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              System Audit
            </h2>
            <div className="divide-y divide-border/60">
              <DetailRow
                icon={Layers}
                label="Record ID"
                value={<span className="font-mono text-xs text-muted-foreground">{lab.id}</span>}
              />
              <DetailRow
                icon={Clock}
                label="Created At"
                value={format(new Date(lab.createdAt), "dd MMM yyyy, HH:mm")}
              />
              <DetailRow
                icon={Clock}
                label="Last Updated"
                value={format(new Date(lab.updatedAt), "dd MMM yyyy, HH:mm")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
