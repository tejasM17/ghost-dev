import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getAllProjects } from "@/lib/projects";
import { slugify } from "@/lib/mock-projects";
import { EditorShell } from "@/components/editor/editor-shell";

/**
 * Editor home page. Server component that fetches owned and shared projects
 * server-side and passes them to the client shell for dialog/mutation handling.
 */
export default async function EditorPage() {
  const currentUser = await getCurrentUser();

  // Redirect unauthenticated users to sign-in
  if (!currentUser) {
    redirect("/sign-in");
  }

  const { owned, shared } = await getAllProjects(currentUser.userId, currentUser.email);

  // Transform database records to the UI shape
  const ownedProjects = owned.map((p) => ({
    id: p.id,
    name: p.name,
    slug: slugify(p.name),
    role: "owner" as const,
  }));

  const sharedProjects = shared.map((p) => ({
    id: p.id,
    name: p.name,
    slug: slugify(p.name),
    role: "collaborator" as const,
  }));

  return (
    <EditorShell initialOwned={ownedProjects} initialShared={sharedProjects} />
  );
}