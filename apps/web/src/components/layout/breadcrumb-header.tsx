"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@nexus/utils";

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface BreadcrumbHeaderProps {
  segments: BreadcrumbSegment[];
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function BreadcrumbHeader({
  segments,
  title,
  description,
  actions,
  className,
}: BreadcrumbHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {/* Breadcrumb trail */}
      {segments.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-xs text-muted-foreground">
            {segments.map((seg, i) => {
              const isLast = i === segments.length - 1;
              return (
                <React.Fragment key={i}>
                  <li>
                    {seg.href && !isLast ? (
                      <Link
                        href={seg.href}
                        className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
                      >
                        {seg.label}
                      </Link>
                    ) : (
                      <span
                        aria-current={isLast ? "page" : undefined}
                        className={isLast ? "font-medium text-foreground" : ""}
                      >
                        {seg.label}
                      </span>
                    )}
                  </li>
                  {!isLast && (
                    <li aria-hidden="true">
                      <ChevronRight className="size-3 text-muted-foreground/40" />
                    </li>
                  )}
                </React.Fragment>
              );
            })}
          </ol>
        </nav>
      )}

      {/* Title row */}
      {(title ?? actions) && (
        <div className="flex items-start justify-between gap-4">
          {title && (
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          )}
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      )}
    </div>
  );
}
