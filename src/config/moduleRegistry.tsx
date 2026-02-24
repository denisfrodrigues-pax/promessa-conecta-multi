import { lazy, ComponentType } from "react";
import { Baby, Music, BookOpen, Users, Heart, Calendar, type LucideIcon } from "lucide-react";

// Lazy-loaded module components
const KidsCheckinPanel = lazy(() => import("@/pages/kids/KidsCheckinPanel"));
const RepertorioMusicas = lazy(() => import("@/pages/ministerio/RepertorioMusicas"));
export interface ModuleDefinition {
  /** Component to render for this module */
  component: ComponentType;
  /** Fallback icon if DB doesn't specify one */
  defaultIcon: LucideIcon;
  /** Default display name */
  defaultName: string;
}

/**
 * Registry mapping modulo_slug → React component + metadata.
 * Add new modules here as they are developed.
 */
const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
  "check-in": {
    component: KidsCheckinPanel,
    defaultIcon: Baby,
    defaultName: "Check-in",
  },
  "repertorio": {
    component: RepertorioMusicas,
    defaultIcon: Music,
    defaultName: "Repertório",
  },
  // Future modules:
  // "escala": { component: lazy(() => import("...")), defaultIcon: Calendar, defaultName: "Escalas" },
};

/**
 * Icon name (string from DB) → Lucide icon component
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Baby,
  Music,
  BookOpen,
  Users,
  Heart,
};

export function getModuleDefinition(moduloSlug: string): ModuleDefinition | null {
  return MODULE_REGISTRY[moduloSlug] ?? null;
}

export function getIconByName(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return Heart;
  return ICON_MAP[iconName] ?? Heart;
}

export function isModuleRegistered(moduloSlug: string): boolean {
  return moduloSlug in MODULE_REGISTRY;
}

export default MODULE_REGISTRY;
