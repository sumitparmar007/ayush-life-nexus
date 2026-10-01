"use client";

/**
 * DashboardShell — thin client wrapper around AppShell.
 *
 * The nav config (patientNavGroups) contains Lucide icon components (functions)
 * which cannot be serialised across the Server → Client boundary in Next.js 15.
 * This wrapper lives on the client side and imports the nav config directly,
 * so the server layout never needs to pass function props.
 */

import * as React from "react";
import { AppShell, type AppShellProps } from "./app-shell.tsx";
import { patientNavGroups } from "@/config/nav.ts";

type DashboardShellProps = Omit<AppShellProps, "navGroups">;

export function DashboardShell(props: DashboardShellProps) {
  return <AppShell navGroups={patientNavGroups} {...props} />;
}
