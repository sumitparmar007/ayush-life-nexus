import * as React from "react";
import { cn } from "@nexus/utils";

interface PageContainerProps {
  children: React.ReactNode;
  /** Constrain content width. 'full' removes the max-width cap. */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /** Remove default horizontal/vertical padding. */
  noPadding?: boolean;
  className?: string;
}

const maxWidthMap = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
  full: "max-w-none",
} as const;

export function PageContainer({
  children,
  maxWidth = "2xl",
  noPadding = false,
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col overflow-y-auto",
        !noPadding && "px-4 py-6 sm:px-6 lg:px-8",
        className
      )}
    >
      <div className={cn("w-full mx-auto flex flex-col gap-6", maxWidthMap[maxWidth])}>
        {children}
      </div>
    </div>
  );
}
