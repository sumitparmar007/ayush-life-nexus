"use client";

import * as React from "react";
import Link from "next/link";
import {
  Pill,
  Clock,
  Calendar,
  MoreVertical,
  Trash2,
  Eye,
  Edit3,
  FileText,
  RotateCcw,
} from "lucide-react";
import { cn } from "@nexus/utils";
import { Badge } from "@nexus/ui";
import {
  MedicationStatus,
  MEDICATION_FREQUENCY_LABELS,
  MEDICATION_ROUTE_LABELS,
  type MedicationListItem,
} from "@/types/medications.ts";
import { format } from "date-fns";

// ─── Status configuration ─────────────────────────────────────────────────────

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

interface MedicationCardProps {
  medication: MedicationListItem;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, newStatus: MedicationStatus) => void;
}

export function MedicationCard({
  medication,
  onDelete,
  onStatusChange,
}: MedicationCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const statusConfig = STATUS_CONFIG[medication.status] ?? STATUS_CONFIG.ACTIVE;

  // Close menu on click outside
  React.useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div
      className={cn(
        "group relative flex items-start gap-4 rounded-2xl border border-border bg-card p-4",
        "shadow-xs transition-all duration-150 ease-out",
        "hover:border-border/80 hover:shadow-card"
      )}
    >
      {/* Medication pill icon */}
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          statusConfig.bg
        )}
        aria-hidden="true"
      >
        <Pill className={cn("size-5", statusConfig.icon)} />
      </span>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={`/medications/${medication.id}`}
              className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors no-underline"
            >
              {medication.name}
            </Link>
            <span className="text-xs text-muted-foreground shrink-0 font-medium">
              {medication.dosage} {medication.dosageUnit}
            </span>
          </div>
          <Badge className={cn("text-2xs font-medium shrink-0", statusConfig.className)}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Frequency & Route */}
        <p className="text-xs text-muted-foreground truncate">
          {MEDICATION_FREQUENCY_LABELS[medication.frequency]}
          {" · "}
          {MEDICATION_ROUTE_LABELS[medication.route]}
          {medication.prescribedBy && ` · Prescribed by ${medication.prescribedBy}`}
        </p>

        {/* Metadata pills / dates */}
        <div className="flex flex-wrap items-center gap-3 mt-1">
          {medication.startDate && (
            <span className="flex items-center gap-1 text-2xs text-muted-foreground">
              <Calendar className="size-3" aria-hidden="true" />
              Started {format(medication.startDate, "d MMM yyyy")}
            </span>
          )}
          {medication.endDate && (
            <span className="flex items-center gap-1 text-2xs text-muted-foreground">
              <Clock className="size-3" aria-hidden="true" />
              Until {format(medication.endDate, "d MMM yyyy")}
            </span>
          )}
          {medication.refillsRemaining !== undefined && medication.refillsRemaining > 0 && (
            <span className="flex items-center gap-1 text-2xs text-indigo-600 dark:text-indigo-400 font-medium">
              <RotateCcw className="size-3" aria-hidden="true" />
              {medication.refillsRemaining} refill{medication.refillsRemaining === 1 ? "" : "s"} left
            </span>
          )}
          {medication.prescriptionRecordId && (
            <Link
              href={`/records/${medication.prescriptionRecordId}`}
              className="flex items-center gap-1 text-2xs text-primary hover:underline"
            >
              <FileText className="size-3" aria-hidden="true" />
              Prescription linked
            </Link>
          )}
        </div>
      </div>

      {/* Actions menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={cn(
            "flex size-8 items-center justify-center rounded-lg text-muted-foreground",
            "opacity-0 transition-all duration-150 group-hover:opacity-100",
            "hover:bg-neutral-100 dark:hover:bg-neutral-800",
            "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            menuOpen && "opacity-100"
          )}
          aria-label="Medication actions"
        >
          <MoreVertical className="size-4" />
        </button>

        {menuOpen && (
          <div
            className={cn(
              "absolute right-0 top-full mt-1 z-20 min-w-[150px]",
              "rounded-xl border border-border bg-popover p-1 shadow-dropdown",
              "animate-zoom-in"
            )}
          >
            <Link
              href={`/medications/${medication.id}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 no-underline transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <Eye className="size-4 text-muted-foreground" />
              View details
            </Link>
            <Link
              href={`/medications/${medication.id}/edit`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 no-underline transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <Edit3 className="size-4 text-muted-foreground" />
              Edit
            </Link>
            {onStatusChange && medication.status === "ACTIVE" && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onStatusChange(medication.id, MedicationStatus.COMPLETED);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Clock className="size-4 text-muted-foreground" />
                Mark Completed
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(medication.id);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <Trash2 className="size-4" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
