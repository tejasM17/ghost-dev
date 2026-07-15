import { prisma } from "@/lib/prisma";

/**
 * Project shape returned by the data layer. Mirrors the API response shape
 * so the sidebar receives typed data without transformation.
 */
export interface Project {
  id: string;
  name: string;
  ownerId: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fetch all projects owned by the given user, ordered by creation date.
 */
export async function getOwnedProjects(userId: string): Promise<Project[]> {
  return prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch all projects the given user has been invited to collaborate on.
 * Returns the project data along with the collaborator email.
 */
export async function getSharedProjects(userId: string): Promise<Project[]> {
  const collaborators = await prisma.projectCollaborator.findMany({
    where: { email: userId },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });

  return collaborators.map((collab) => collab.project);
}

/**
 * Fetch both owned and shared projects for a user.
 */
export async function getAllProjects(userId: string): Promise<{
  owned: Project[];
  shared: Project[];
}> {
  const [owned, shared] = await Promise.all([
    getOwnedProjects(userId),
    getSharedProjects(userId),
  ]);

  return { owned, shared };
}