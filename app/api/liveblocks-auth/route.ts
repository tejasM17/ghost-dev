import { NextResponse } from "next/server";

import {
  getClerkUserByEmail,
  getCurrentUser,
} from "@/lib/auth";
import { getUserColor, liveblocks } from "@/lib/liveblocks";
import { getProjectWithAccess } from "@/lib/project-access";
import { AI_CHAT_FEED_ID, AI_STATUS_FEED_ID } from "@/types/tasks";

/**
 * Liveblocks ID-token auth endpoint.
 *
 * Flow:
 *   1. Resolve the current Clerk user (401 if not signed in).
 *   2. Verify the project referenced by `room` exists and the current
 *      user is the owner or a collaborator (403 if not).
 *   3. Ensure the Liveblocks room exists for the project (create it on
 *      first access with default write access for room members).
 *   4. Mint an ID token with the user's display name, avatar, and a
 *      deterministically-derived cursor color.
 *
 * The room ID is the project ID, so this route works for any project the
 * caller can see.
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Liveblocks sends the active RoomProvider ID as `{ room }` when an
    // `authEndpoint` URL is configured. That ID is the project ID here.
    let body: unknown = null;
    try {
      body = await request.json();
    } catch {
      body = null;
    }

    const roomId =
      body !== null && typeof body === "object" && "room" in body
        ? (body as { room: unknown }).room
        : null;

    if (typeof roomId !== "string" || roomId.length === 0) {
      return NextResponse.json(
        { error: "room is required" },
        { status: 400 },
      );
    }

    // Verify project access. Returns null when the project doesn't exist OR
    // the user has no membership — spec mandates 403 in both cases.
    const project = await getProjectWithAccess(roomId);
    if (!project) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Resolve display name and avatar from Clerk. Falls back to safe
    // defaults if the user lookup fails (e.g. a collaborator email that
    // isn't associated with a Clerk account yet).
    let name = currentUser.email || "Collaborator";
    let avatar = "";
    try {
      if (currentUser.email) {
        const clerkUser = await getClerkUserByEmail(currentUser.email);
        name = clerkUser?.name ?? currentUser.email;
        avatar = clerkUser?.avatarUrl ?? "";
      }
    } catch (error) {
      console.error("Failed to resolve Clerk user info for Liveblocks", error);
    }
    const color = getUserColor(currentUser.userId);

    // Ensure the room exists, then grant this user write access.
    // getOrCreateRoom only applies usersAccesses on *create* — if the owner
    // already created the room, a collaborator would still be locked out
    // (Liveblocks 4001 / "You have no access to this room"). Always update
    // after create-or-get so every verified member receives room:write.
    // Project membership is enforced above; rooms stay private by default.
    try {
      await liveblocks.getOrCreateRoom(roomId, {
        defaultAccesses: [],
        usersAccesses: {
          [currentUser.userId]: ["room:write"],
        },
      });
      await liveblocks.updateRoom(roomId, {
        usersAccesses: {
          [currentUser.userId]: ["room:write"],
        },
      });
    } catch (error) {
      console.error("Failed to ensure Liveblocks room exists", error);
      return NextResponse.json(
        { error: "Failed to prepare collaboration room" },
        { status: 500 },
      );
    }

    // Ensure room feeds exist before clients subscribe. Missing feeds can
    // cause client `useFeedMessages` to hang until "Feed messages fetch timeout"
    // (especially for collaborators joining before anyone created the feed).
    await Promise.all([
      ensureRoomFeed(roomId, AI_STATUS_FEED_ID),
      ensureRoomFeed(roomId, AI_CHAT_FEED_ID),
    ]);

    // Mint an ID token bound to the current user. The userInfo payload is
    // what other clients read via useSelf / useOthers.
    const { status, body: responseBody } = await liveblocks.identifyUser(
      { userId: currentUser.userId, groupIds: [] },
      { userInfo: { name, avatar, color } },
    );

    return new Response(responseBody, { status });
  } catch (error) {
    console.error("[POST /api/liveblocks-auth]", error);
    return NextResponse.json(
      { error: "Failed to authenticate for collaboration" },
      { status: 500 },
    );
  }
}

/** Create a Liveblocks feed if missing; ignore already-exists races. */
async function ensureRoomFeed(roomId: string, feedId: string): Promise<void> {
  try {
    await liveblocks.createFeed({ roomId, feedId });
  } catch {
    // Feed already exists or concurrent create — safe to continue.
  }
}
