"use client";

/**
 * DoctorDashboardShell — thin client wrapper around AppShell for doctor routes.
 *
 * Same pattern as the patient DashboardShell, but uses doctorNavGroups.
 * The nav config (doctorNavGroups) contains Lucide icon components (functions)
 * which cannot be serialised across the Server → Client boundary in Next.js 15.
 * This wrapper lives on the client side and imports the nav config directly.
 */

import * as React from "react";
import { AppShell, type AppShellProps } from "./app-shell.tsx";
import { doctorNavGroups, doctorCommandGroups } from "@/config/doctor-nav.ts";

type DoctorDashboardShellProps = Omit<AppShellProps, "navGroups" | "commandGroups">;

export function DoctorDashboardShell(props: DoctorDashboardShellProps) {
  return (
    <AppShell
      navGroups={doctorNavGroups}
      commandGroups={doctorCommandGroups}
      onSettingsClick={() => {
        window.location.href = "/doctor/profile";
      }}
      {...props}
    />
  );
}
