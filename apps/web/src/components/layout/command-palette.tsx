"use client";

import * as React from "react";
import {
  Search,
  X,
  Home,
  FileText,
  Pill,
  FlaskConical,
  Shield,
  ShieldCheck,
  Activity,
  Settings,
  LifeBuoy,
  ArrowRight,
  Clock,
} from "lucide-react";
import { cn } from "@nexus/utils";
import { useCommandStore } from "@/store/command.ts";
import { useKeyboardShortcut } from "@/hooks/use-keyboard.ts";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  shortcut?: string;
  onSelect: () => void;
}

export interface CommandGroup {
  id: string;
  label: string;
  items: CommandItem[];
}

interface CommandPaletteProps {
  groups?: CommandGroup[];
  recentItems?: CommandItem[];
}

const defaultGroups: CommandGroup[] = [
  {
    id: "navigation",
    label: "Navigation",
    items: [
      { id: "home", label: "Dashboard", description: "Go to dashboard", icon: Home, onSelect: () => { window.location.href = "/dashboard"; } },
      { id: "records", label: "Health Records", description: "View all records", icon: FileText, onSelect: () => { window.location.href = "/records"; } },
      { id: "medications", label: "Medications", description: "Track medications", icon: Pill, onSelect: () => { window.location.href = "/medications"; } },
      { id: "labs", label: "Lab Results", description: "View lab reports & biomarkers", icon: FlaskConical, onSelect: () => { window.location.href = "/labs"; } },
      { id: "insurance", label: "Insurance", description: "View insurance policies & coverage", icon: Shield, onSelect: () => { window.location.href = "/insurance"; } },
      { id: "consent", label: "Consent & Privacy", description: "Manage health data access & permissions", icon: ShieldCheck, onSelect: () => { window.location.href = "/consent"; } },
      { id: "activity", label: "Activity Log", description: "View recent activity & audit history", icon: Activity, onSelect: () => { window.location.href = "/activity"; } },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [
      { id: "settings", label: "Settings", description: "Open settings & account management", icon: Settings, shortcut: "⌘,", onSelect: () => { window.location.href = "/settings"; } },
      { id: "help", label: "Help & Support", description: "Get help", icon: LifeBuoy, onSelect: () => { window.location.href = "/help"; } },
    ],
  },
];

export function CommandPalette({ groups = defaultGroups, recentItems = [] }: CommandPaletteProps) {
  const { isOpen, query, close, setQuery } = useCommandStore();
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Register ⌘K shortcut
  useKeyboardShortcut({
    key: "k",
    modifiers: ["meta"],
    onTrigger: useCommandStore.getState().toggle,
  });

  // Focus input on open
  React.useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  // Filter items
  const filteredGroups = React.useMemo(() => {
    if (!query) return groups;
    const q = query.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) =>
            i.label.toLowerCase().includes(q) ||
            i.description?.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [query, groups]);

  const allItems = React.useMemo(
    () => (!query && recentItems.length > 0 ? recentItems : filteredGroups.flatMap((g) => g.items)),
    [query, filteredGroups, recentItems]
  );

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = allItems[activeIndex];
      if (item) {
        item.onSelect();
        close();
      }
    } else if (e.key === "Escape") {
      close();
    }
  };

  if (!isOpen) return null;

  const showRecent = !query && recentItems.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-sm animate-fade-in"
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className={cn(
          "fixed left-1/2 top-[20vh] z-50 w-full max-w-xl -translate-x-1/2",
          "rounded-2xl border border-border bg-card shadow-modal",
          "animate-zoom-in"
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search or type a command…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            className={cn(
              "flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground",
              "focus:outline-none"
            )}
            aria-label="Search commands"
            aria-autocomplete="list"
            aria-activedescendant={allItems[activeIndex] ? `cmd-item-${allItems[activeIndex].id}` : undefined}
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-1 text-xs font-mono text-muted-foreground">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div
          role="listbox"
          aria-label="Commands"
          className="max-h-[60vh] overflow-y-auto overscroll-contain p-2"
        >
          {/* Recent */}
          {showRecent && (
            <div className="mb-2">
              <p className="px-2 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                Recent
              </p>
              {recentItems.map((item, index) => (
                <CommandItemRow
                  key={item.id}
                  item={item}
                  isActive={activeIndex === index}
                  onSelect={() => { item.onSelect(); close(); }}
                  icon={Clock}
                />
              ))}
            </div>
          )}

          {/* Filtered groups */}
          {!showRecent && filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Search className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            !showRecent &&
            filteredGroups.map((group) => {
              const groupStartIndex = filteredGroups
                .slice(0, filteredGroups.indexOf(group))
                .reduce((acc, g) => acc + g.items.length, 0);

              return (
                <div key={group.id} className="mb-2">
                  <p className="px-2 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {group.label}
                  </p>
                  {group.items.map((item, i) => (
                    <CommandItemRow
                      key={item.id}
                      item={item}
                      isActive={activeIndex === groupStartIndex + i}
                      onSelect={() => { item.onSelect(); close(); }}
                    />
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 border-t border-border px-4 py-2.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-xs">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-xs">↵</kbd>
            Select
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-xs">Esc</kbd>
            Close
          </span>
        </div>
      </div>
    </>
  );
}

// ─── CommandItemRow ────────────────────────────────────────────────────────────

interface CommandItemRowProps {
  item: CommandItem;
  isActive: boolean;
  onSelect: () => void;
  icon?: React.ElementType;
}

function CommandItemRow({ item, isActive, onSelect, icon }: CommandItemRowProps) {
  const Icon = icon ?? item.icon;

  return (
    <button
      type="button"
      id={`cmd-item-${item.id}`}
      role="option"
      aria-selected={isActive}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left",
        "transition-colors duration-100",
        isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          isActive ? "bg-primary/10 text-primary" : "bg-muted-foreground/10 text-current"
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <span className="truncate text-sm font-medium text-foreground">{item.label}</span>
        {item.description && (
          <span className="truncate text-xs text-muted-foreground">{item.description}</span>
        )}
      </span>
      {item.shortcut ? (
        <kbd className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
          {item.shortcut}
        </kbd>
      ) : (
        <ArrowRight className={cn("size-4 shrink-0 transition-opacity", isActive ? "opacity-60" : "opacity-0")} aria-hidden="true" />
      )}
    </button>
  );
}
