"use client";

import * as React from "react";
import Link from "next/link";
import {
  FlaskConical,
  Calendar,
  Building2,
  FileText,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { cn } from "@nexus/utils";
import { Badge } from "@nexus/ui";
import {
  LabResultStatus,
  LAB_CATEGORY_LABELS,
  LAB_RESULT_STATUS_LABELS,
  type LabListItem,
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
    label: "Critical",
    badgeVariant: "error",
    bg: "bg-rose-100 dark:bg-rose-950",
    iconColor: "text-rose-600 dark:text-rose-400",
    icon: AlertCircle,
  },
  PENDING: {
    label: "Pending",
    badgeVariant: "default",
    bg: "bg-blue-100 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400",
    icon: Clock,
  },
};

interface LabCardProps {
  lab: LabListItem;
  onDelete?: (id: string) => void;
}

export function LabCard({ lab, onDelete }: LabCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const statusConfig = STATUS_CONFIG[lab.status] ?? STATUS_CONFIG.NORMAL;
  const StatusIcon = statusConfig.icon;

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

  const displayDate = lab.resultDate || lab.collectedAt || lab.createdAt;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-4",
        "shadow-xs transition-all duration-150 ease-out",
        "hover:border-border/80 hover:shadow-card"
      )}
    >
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                statusConfig.bg
              )}
              aria-hidden="true"
            >
              <FlaskConical className={cn("size-5", statusConfig.iconColor)} />
            </span>
            <div>
              <Link
                href={`/labs/${lab.id}`}
                className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
              >
                {lab.testName}
              </Link>
              <p className="text-xs text-muted-foreground">
                {LAB_CATEGORY_LABELS[lab.category] || lab.category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge variant={statusConfig.badgeVariant} size="sm">
              <StatusIcon className="mr-1 size-3" />
              {LAB_RESULT_STATUS_LABELS[lab.status] || lab.status}
            </Badge>

            {/* Context Menu */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Test actions"
                aria-expanded={menuOpen}
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg text-muted-foreground",
                  "hover:bg-muted hover:text-foreground transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <MoreVertical className="size-4" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className={cn(
                    "absolute right-0 top-8 z-30 w-44 rounded-xl border border-border bg-card p-1 shadow-modal",
                    "animate-scale-in"
                  )}
                >
                  <Link
                    href={`/labs/${lab.id}`}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    <Eye className="size-3.5 text-muted-foreground" />
                    View details
                  </Link>
                  <Link
                    href={`/labs/${lab.id}/edit`}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    <Edit3 className="size-3.5 text-muted-foreground" />
                    Edit result
                  </Link>
                  {onDelete && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(lab.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                      Delete test
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Value and Reference Range Highlight */}
        <div className="mt-4 rounded-xl bg-muted/50 p-3 flex items-baseline justify-between gap-2">
          <div>
            <span className="text-xs text-muted-foreground block mb-0.5">Value</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold tabular-nums text-foreground">
                {lab.value}
              </span>
              {lab.unit && (
                <span className="text-xs font-medium text-muted-foreground">
                  {lab.unit}
                </span>
              )}
            </div>
          </div>

          {lab.referenceRangeText && (
            <div className="text-right">
              <span className="text-xs text-muted-foreground block mb-0.5">Reference Range</span>
              <span className="text-xs font-medium text-foreground tabular-nums">
                {lab.referenceRangeText}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Metadata footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Calendar className="size-3.5 shrink-0 text-muted-foreground/70" />
            {format(displayDate, "dd MMM yyyy")}
          </span>
          {lab.labName && (
            <span className="flex items-center gap-1 line-clamp-1 max-w-[140px]">
              <Building2 className="size-3.5 shrink-0 text-muted-foreground/70" />
              {lab.labName}
            </span>
          )}
        </div>

        {lab.healthRecordId && (
          <Link
            href={`/records/${lab.healthRecordId}`}
            className="flex items-center gap-1 text-primary hover:underline underline-offset-2"
          >
            <FileText className="size-3.5" />
            <span>Report linked</span>
          </Link>
        )}
      </div>
    </div>
  );
}
