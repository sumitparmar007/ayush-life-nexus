import { create } from "zustand";

interface CommandState {
  isOpen: boolean;
  query: string;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (q: string) => void;
}

export const useCommandStore = create<CommandState>()((set) => ({
  isOpen: false,
  query: "",
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, query: "" }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen, query: s.isOpen ? "" : s.query })),
  setQuery: (q) => set({ query: q }),
}));
