import type { LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  isExternal?: boolean;
  children?: NavItem[];
}

export interface NavGroup {
  id: string;
  label?: string;
  items: NavItem[];
}

export interface WorkspaceConfig {
  id: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  avatarUrl?: string;
  initials: string;
}
