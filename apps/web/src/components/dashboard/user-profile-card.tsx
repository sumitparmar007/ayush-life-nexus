import * as React from "react";
import Link from "next/link";
import { Shield, LinkIcon } from "lucide-react";
import { cn } from "@nexus/utils";
import { Badge, Progress } from "@nexus/ui";

interface UserProfileSummaryCardProps {
  profile: {
    nexusId: string;
    preferredName?: string;
    completionScore: number;
    abhaLinked: boolean;
    memberSince: Date;
    lastLoginAt: Date | null;
  };
  trustLevel: number;
  className?: string;
}

const trustLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Phone verified", color: "text-amber-600 dark:text-amber-400" },
  2: { label: "Email verified", color: "text-amber-600 dark:text-amber-400" },
  3: { label: "ABHA verified", color: "text-sage-600 dark:text-sage-400" },
  4: { label: "Aadhaar verified", color: "text-sage-600 dark:text-sage-400" },
  5: { label: "Staff elevated", color: "text-indigo-600 dark:text-indigo-400" },
};

export function UserProfileSummaryCard({ profile, trustLevel, className }: UserProfileSummaryCardProps) {
  const trust = trustLabels[trustLevel] ?? trustLabels[1]!;
  const initials = profile.preferredName?.slice(0, 2).toUpperCase() ?? "AN";
  const nextStep = profile.completionScore < 30
    ? "Link ABHA ID"
    : profile.completionScore < 60
    ? "Upload first record"
    : profile.completionScore < 100
    ? "Add insurance policy"
    : null;

  return (
    <div className={cn("flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card", className)} aria-label="Your profile">
      <div className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white">
          {initials}
        </div>
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <p className="text-base font-semibold text-foreground truncate">
            {profile.preferredName ?? "Complete your profile"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("flex items-center gap-1 text-xs font-medium", trust.color)}>
              <Shield className="size-3.5" aria-hidden="true" />
              {trust.label}
            </span>
            {profile.abhaLinked ? (
              <Badge variant="success" size="sm" dot>ABHA linked</Badge>
            ) : (
              <Link href="/settings?tab=profile" className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline underline-offset-2">
                <LinkIcon className="size-3" aria-hidden="true" />
                Link ABHA
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Profile completion</span>
          <span className="tabular-nums font-semibold text-muted-foreground">{profile.completionScore}%</span>
        </div>
        <Progress value={profile.completionScore} size="sm" variant={profile.completionScore === 100 ? "success" : "default"} />
        {nextStep && (
          <p className="text-xs text-muted-foreground">
            Next: <Link href="/settings/profile" className="font-medium text-primary hover:underline underline-offset-2">{nextStep}</Link>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Member since</span>
          <span className="text-sm font-semibold text-foreground">
            {profile.memberSince.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">ABHA status</span>
          <span className={cn("text-sm font-semibold", profile.abhaLinked ? "text-sage-600 dark:text-sage-400" : "text-muted-foreground")}>
            {profile.abhaLinked ? "Linked" : "Not linked"}
          </span>
        </div>
      </div>
    </div>
  );
}
