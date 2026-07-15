"use client";

import { useCallback, useMemo, useState, useTransition } from "react";

import {
  initialOwnedProjects,
  initialSharedProjects,
  slugify,
  type MockProject,
} from "@/lib/mock-projects";

type DialogKind = null | "create" | "rename" | "delete";

interface DialogState {
  kind: DialogKind;
  projectId: string | null;
}

const CLOSED: DialogState = { kind: null, projectId: null };

/**
 * Centralized state for the editor's project dialogs and the mock project
 * list. Exposes dialog open/close actions, form values, submit handlers, and
 * loading flags. No persistence — mutations are local to the hook.
 */
export function useProjectDialogs() {
  const [ownedProjects, setOwnedProjects] = useState<MockProject[]>(() => initialOwnedProjects);
  const [sharedProjects] = useState<MockProject[]>(() => initialSharedProjects);

  const [dialog, setDialog] = useState<DialogState>(CLOSED);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const closeDialog = useCallback(() => {
    setDialog(CLOSED);
    setName("");
    setError(null);
  }, []);

  const openCreate = useCallback(() => {
    setDialog({ kind: "create", projectId: null });
    setName("");
    setError(null);
  }, []);

  const openRename = useCallback(
    (projectId: string) => {
      const project = ownedProjects.find((p) => p.id === projectId);
      if (!project) return;
      setDialog({ kind: "rename", projectId });
      setName(project.name);
      setError(null);
    },
    [ownedProjects],
  );

  const openDelete = useCallback((projectId: string) => {
    setDialog({ kind: "delete", projectId });
    setError(null);
  }, []);

  const activeProject = useMemo<MockProject | null>(() => {
    if (!dialog.projectId) return null;
    return ownedProjects.find((p) => p.id === dialog.projectId) ?? null;
  }, [dialog.projectId, ownedProjects]);

  const submitCreate = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Project name is required.");
      return;
    }

    startTransition(() => {
      setOwnedProjects((current) => [
        ...current,
        {
          id: `project-${Date.now()}`,
          name: trimmed,
          slug: slugify(trimmed),
          role: "owner",
        },
      ]);
      closeDialog();
    });
  }, [name, closeDialog]);

  const submitRename = useCallback(() => {
    if (!dialog.projectId) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Project name is required.");
      return;
    }

    startTransition(() => {
      setOwnedProjects((current) =>
        current.map((project) =>
          project.id === dialog.projectId
            ? { ...project, name: trimmed, slug: slugify(trimmed) }
            : project,
        ),
      );
      closeDialog();
    });
  }, [dialog.projectId, name, closeDialog]);

  const submitDelete = useCallback(() => {
    if (!dialog.projectId) return;

    startTransition(() => {
      setOwnedProjects((current) =>
        current.filter((project) => project.id !== dialog.projectId),
      );
      closeDialog();
    });
  }, [dialog.projectId, closeDialog]);

  return {
    ownedProjects,
    sharedProjects,
    dialog,
    activeProject,
    name,
    setName,
    error,
    isSubmitting: isPending,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    submitCreate,
    submitRename,
    submitDelete,
  };
}
