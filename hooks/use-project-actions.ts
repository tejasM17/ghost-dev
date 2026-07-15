"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { slugify } from "@/lib/mock-projects";

type DialogKind = null | "create" | "rename" | "delete";

interface DialogState {
  kind: DialogKind;
  projectId: string | null;
  projectName: string | null;
}

const CLOSED: DialogState = { kind: null, projectId: null, projectName: null };

/**
 * Generate a short unique suffix for project slugs.
 */
function generateSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

/**
 * Centralized state for the editor's project dialogs and API mutations.
 * Manages dialog open/close, form values, submit handlers, and loading flags.
 */
export function useProjectActions(initialOwned: ProjectData[], initialShared: ProjectData[]) {
  const router = useRouter();
  const [ownedProjects, setOwnedProjects] = useState<ProjectData[]>(() => initialOwned);
  const [sharedProjects] = useState<ProjectData[]>(() => initialShared);

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
    setDialog({ kind: "create", projectId: null, projectName: null });
    setName("");
    setError(null);
  }, []);

  const openRename = useCallback(
    (projectId: string) => {
      const project = ownedProjects.find((p) => p.id === projectId);
      if (!project) return;
      setDialog({ kind: "rename", projectId, projectName: project.name });
      setName(project.name);
      setError(null);
    },
    [ownedProjects],
  );

  const openDelete = useCallback((projectId: string) => {
    const project = ownedProjects.find((p) => p.id === projectId);
    setDialog({
      kind: "delete",
      projectId,
      projectName: project?.name ?? null,
    });
    setError(null);
  }, [ownedProjects]);

  const activeProject = useMemo<ProjectData | null>(() => {
    if (!dialog.projectId) return null;
    return ownedProjects.find((p) => p.id === dialog.projectId) ?? null;
  }, [dialog.projectId, ownedProjects]);

  const roomId = useMemo(() => {
    if (!name.trim()) return "";
    return `${slugify(name)}-${generateSuffix()}`;
  }, [name]);

  const submitCreate = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Project name is required.");
      return;
    }

    setError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, roomId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to create project");
      }

      const { project } = await response.json();

      startTransition(() => {
        setOwnedProjects((current) => [
          { ...project, role: "owner" },
          ...current,
        ]);
        closeDialog();
        router.push(`/editor/${project.id}`);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    }
  }, [name, roomId, closeDialog, router]);

  const submitRename = useCallback(async () => {
    if (!dialog.projectId) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Project name is required.");
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/projects/${dialog.projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to rename project");
      }

      const { project } = await response.json();

      startTransition(() => {
        setOwnedProjects((current) =>
          current.map((p) =>
            p.id === dialog.projectId
              ? { ...p, name: project.name, slug: slugify(project.name) }
              : p,
          ),
        );
        closeDialog();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename project");
    }
  }, [dialog.projectId, name, closeDialog]);

  const submitDelete = useCallback(async () => {
    if (!dialog.projectId) return;

    setError(null);

    try {
      const response = await fetch(`/api/projects/${dialog.projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to delete project");
      }

      startTransition(() => {
        const deletedId = dialog.projectId;
        setOwnedProjects((current) =>
          current.filter((p) => p.id !== deletedId),
        );
        closeDialog();
        // If the deleted project is the current route, redirect to /editor
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    }
  }, [dialog.projectId, closeDialog, router]);

  return {
    ownedProjects,
    sharedProjects,
    dialog,
    activeProject,
    name,
    setName,
    error,
    isSubmitting: isPending,
    roomId,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    submitCreate,
    submitRename,
    submitDelete,
  };
}

/**
 * Project data shape used by the UI components.
 */
export interface ProjectData {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "collaborator";
}