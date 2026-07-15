"use client";

import { useState } from "react";

import { EditorHome } from "@/components/editor/editor-home";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { useProjectActions, type ProjectData } from "@/hooks/use-project-actions";

interface EditorShellProps {
  initialOwned: ProjectData[];
  initialShared: ProjectData[];
}

export function EditorShell({ initialOwned, initialShared }: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const {
    ownedProjects,
    sharedProjects,
    dialog,
    activeProject,
    name,
    setName,
    error,
    isSubmitting,
    roomId,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    submitCreate,
    submitRename,
    submitDelete,
  } = useProjectActions(initialOwned, initialShared);

  const isCreateOpen = dialog.kind === "create";
  const isRenameOpen = dialog.kind === "rename";
  const isDeleteOpen = dialog.kind === "delete";

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-bg-base text-text-primary">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />
      <main className="relative flex-1 overflow-hidden">
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          onCreateProject={openCreate}
          onRenameProject={openRename}
          onDeleteProject={openDelete}
        />
        <EditorHome onCreateProject={openCreate} />
      </main>

      <CreateProjectDialog
        open={isCreateOpen}
        onOpenChange={(next) => {
          if (!next) closeDialog();
        }}
        name={name}
        onNameChange={setName}
        error={isCreateOpen ? error : null}
        isSubmitting={isSubmitting}
        onSubmit={submitCreate}
        roomId={roomId}
      />

      <RenameProjectDialog
        open={isRenameOpen}
        onOpenChange={(next) => {
          if (!next) closeDialog();
        }}
        currentName={activeProject?.name ?? ""}
        name={name}
        onNameChange={setName}
        error={isRenameOpen ? error : null}
        isSubmitting={isSubmitting}
        onSubmit={submitRename}
      />

      <DeleteProjectDialog
        open={isDeleteOpen}
        onOpenChange={(next) => {
          if (!next) closeDialog();
        }}
        projectName={activeProject?.name ?? ""}
        isSubmitting={isSubmitting}
        onConfirm={submitDelete}
      />
    </div>
  );
}