import { NextResponse } from "next/server";

import { getCurrentUserId, getClerkUsersByEmails } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface InviteBody {
  email?: unknown;
}

function readEmail(body: unknown): string | null {
  if (body === null || typeof body !== "object") return null;
  const raw = (body as InviteBody).email;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : null;
}

/**
 * List collaborators for a project. Owner and collaborators can view.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check access: owner or collaborator
  const isOwner = project.ownerId === userId;

  // Get user's email from Clerk
  const { clerkClient } = await import("@clerk/nextjs/server");
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const primaryEmail = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  );
  const userEmail = (
    primaryEmail?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    ""
  ).toLowerCase();

  const actualCollaborator = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_email: {
        projectId: project.id,
        email: userEmail,
      },
    },
  });

  const hasAccess = isOwner || !!actualCollaborator;
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const collaborators = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  // Enrich with Clerk user data
  const emails = collaborators.map((c) => c.email);
  const clerkUsers = await getClerkUsersByEmails(emails);

  const enrichedCollaborators = collaborators.map((c) => {
    const clerkUser = clerkUsers.get(c.email);
    return {
      ...c,
      createdAt: c.createdAt.toISOString(),
      name: clerkUser?.name ?? null,
      avatarUrl: clerkUser?.avatarUrl ?? null,
    };
  });

  return NextResponse.json({ collaborators: enrichedCollaborators });
}

/**
 * Invite a collaborator. Only the owner may invite.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only owner can invite
  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const rawEmail = readEmail(body);
  if (!rawEmail) {
    return NextResponse.json(
      { error: "Valid email is required" },
      { status: 400 },
    );
  }

  // Collaborator emails are always stored lowercased for consistent lookups.
  const email = rawEmail.toLowerCase();

  // Check if already a collaborator
  const existing = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_email: {
        projectId: project.id,
        email,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "User is already a collaborator" },
      { status: 409 },
    );
  }

  // Don't allow inviting the owner
  const { clerkClient } = await import("@clerk/nextjs/server");
  const clerk = await clerkClient();
  const owner = await clerk.users.getUser(project.ownerId);
  const ownerEmail = owner.emailAddresses.find(
    (e) => e.id === owner.primaryEmailAddressId
  );
  if (ownerEmail?.emailAddress.toLowerCase() === email) {
    return NextResponse.json(
      { error: "Cannot invite the project owner" },
      { status: 400 },
    );
  }

  const collaborator = await prisma.projectCollaborator.create({
    data: {
      projectId: project.id,
      email,
    },
  });

  // If the invitee already has a Clerk account, grant Liveblocks room
  // access immediately so they can open the project without waiting for
  // a subsequent auth-endpoint updateRoom call. Auth still re-grants
  // access on every join (covers users who sign up after the invite).
  try {
    const { liveblocks } = await import("@/lib/liveblocks");
    const inviteeList = await clerk.users.getUserList({
      emailAddress: [email],
      limit: 1,
    });
    const inviteeData = (inviteeList as unknown as { data: { id: string }[] })
      .data;
    const inviteeId = inviteeData?.[0]?.id;
    if (inviteeId) {
      await liveblocks.getOrCreateRoom(project.id, {
        defaultAccesses: [],
        usersAccesses: {
          [userId]: ["room:write"],
          [inviteeId]: ["room:write"],
        },
      });
      await liveblocks.updateRoom(project.id, {
        usersAccesses: {
          [inviteeId]: ["room:write"],
        },
      });
    }
  } catch (error) {
    // Membership is already in Postgres; Liveblocks access will be
    // granted when the collaborator hits /api/liveblocks-auth.
    console.error("Failed to grant Liveblocks access on invite", error);
  }

  // Try to get Clerk user data for the response
  const { getClerkUserByEmail } = await import("@/lib/auth");
  const clerkUser = await getClerkUserByEmail(email);

  return NextResponse.json(
    {
      collaborator: {
        ...collaborator,
        createdAt: collaborator.createdAt.toISOString(),
        name: clerkUser?.name ?? null,
        avatarUrl: clerkUser?.avatarUrl ?? null,
      },
    },
    { status: 201 },
  );
}