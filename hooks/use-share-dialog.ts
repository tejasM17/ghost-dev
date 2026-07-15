"use client";

import { useCallback, useState, useTransition } from "react";

import type { CollaboratorData } from "@/components/editor/share-dialog";

/**
 * State and handlers for the share dialog.
 */
export function useShareDialog(projectId: string, isOwner: boolean) {
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [collaborators, setCollaborators] = useState<CollaboratorData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const openDialog = useCallback(async () => {
    setOpen(true);
    setInviteEmail("");
    setError(null);
    setCopied(false);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to load collaborators");
      }

      const { collaborators: collabs } = await response.json();
      setCollaborators(collabs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load collaborators");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const closeDialog = useCallback(() => {
    setOpen(false);
    setInviteEmail("");
    setError(null);
  }, []);

  const submitInvite = useCallback(async () => {
    const trimmed = inviteEmail.trim();
    if (!trimmed) {
      setError("Please enter an email address");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to invite collaborator");
      }

      const { collaborator } = await response.json();

      startTransition(() => {
        setCollaborators((current) => [
          ...current,
          { ...collaborator, createdAt: collaborator.createdAt.toISOString() },
        ]);
        setInviteEmail("");
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite collaborator");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, inviteEmail]);

  const removeCollaborator = useCallback(
    async (collaboratorId: string) => {
      setError(null);

      try {
        const response = await fetch(
          `/api/projects/${projectId}/collaborators/${collaboratorId}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? "Failed to remove collaborator");
        }

        startTransition(() => {
          setCollaborators((current) =>
            current.filter((c) => c.id !== collaboratorId),
          );
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to remove collaborator",
        );
      }
    },
    [projectId],
  );

  const copyLink = useCallback(() => {
    const link = `${window.location.origin}/editor/${projectId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    });
  }, [projectId]);

  return {
    open,
    isOwner,
    collaborators,
    isLoading: isLoading || isPending,
    error,
    inviteEmail,
    onInviteEmailChange: setInviteEmail,
    onOpenChange: (o: boolean) => {
      if (o) {
        openDialog();
      } else {
        closeDialog();
      }
    },
    onInvite: submitInvite,
    onRemove: removeCollaborator,
    onCopyLink: copyLink,
    copied,
  };
}