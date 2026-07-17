"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useOthers } from "@liveblocks/react/suspense";

import { cn } from "@/lib/utils";

const MAX_VISIBLE = 5;
const AVATAR_SIZE = "h-9 w-9";

/**
 * Top-right presence group for the editor canvas room only.
 * Collaborator avatars (excluding the current Clerk user) + Clerk UserButton.
 */
export function PresenceAvatars() {
  const { user } = useUser();
  const others = useOthers();

  const currentUserId = user?.id ?? null;

  const collaborators = others.filter((other) => {
    if (!currentUserId) return true;
    return other.id !== currentUserId;
  });

  const visible = collaborators.slice(0, MAX_VISIBLE);
  const overflow = collaborators.length - MAX_VISIBLE;
  const hasCollaborators = collaborators.length > 0;

  return (
    <div
      className="pointer-events-none absolute right-4 top-[4.25rem] z-30 flex items-center gap-2"
      aria-label="Room participants"
    >
      {hasCollaborators ? (
        <div className="pointer-events-none flex items-center">
          <div className="flex items-center -space-x-2">
            {visible.map((other) => (
              <CollaboratorAvatar
                key={other.connectionId}
                name={other.info.name}
                avatar={other.info.avatar}
                color={other.info.color}
                thinking={other.presence.thinking}
              />
            ))}
            {overflow > 0 ? (
              <div
                className={cn(
                  AVATAR_SIZE,
                  "relative z-10 flex shrink-0 items-center justify-center rounded-full border border-border-default bg-bg-elevated text-[11px] font-semibold text-text-secondary ring-2 ring-bg-base",
                )}
                aria-label={`${overflow} more collaborators`}
              >
                +{overflow}
              </div>
            ) : null}
          </div>
          <div
            className="mx-2 h-6 w-px shrink-0 bg-border-default"
            aria-hidden
          />
        </div>
      ) : null}

      <div className="pointer-events-auto">
        <UserButton
          appearance={{
            elements: {
              userButtonBox: AVATAR_SIZE,
              userButtonTrigger: cn(
                AVATAR_SIZE,
                "rounded-full ring-2 ring-bg-base hover:ring-border-subtle transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-accent-primary/50",
              ),
              userButtonAvatarBox: "h-full w-full rounded-full",
              userButtonAvatarImage: "h-full w-full object-cover",
            },
          }}
        />
      </div>
    </div>
  );
}

interface CollaboratorAvatarProps {
  name: string;
  avatar: string;
  color: string;
  thinking?: boolean;
}

function CollaboratorAvatar({
  name,
  avatar,
  color,
  thinking = false,
}: CollaboratorAvatarProps) {
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        AVATAR_SIZE,
        "relative z-0 flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-bg-base",
        thinking && "ring-accent-ai-text/80 animate-pulse",
      )}
      style={{ backgroundColor: color }}
      title={thinking ? `${name} (thinking)` : name}
      aria-hidden
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element -- Liveblocks avatar URLs are external
        <img
          src={avatar}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <span className="select-none text-[11px] font-semibold text-white">
          {initials}
        </span>
      )}
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
