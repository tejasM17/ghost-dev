"use client";

import * as React from "react";
import { Copy, Link, Loader2, Trash2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogPattern } from "@/components/editor/dialog-pattern";
import { Input } from "@/components/ui/input";

export interface CollaboratorData {
  id: string;
  email: string;
  createdAt: string;
  name?: string | null;
  avatarUrl?: string | null;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  isOwner: boolean;
  collaborators: CollaboratorData[];
  isLoading: boolean;
  error: string | null;
  inviteEmail: string;
  onInviteEmailChange: (value: string) => void;
  onInvite: () => void;
  onRemove: (collaboratorId: string) => void;
  onCopyLink: () => void;
  copied: boolean;
}

export function ShareDialog({
  open,
  onOpenChange,
  projectId,
  isOwner,
  collaborators,
  isLoading,
  error,
  inviteEmail,
  onInviteEmailChange,
  onInvite,
  onRemove,
  onCopyLink,
  copied,
}: ShareDialogProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      // Wait for the dialog open animation to settle before focusing.
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const projectLink = `/editor/${projectId}`;

  return (
    <DialogPattern
      open={open}
      onOpenChange={onOpenChange}
      title="Share project"
      description="Invite collaborators to work on this project with you."
      className="sm:max-w-md"
    >
      <div className="flex flex-col gap-4">
        {/* Copy link section */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-secondary">
            Project link
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                readOnly
                value={projectLink}
                className="pl-9 pr-9 font-mono text-sm"
                aria-label="Project link"
              />
            </div>
            <Button
              type="button"
              size="default"
              onClick={onCopyLink}
              disabled={copied}
              className="min-w-[80px]"
            >
              {copied ? (
                "Copied!"
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Invite section - only for owners */}
        {isOwner && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary">
              Invite collaborator
            </label>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                onInvite();
              }}
            >
              <Input
                ref={inputRef}
                type="email"
                placeholder="email@example.com"
                value={inviteEmail}
                onChange={(e) => onInviteEmailChange(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                size="default"
                disabled={isLoading || !inviteEmail.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite
                  </>
                )}
              </Button>
            </form>
            {error && (
              <p role="alert" className="text-xs text-state-error">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Collaborators list */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-secondary">
            Collaborators
          </label>
          {collaborators.length === 0 ? (
            <p className="py-3 text-sm text-text-muted">
              No collaborators yet. Invite someone to collaborate.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {collaborators.map((collaborator) => (
                <li
                  key={collaborator.id}
                  className="flex items-center justify-between rounded-lg border border-border-default bg-bg-subtle px-3 py-2"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {collaborator.avatarUrl ? (
                      <img
                        src={collaborator.avatarUrl}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-elevated text-sm font-medium text-text-muted">
                        {collaborator.email[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {collaborator.name ?? collaborator.email}
                      </p>
                      {!collaborator.name && (
                        <p className="truncate text-xs text-text-muted">
                          {collaborator.email}
                        </p>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(collaborator.id)}
                      disabled={isLoading}
                      className="text-text-muted hover:text-state-error"
                      aria-label={`Remove ${collaborator.email}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Read-only notice for collaborators */}
        {!isOwner && collaborators.length > 0 && (
          <p className="text-xs text-text-muted">
            You have view-only access. Contact the project owner to manage
            collaborators.
          </p>
        )}
      </div>
    </DialogPattern>
  );
}