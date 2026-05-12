import { lazy, ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import { Music, Users, Heart, Calendar, Home } from "lucide-react";

// Lazy-loaded module components
const RepertorioMusicas = lazy(() => import("@/pages/ministerio/RepertorioMusicas"));
const MinisterioEscalas = lazy(() => import("@/pages/ministerio/MinisterioEscalas"));
const LeaderMinhaEquipe = lazy(() => import("@/pages/leader/MinhaEquipe"));
const LeaderDashboard = lazy(() => import("@/pages/leader/Dashboard"));
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
  equipe: {
    component: LeaderMinhaEquipe,
    defaultIcon: Users,
    defaultName: "Equipe",
  },

  dashboard: {
    component: LeaderDashboard,
    defaultIcon: Home,
    defaultName: "Dashboard",
  },

  repertorio: {
    component: RepertorioMusicas,
    defaultIcon: Music,
    defaultName: "Repertório",
  },

  escalas: {
    component: MinisterioEscalas,
    defaultIcon: Calendar,
    defaultName: "Escalas",
  },
};

/**
 * Icon name (string from DB) → Lucide icon component
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Music,
  Users,
  Heart,
  Calendar,
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
