import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@nexus/utils";
import { Button } from "@nexus/ui";
import type { WidgetStatus } from "@/types/dashboard.ts";

interface WidgetContainerProps {
  title: string;
  description?: string;
  status: WidgetStatus;
  onRetry?: () => void;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Compact variant reduces internal padding — for widgets in a tight grid. */
  compact?: boolean;
}

export function WidgetContainer({
  title,
  description,
  status,
  onRetry,
  headerAction,
  children,
  className,
  compact = false,
}: WidgetContainerProps) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card shadow-card",
        className
      )}
      aria-label={title}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-start justify-between gap-3 border-b border-border",
          compact ? "px-4 py-3" : "px-5 py-4"
        )}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {headerAction && (
          <div className="shrink-0">{headerAction}</div>
        )}
      </div>

      {/* Body */}
      <div className={cn("flex flex-1 flex-col", compact ? "p-4" : "p-5")}>
        {status === "loading" && (
          <div aria-label="Loading" aria-busy="true">
            <SkeletonText />
          </div>
        )}

        {status === "error" && (
          <WidgetError {...(onRetry !== undefined ? { onRetry } : {})} />
        )}

        {(status === "success" || status === "empty") && children}
      </div>
    </section>
  );
}

function SkeletonText() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="h-8 w-1/3 rounded-lg bg-muted" />
      <div className="h-3 w-2/3 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
    </div>
  );
}

function WidgetError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
      <AlertCircle className="size-8 text-muted-foreground/30" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">Failed to load</p>
        <p className="text-xs text-muted-foreground">
          There was a problem fetching this data.
        </p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw />}
        >
          Retry
        </Button>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

interface WidgetEmptyProps {
  icon: React.ElementType;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

export function WidgetEmpty({ icon: Icon, message, actionLabel, actionHref }: WidgetEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
      <Icon className="size-8 text-muted-foreground/30" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className="text-xs font-medium text-primary hover:underline underline-offset-2"
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}
