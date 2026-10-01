import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@nexus/utils";
import { Progress } from "@nexus/ui";
import type { PatientProfileSummary } from "@/types/dashboard.ts";

interface WelcomeHeaderProps {
  profile: PatientProfileSummary;
  className?: string;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function WelcomeHeader({ profile, className }: WelcomeHeaderProps) {
  const name = profile.preferredName ?? "there";
  const incomplete = profile.completionScore < 100;

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          {getGreeting()}
        </p>
        <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
          {getGreeting()}, {name} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here's an overview of your health intelligence.
        </p>
      </div>

      {incomplete && (
        <Link
          href="/settings?tab=profile"
          className={cn(
            "flex shrink-0 flex-col gap-2.5 rounded-2xl border border-border bg-card p-4",
            "transition-shadow hover:shadow-card-hover hover:border-indigo-200 dark:hover:border-indigo-800",
            "min-w-[200px]"
          )}
          aria-label={`Complete your profile — ${profile.completionScore}% done`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-saffron-500" aria-hidden="true" />
              <span className="text-xs font-semibold text-foreground">Complete profile</span>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <Progress value={profile.completionScore} size="sm" variant="default" />
          <p className="text-xs text-muted-foreground tabular-nums">
            {profile.completionScore}% complete
          </p>
        </Link>
      )}
    </div>
  );
}
