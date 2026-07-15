/**
 * Mock project list used by the editor's sidebar and dialogs while
 * persistence is not yet wired. Each project is either owned by the current
 * user or shared with them. Sidebar actions (rename, delete) are scoped to
 * owned projects only.
 */

export type ProjectRole = "owner" | "collaborator";

export interface MockProject {
  id: string;
  name: string;
  slug: string;
  role: ProjectRole;
}

export const initialOwnedProjects: MockProject[] = [
  { id: "project-aurora", name: "Aurora Payments", slug: "aurora-payments", role: "owner" },
  { id: "project-helios", name: "Helios Analytics", slug: "helios-analytics", role: "owner" },
];

export const initialSharedProjects: MockProject[] = [
  {
    id: "project-orion",
    name: "Orion Search Infra",
    slug: "orion-search-infra",
    role: "collaborator",
  },
];

/**
 * Convert a project name to a URL-safe slug. Mirrors the behavior of the
 * planned persistence layer so the preview matches the final stored value.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
