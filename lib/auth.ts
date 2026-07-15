import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * Resolve the current Clerk user ID from the active session, or `null` if no
 * user is signed in. Route handlers should treat `null` as an unauthenticated
 * request and return 401.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}

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

  const { prisma } = await import("@/lib/prisma");

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

/**
 * Clerk user data for a collaborator.
 */
export interface ClerkUserData {
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

/**
 * Look up a Clerk user by email address and return their name and avatar.
 * Returns null if no user is found for the email.
 */
export async function getClerkUserByEmail(
  email: string,
): Promise<ClerkUserData | null> {
  const clerk = await clerkClient();

  // Search for user by email using Clerk's getUserList
  const response = await clerk.users.getUserList({
    emailAddress: [email.toLowerCase()],
    limit: 1,
  });

  // Access the data array directly from the paginated response
  const data = (response as unknown as { data: unknown[] }).data;
  if (!data || data.length === 0) {
    return null;
  }

  const user = data[0] as {
    fullName: string | null;
    firstName: string | null;
    imageUrl: string | null;
  };

  return {
    email: email.toLowerCase(),
    name: user.fullName ?? user.firstName ?? null,
    avatarUrl: user.imageUrl ?? null,
  };
}

/**
 * Look up multiple Clerk users by email addresses in batch.
 * Returns a map of email -> ClerkUserData (null for emails not found).
 */
export async function getClerkUsersByEmails(
  emails: string[],
): Promise<Map<string, ClerkUserData | null>> {
  const clerk = await clerkClient();
  const result = new Map<string, ClerkUserData | null>();

  if (emails.length === 0) {
    return result;
  }

  // Clerk allows up to 100 users per request
  const response = await clerk.users.getUserList({
    emailAddress: emails.map((e) => e.toLowerCase()),
    limit: 100,
  });

  // Access the data array directly from the paginated response
  const data = (response as unknown as { data: unknown[] }).data;
  if (!data) {
    // Return nulls for all requested emails if no data
    for (const email of emails) {
      result.set(email, null);
    }
    return result;
  }

  // Build a map of email -> user
  const userMap = new Map<string, {
    fullName: string | null;
    firstName: string | null;
    imageUrl: string | null;
  }>();

  for (const user of data as {
    emailAddresses: { emailAddress: string }[];
    fullName: string | null;
    firstName: string | null;
    imageUrl: string | null;
  }[]) {
    for (const emailEntry of user.emailAddresses) {
      userMap.set(emailEntry.emailAddress.toLowerCase(), user);
    }
  }

  // Map each requested email to the result
  for (const email of emails) {
    const user = userMap.get(email.toLowerCase());
    if (user) {
      result.set(email, {
        email: email.toLowerCase(),
        name: user.fullName ?? user.firstName ?? null,
        avatarUrl: user.imageUrl ?? null,
      });
    } else {
      result.set(email, null);
    }
  }

  return result;
}