import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
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
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  // Always load sidebar lists so access-denied and owner/collaborator
  // shells can navigate between projects the user can open.
  const { owned, shared } = await getAllProjects(
    currentUser.userId,
    currentUser.email,
  );

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

  // Check project access
  const project = await getProjectWithAccess(roomId);
  if (!project) {
    return (
      <WorkspaceShell
        project={null}
        currentRoomId={roomId}
        currentUserId={currentUser.userId}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
      />
    );
  }

  return (
    <WorkspaceShell
      project={{ id: project.id, name: project.name, ownerId: project.ownerId }}
      currentRoomId={roomId}
      currentUserId={currentUser.userId}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  );
}
