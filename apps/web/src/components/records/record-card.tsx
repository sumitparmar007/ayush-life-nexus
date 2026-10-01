"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  FlaskConical,
  ClipboardList,
  ScanLine,
  Syringe,
  Stethoscope,
  Shield,
  File,
  Clock,
  Building2,
  MoreVertical,
  Trash2,
  Eye,
} from "lucide-react";
import { cn } from "@nexus/utils";
import { Badge } from "@nexus/ui";
import {
  RecordCategory,
  RECORD_CATEGORY_LABELS,
  type RecordVerificationStatus,
  type HealthRecordListItem,
} from "@/types/health-records.ts";
import { format } from "date-fns";

// ─── Category icon map ────────────────────────────────────────────────────────

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

// ─── Verification badge ──────────────────────────────────────────────────────

function VerificationBadge({ status }: { status: RecordVerificationStatus }) {
  const config = {
    PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
    VERIFIED: { label: "Verified", className: "bg-sage-100 text-sage-800 dark:bg-sage-950 dark:text-sage-300" },
    REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
  }[status];

  return (
    <Badge className={cn("text-2xs font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}

// ─── File size formatter ──────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Record Card ──────────────────────────────────────────────────────────────

interface RecordCardProps {
  record: HealthRecordListItem;
  onDelete?: (id: string) => void;
}

export function RecordCard({ record, onDelete }: RecordCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const Icon = CATEGORY_ICON[record.category] ?? File;
  const accent = CATEGORY_ACCENT[record.category] ?? CATEGORY_ACCENT.OTHER;

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
      {/* Category icon */}
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          accent.bg
        )}
        aria-hidden="true"
      >
        <Icon className={cn("size-5", accent.icon)} />
      </span>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/records/${record.id}`}
            className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors no-underline"
          >
            {record.title}
          </Link>
          <VerificationBadge status={record.verificationStatus} />
        </div>

        <p className="text-xs text-muted-foreground truncate">
          {RECORD_CATEGORY_LABELS[record.category]}
          {record.providerName && ` · ${record.providerName}`}
        </p>

        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-2xs text-muted-foreground">
            <Clock className="size-3" aria-hidden="true" />
            {format(record.createdAt, "d MMM yyyy")}
          </span>
          {record.providerName && (
            <span className="flex items-center gap-1 text-2xs text-muted-foreground">
              <Building2 className="size-3" aria-hidden="true" />
              {record.providerName}
            </span>
          )}
          <span className="text-2xs text-muted-foreground">
            {formatFileSize(record.fileSizeBytes)}
          </span>
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
          aria-label="Record actions"
        >
          <MoreVertical className="size-4" />
        </button>

        {menuOpen && (
          <div
            className={cn(
              "absolute right-0 top-full mt-1 z-20 min-w-[140px]",
              "rounded-xl border border-border bg-popover p-1 shadow-dropdown",
              "animate-zoom-in"
            )}
          >
            <Link
              href={`/records/${record.id}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 no-underline transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <Eye className="size-4 text-muted-foreground" />
              View details
            </Link>
            {onDelete && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(record.id);
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
