/**
 * Shared display label mappings for PuneSetu civic categories, statuses, and priorities.
 * Used consistently across community feed, map, and detail views.
 */

export const CATEGORY_LABELS: Record<string, string> = {
  ROADS_POTHOLES: "Roads & Potholes",
  SOLID_WASTE: "Solid Waste",
  WATER_SUPPLY: "Water Supply",
  STREET_LIGHTING: "Street Lighting",
  SEWAGE_DRAINAGE: "Sewage & Drainage",
  TRAFFIC_TRANSPORT: "Traffic & Transport",
  ENCROACHMENT: "Encroachment",
  GARDENS_PARKS: "Gardens & Parks",
  HEALTH_SANITATION: "Health & Sanitation",
  OTHER: "Other",
};

export const CATEGORY_ICONS: Record<string, string> = {
  ROADS_POTHOLES: "🛣️",
  SOLID_WASTE: "🗑️",
  WATER_SUPPLY: "💧",
  STREET_LIGHTING: "💡",
  SEWAGE_DRAINAGE: "🚰",
  TRAFFIC_TRANSPORT: "🚗",
  ENCROACHMENT: "🚧",
  GARDENS_PARKS: "🌳",
  HEALTH_SANITATION: "🏥",
  OTHER: "📋",
};

export const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
  ESCALATED: "Escalated",
  SLA_BREACHED: "SLA Breached",
  REOPENED: "Reopened",
};

export const STATUS_VARIANTS: Record<string, "info" | "warning" | "success" | "error" | "neutral"> = {
  SUBMITTED: "info",
  ASSIGNED: "info",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  REJECTED: "error",
  ESCALATED: "error",
  SLA_BREACHED: "error",
  REOPENED: "warning",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  EMERGENCY: "Emergency",
};

export const PRIORITY_VARIANTS: Record<string, "neutral" | "info" | "warning" | "error"> = {
  LOW: "neutral",
  MEDIUM: "info",
  HIGH: "warning",
  EMERGENCY: "error",
};

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getStatusLabel(status: string, t?: (key: string) => string): string {
  if (t) {
    const key = `status.${status}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
  }
  return STATUS_LABELS[status] || status;
}

export function getCategoryLabel(category: string, t?: (key: string) => string): string {
  if (t) {
    const key = `category.${category}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
  }
  return CATEGORY_LABELS[category] || category;
}

export function getPriorityLabel(priority: string, t?: (key: string) => string): string {
  if (t) {
    const key = `priority.${priority}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
  }
  return PRIORITY_LABELS[priority] || priority;
}

