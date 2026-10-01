import * as React from "react";
import { cn } from "@nexus/utils";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "relative z-10 w-full max-w-md",
        "rounded-2xl border border-border bg-card p-8 shadow-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AuthLogo() {
  return (
    <div className="mb-6 flex flex-col items-center gap-2">
      {/* Wordmark */}
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-600">
          <span className="text-sm font-bold text-white">AN</span>
        </div>
        <span className="text-xl font-semibold tracking-tight text-foreground">
          Ayush Nexus
        </span>
      </div>
    </div>
  );
}

interface AuthHeadingProps {
  title: string;
  description?: string;
}

export function AuthHeading({ title, description }: AuthHeadingProps) {
  return (
    <div className="mb-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
