"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@nexus/utils";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

type ThemeValue = (typeof themes)[number]["value"];

interface ThemeSwitcherProps {
  className?: string;
  /** Compact: only shows a single icon button cycling through themes. */
  compact?: boolean;
}

export function ThemeSwitcher({ className, compact = false }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          compact
            ? "size-9 rounded-lg bg-muted animate-pulse"
            : "h-9 w-[180px] rounded-lg bg-muted animate-pulse",
          className
        )}
      />
    );
  }

  if (compact) {
    const currentIndex = themes.findIndex((t) => t.value === theme);
    const next = themes[(currentIndex + 1) % themes.length];
    const Current = themes[currentIndex]?.icon ?? Monitor;

    return (
      <button
        type="button"
        onClick={() => setTheme(next.value)}
        aria-label={`Switch to ${next.label} theme`}
        title={`Current: ${themes[currentIndex]?.label ?? "System"}`}
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-lg",
          "text-muted-foreground transition-colors duration-150",
          "hover:bg-muted hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
      >
        <Current className="size-4" />
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-xl bg-muted p-1",
        className
      )}
    >
      {themes.map(({ value, label, icon: Icon }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(value as ThemeValue)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
              "transition-all duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              isActive
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
