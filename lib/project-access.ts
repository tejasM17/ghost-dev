/**
 * Project membership helpers.
 *
 * Kept as a thin re-export of `lib/auth` so routes and pages share one
 * implementation (try/catch, empty-email collaborator guard, etc.).
 * Prefer importing from `@/lib/auth` in new code; this path remains for
 * existing page imports.
 */
export {
  getCurrentUser,
  getProjectWithAccess,
  type CurrentUser,
} from "@/lib/auth";
