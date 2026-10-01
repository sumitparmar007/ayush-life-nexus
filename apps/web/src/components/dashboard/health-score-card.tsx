import * as React from "react";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { cn } from "@nexus/utils";
import { SimpleTooltip } from "@nexus/ui";
import { WidgetContainer, WidgetEmpty } from "./widget-container.tsx";
import type { HealthScoreSummary, WidgetStatus } from "@/types/dashboard.ts";
import { Activity } from "lucide-react";

interface HealthScoreCardProps {
  data: HealthScoreSummary | null;
  status: WidgetStatus;
  onRetry?: () => void;
}

function scoreToColor(score: number): string {
  if (score >= 80) return "text-sage-600 dark:text-sage-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function scoreToRingColor(score: number): string {
  if (score >= 80) return "stroke-sage-500";
  if (score >= 60) return "stroke-amber-500";
  return "stroke-rose-500";
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function HealthScoreCard({ data, status, onRetry }: HealthScoreCardProps) {
  return (
    <WidgetContainer
      title="Health Score"
      description="Based on your health records"
      status={status}
      {...(onRetry !== undefined ? { onRetry } : {})}
      headerAction={
        <SimpleTooltip content="Your personalised health score is calculated from the completeness and quality of your health records.">
          <button
            type="button"
            aria-label="About health score"
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <Info className="size-4" />
          </button>
        </SimpleTooltip>
      }
    >
      {status === "empty" || (data && data.score === null) ? (
        <WidgetEmpty
          icon={Activity}
          message="Add health records to calculate your score."
          actionLabel="Upload records"
          actionHref="/records/upload"
        />
      ) : data ? (
        <ScoreDisplay data={data} />
      ) : null}
    </WidgetContainer>
  );
}

function ScoreDisplay({ data }: { data: HealthScoreSummary }) {
  const score = data.score ?? 0;
  const dash = (score / 100) * CIRCUMFERENCE;
  const gap = CIRCUMFERENCE - dash;

  const TrendIcon =
    data.trend === "up" ? TrendingUp :
    data.trend === "down" ? TrendingDown : Minus;

  const trendColor =
    data.trend === "up" ? "text-sage-600 dark:text-sage-400" :
    data.trend === "down" ? "text-rose-600 dark:text-rose-400" :
    "text-muted-foreground";

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Circular gauge */}
      <div className="relative flex items-center justify-center">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          className="-rotate-90"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx="60" cy="60" r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted/50"
          />
          {/* Progress */}
          <circle
            cx="60" cy="60" r={RADIUS}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            className={cn("transition-all duration-1000 ease-out", scoreToRingColor(score))}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span
            className={cn("text-4xl font-bold tabular-nums leading-none", scoreToColor(score))}
            aria-label={`Health score: ${score}`}
          >
            {score}
          </span>
          <span className="mt-0.5 text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>

      {/* Label and trend */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-semibold text-foreground">{data.label}</span>
        {data.trendDelta !== null && (
          <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
            <TrendIcon className="size-3.5" aria-hidden="true" />
            <span>
              {data.trendDelta > 0 ? "+" : ""}{data.trendDelta} pts this month
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
