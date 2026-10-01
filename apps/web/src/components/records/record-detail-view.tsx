"use client";

/**
 * RecordDetailView — full detail display of a single health record.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  FlaskConical,
  ClipboardList,
  ScanLine,
  Syringe,
  Stethoscope,
  Shield,
  File,
  ArrowLeft,
  Trash2,
  Download,
  Calendar,
  Building2,
  Clock,
  Tag,
  Loader2,
} from "lucide-react";
import { cn } from "@nexus/utils";
import { Button, Badge, Alert, AlertDescription } from "@nexus/ui";
import {
  RecordCategory,
  RECORD_CATEGORY_LABELS,
  RECORD_SOURCE_LABELS,
  type HealthRecord,
  type RecordVerificationStatus,
  type RecordSource,
} from "@/types/health-records.ts";
import { format } from "date-fns";

// ─── Icon & accent maps ──────────────────────────────────────────────────────

const CATEGORY_ICON: Record<RecordCategory, React.ElementType> = {
  PRESCRIPTION: FileText,
  LAB_REPORT: FlaskConical,
  DISCHARGE_SUMMARY: ClipboardList,
  IMAGING: ScanLine,
  VACCINATION: Syringe,
  CONSULTATION_NOTE: Stethoscope,
  INSURANCE_DOCUMENT: Shield,
  OTHER: File,
};

const CATEGORY_ACCENT: Record<RecordCategory, { bg: string; icon: string }> = {
  PRESCRIPTION: { bg: "bg-indigo-100 dark:bg-indigo-950", icon: "text-indigo-600 dark:text-indigo-400" },
  LAB_REPORT: { bg: "bg-amber-100 dark:bg-amber-950", icon: "text-amber-600 dark:text-amber-400" },
  DISCHARGE_SUMMARY: { bg: "bg-sage-100 dark:bg-sage-950", icon: "text-sage-600 dark:text-sage-400" },
  IMAGING: { bg: "bg-purple-100 dark:bg-purple-950", icon: "text-purple-600 dark:text-purple-400" },
  VACCINATION: { bg: "bg-teal-100 dark:bg-teal-950", icon: "text-teal-600 dark:text-teal-400" },
  CONSULTATION_NOTE: { bg: "bg-blue-100 dark:bg-blue-950", icon: "text-blue-600 dark:text-blue-400" },
  INSURANCE_DOCUMENT: { bg: "bg-neutral-100 dark:bg-neutral-800", icon: "text-neutral-600 dark:text-neutral-400" },
  OTHER: { bg: "bg-neutral-100 dark:bg-neutral-800", icon: "text-neutral-600 dark:text-neutral-400" },
};

const STATUS_CONFIG: Record<RecordVerificationStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending Verification", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  VERIFIED: { label: "Verified", className: "bg-sage-100 text-sage-800 dark:bg-sage-950 dark:text-sage-300" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
};

// ─── File size formatter ──────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Detail row ───────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

interface RecordDetailViewProps {
  record: HealthRecord;
}

export function RecordDetailView({ record }: RecordDetailViewProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const Icon = CATEGORY_ICON[record.category] ?? File;
  const accent = CATEGORY_ACCENT[record.category] ?? CATEGORY_ACCENT.OTHER;
  const statusConfig = STATUS_CONFIG[record.verificationStatus];

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/records/${record.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Failed to delete record");
      }

      router.push("/records");
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {deleteError && (
        <Alert variant="destructive">
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}

      {/* Header card */}
      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-2xl",
              accent.bg
            )}
            aria-hidden="true"
          >
            <Icon className={cn("size-7", accent.icon)} />
          </span>

          <div className="flex flex-1 flex-col gap-2 min-w-0">
            <h2 className="text-xl font-semibold text-foreground tracking-tight">
              {record.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("text-xs font-medium", statusConfig.className)}>
                {statusConfig.label}
              </Badge>
              <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 text-xs">
                {RECORD_CATEGORY_LABELS[record.category]}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download />}
              onClick={() => {
                // In this phase, no actual file exists — show info
                window.alert("File download will be available when blob storage is implemented.");
              }}
            >
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              leftIcon={isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <span className="hidden sm:inline">{isDeleting ? "Deleting…" : "Delete"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Metadata card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-foreground mb-1">Record Details</h3>
          <div className="divide-y divide-border/60">
            <DetailRow
              icon={Tag}
              label="Category"
              value={RECORD_CATEGORY_LABELS[record.category]}
            />
            <DetailRow
              icon={Calendar}
              label="Date of Issue"
              value={
                record.issuedDate
                  ? format(record.issuedDate, "d MMMM yyyy")
                  : "Not specified"
              }
            />
            <DetailRow
              icon={Building2}
              label="Provider / Facility"
              value={record.providerName || "Not specified"}
            />
            <DetailRow
              icon={Tag}
              label="Source"
              value={RECORD_SOURCE_LABELS[record.source as RecordSource] ?? record.source}
            />
          </div>
        </div>

        {/* File info card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-foreground mb-1">File Information</h3>
          <div className="divide-y divide-border/60">
            <DetailRow
              icon={File}
              label="File Name"
              value={record.fileName}
            />
            <DetailRow
              icon={File}
              label="File Type"
              value={record.fileMimeType}
            />
            <DetailRow
              icon={File}
              label="File Size"
              value={formatFileSize(record.fileSizeBytes)}
            />
            <DetailRow
              icon={Clock}
              label="Uploaded"
              value={format(record.createdAt, "d MMMM yyyy, h:mm a")}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      {record.notes && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-foreground mb-2">Notes</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {record.notes}
          </p>
        </div>
      )}

      {/* Back button */}
      <div className="flex">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft />}
          onClick={() => router.push("/records")}
        >
          Back to records
        </Button>
      </div>
    </div>
  );
}
