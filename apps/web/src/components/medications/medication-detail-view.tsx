"use client";

/**
 * MedicationDetailView — full detail view of a single medication.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pill,
  Clock,
  Building2,
  Calendar,
  ArrowLeft,
  Trash2,
  Edit3,
  FileText,
  RotateCcw,
  Tag,
  Loader2,
} from "lucide-react";
import { cn } from "@nexus/utils";
import { Button, Badge, Alert, AlertDescription } from "@nexus/ui";
import {
  MedicationStatus,
  MEDICATION_FREQUENCY_LABELS,
  MEDICATION_ROUTE_LABELS,
  type Medication,
} from "@/types/medications.ts";
import { format } from "date-fns";

const STATUS_CONFIG: Record<
  MedicationStatus,
  { label: string; className: string; bg: string; icon: string }
> = {
  ACTIVE: {
    label: "Active",
    className: "bg-sage-100 text-sage-800 dark:bg-sage-950 dark:text-sage-300",
    bg: "bg-sage-100 dark:bg-sage-950",
    icon: "text-sage-600 dark:text-sage-400",
  },
  PAUSED: {
    label: "Paused",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    bg: "bg-amber-100 dark:bg-amber-950",
    icon: "text-amber-600 dark:text-amber-400",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    bg: "bg-blue-100 dark:bg-blue-950",
    icon: "text-blue-600 dark:text-blue-400",
  },
  DISCONTINUED: {
    label: "Discontinued",
    className: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300",
    bg: "bg-neutral-100 dark:bg-neutral-800",
    icon: "text-neutral-600 dark:text-neutral-400",
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

interface MedicationDetailViewProps {
  medication: Medication;
}

export function MedicationDetailView({ medication }: MedicationDetailViewProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const statusConfig = STATUS_CONFIG[medication.status] ?? STATUS_CONFIG.ACTIVE;

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this medication?")) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/medications/${medication.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Failed to delete medication");
      }

      router.push("/medications");
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

      {/* Header Card */}
      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-2xl",
              statusConfig.bg
            )}
            aria-hidden="true"
          >
            <Pill className={cn("size-7", statusConfig.icon)} />
          </span>

          <div className="flex flex-1 flex-col gap-2 min-w-0">
            <h2 className="text-xl font-semibold text-foreground tracking-tight">
              {medication.name}{" "}
              <span className="text-muted-foreground font-normal">
                ({medication.dosage} {medication.dosageUnit})
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("text-xs font-medium", statusConfig.className)}>
                {statusConfig.label}
              </Badge>
              <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 text-xs">
                {MEDICATION_FREQUENCY_LABELS[medication.frequency]}
              </Badge>
              <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 text-xs">
                {MEDICATION_ROUTE_LABELS[medication.route]}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/medications/${medication.id}/edit`}>
              <Button variant="outline" size="sm" leftIcon={<Edit3 />}>
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </Link>
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

      {/* Details Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Regimen Info */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-foreground mb-1">Dosing & Administration</h3>
          <div className="divide-y divide-border/60">
            <DetailRow
              icon={Tag}
              label="Dosage Strength"
              value={`${medication.dosage} ${medication.dosageUnit}`}
            />
            <DetailRow
              icon={Clock}
              label="Frequency / Schedule"
              value={MEDICATION_FREQUENCY_LABELS[medication.frequency]}
            />
            <DetailRow
              icon={Pill}
              label="Route of Administration"
              value={MEDICATION_ROUTE_LABELS[medication.route]}
            />
            <DetailRow
              icon={RotateCcw}
              label="Refills Remaining"
              value={
                medication.refillsRemaining !== undefined
                  ? `${medication.refillsRemaining} refills`
                  : "0 / Not specified"
              }
            />
          </div>
        </div>

        {/* Clinical Context & Dates */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-foreground mb-1">Prescription & Dates</h3>
          <div className="divide-y divide-border/60">
            <DetailRow
              icon={Building2}
              label="Prescribed By"
              value={
                medication.prescribedByNexusId ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-foreground">
                      {medication.prescribedBy || medication.prescriberProfile?.displayName || "Doctor"}
                    </span>
                    {medication.prescriberProfile?.specialization && (
                      <span className="text-xs text-muted-foreground">
                        Specialization: {medication.prescriberProfile.specialization}
                      </span>
                    )}
                    {medication.prescriberProfile?.clinicName && (
                      <span className="text-xs text-muted-foreground">
                        Clinic: {medication.prescriberProfile.clinicName}
                      </span>
                    )}
                  </div>
                ) : (
                  medication.prescribedBy || "Self-recorded / Not specified"
                )
              }
            />
            <DetailRow
              icon={Calendar}
              label="Start Date"
              value={
                medication.startDate
                  ? format(new Date(medication.startDate), "d MMMM yyyy")
                  : "Not specified"
              }
            />
            <DetailRow
              icon={Calendar}
              label="End Date"
              value={
                medication.endDate
                  ? format(new Date(medication.endDate), "d MMMM yyyy")
                  : "Ongoing regimen"
              }
            />
            <DetailRow
              icon={Clock}
              label="Added On"
              value={format(new Date(medication.createdAt), "d MMMM yyyy")}
            />
          </div>
        </div>
      </div>

      {/* Linked Prescription Document */}
      {medication.prescriptionRecordId && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950">
              <FileText className="size-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                Linked Prescription Document
              </span>
              <span className="text-xs text-muted-foreground">
                Reference ID: {medication.prescriptionRecordId}
              </span>
            </div>
          </div>
          <Link href={`/records/${medication.prescriptionRecordId}`}>
            <Button variant="outline" size="sm">
              View Document
            </Button>
          </Link>
        </div>
      )}

      {/* Special Instructions */}
      {medication.instructions && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-foreground mb-2">Instructions</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {medication.instructions}
          </p>
        </div>
      )}

      {/* Back Button */}
      <div className="flex">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft />}
          onClick={() => router.push("/medications")}
        >
          Back to medications
        </Button>
      </div>
    </div>
  );
}
