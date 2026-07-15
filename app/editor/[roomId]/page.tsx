import { redirect } from "next/navigation";

import { getCurrentUserId } from "@/lib/auth";
import { getProjectWithAccess } from "@/lib/project-access";
import { getAllProjects } from "@/lib/projects";
import { slugify } from "@/lib/mock-projects";
import { WorkspaceShell } from "@/components/editor/workspace-shell";

interface EditorRoomPageProps {
  params: Promise<{ roomId: string }>;
}

/**
 * Editor workspace page for a specific project. Server component that checks
 * access permissions and renders the workspace shell.
 */
export default async function EditorRoomPage({ params }: EditorRoomPageProps) {
  const { roomId } = await params;

  // Check authentication
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/sign-in");
  }

  // Check project access
  const project = await getProjectWithAccess(roomId);
  if (!project) {
    // Return the shell with AccessDenied - we'll render it client-side
    return (
      <WorkspaceShell
        project={null}
        currentRoomId={roomId}
        ownedProjects={[]}
        sharedProjects={[]}
      />
    );
  }

  // Fetch all projects for the sidebar
  const { owned, shared } = await getAllProjects(userId);

  // Transform to UI shape
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
    <WorkspaceShell
      project={{ id: project.id, name: project.name }}
      currentRoomId={roomId}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  );
}