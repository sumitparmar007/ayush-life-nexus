"use client";

import * as React from "react";
import { Palette, Sun, Moon, Monitor } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher.tsx";

export function AppearanceSettings() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Palette className="size-4 text-primary" />
          Interface Color Theme
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Customize how Ayush Nexus appears on your device. Choose Light, Dark, or automatically match your system preferences.
        </p>

        <div className="flex flex-col gap-4 max-w-lg">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <span className="text-xs font-semibold text-foreground block mb-2">
              Select Theme Mode
            </span>
            <ThemeSwitcher />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40 border border-border/40">
              <Sun className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground block">Light Mode</span>
                <span className="text-[11px]">Crisp high-contrast daytime viewing</span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40 border border-border/40">
              <Moon className="size-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground block">Dark Mode</span>
                <span className="text-[11px]">Reduced eye fatigue in low light</span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40 border border-border/40">
              <Monitor className="size-4 text-sage-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground block">System Default</span>
                <span className="text-[11px]">Synchronizes with OS theme</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
