import { auth } from "@clerk/nextjs/server";

/**
 * Resolve the current Clerk user ID from the active session, or `null` if no
 * user is signed in. Route handlers should treat `null` as an unauthenticated
 * request and return 401.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}
