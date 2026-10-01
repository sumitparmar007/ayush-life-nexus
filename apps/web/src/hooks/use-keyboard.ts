"use client";

import { useEffect, useCallback } from "react";

type ModifierKey = "meta" | "ctrl" | "shift" | "alt";

interface ShortcutOptions {
  key: string;
  modifiers?: ModifierKey[];
  onTrigger: () => void;
  /** Prevent default browser action. Defaults to true. */
  preventDefault?: boolean;
  /** Only fire when target is not an input/textarea. Defaults to false. */
  ignoreInInputs?: boolean;
}

export function useKeyboardShortcut({
  key,
  modifiers = [],
  onTrigger,
  preventDefault = true,
  ignoreInInputs = false,
}: ShortcutOptions) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (ignoreInInputs) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      }

      const metaMatch = !modifiers.includes("meta") || e.metaKey;
      const ctrlMatch = !modifiers.includes("ctrl") || e.ctrlKey;
      const shiftMatch = !modifiers.includes("shift") || e.shiftKey;
      const altMatch = !modifiers.includes("alt") || e.altKey;

      // For meta/ctrl shortcuts, match either key (cross-platform ⌘K = Ctrl+K)
      const cmdCtrl = modifiers.includes("meta") || modifiers.includes("ctrl");
      const cmdCtrlMatch = cmdCtrl ? e.metaKey || e.ctrlKey : true;
      const extraModifiers = cmdCtrl
        ? shiftMatch && altMatch
        : metaMatch && ctrlMatch && shiftMatch && altMatch;

      if (e.key.toLowerCase() === key.toLowerCase() && cmdCtrlMatch && extraModifiers) {
        if (preventDefault) e.preventDefault();
        onTrigger();
      }
    },
    [key, modifiers, onTrigger, preventDefault, ignoreInInputs]
  );

  useEffect(() => {
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handler]);
}

export function useEscapeKey(onEscape: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onEscape, enabled]);
}
