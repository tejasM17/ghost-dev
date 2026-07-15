import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Current user identity from Clerk session.
 */
export interface CurrentUser {
  userId: string;
  email: string;
}

/**
 * Resolve the current user identity (userId + primary email) from the active
 * Clerk session. Returns null if no user is signed in.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  // Get the user's primary email from Clerk
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);

  // Find the primary email address
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  );

  const email = primaryEmail?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "";

  return {
    userId,
    email,
  };
}

/**
 * Check if the current user has access to a project (as owner or collaborator).
 * Returns the project if access is granted, null otherwise.
 */
export async function getProjectWithAccess(projectId: string): Promise<{
  id: string;
  name: string;
  ownerId: string;
} | null> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return null;
  }

  // First, check if the project exists and user is the owner
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, ownerId: true },
  });

  if (!project) {
    return null;
  }

  // Owner has access
  if (project.ownerId === currentUser.userId) {
    return project;
  }

  // Check if user is a collaborator (by email)
  const collaborator = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_email: {
        projectId: project.id,
        email: currentUser.email,
      },
    },
  });

  if (collaborator) {
    return project;
  }

  // No access
  return null;
}