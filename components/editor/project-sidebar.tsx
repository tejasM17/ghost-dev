"use client";

import { MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ProjectData } from "@/hooks/use-project-actions";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  ownedProjects: ProjectData[];
  sharedProjects: ProjectData[];
  onCreateProject: () => void;
  onRenameProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onOpenProject?: (projectId: string) => void;
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onOpenProject,
}: ProjectSidebarProps) {
  return (
    <>
      <button
        type="button"
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
        aria-label="Close projects sidebar"
        className={cn(
          "fixed inset-0 z-30 bg-bg-base/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out md:hidden",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />
      <aside
        aria-hidden={!isOpen}
        className={cn(
          "pointer-events-none fixed left-3 top-3 z-40 flex h-[calc(100vh-1.5rem)] w-80 flex-col overflow-hidden rounded-2xl border border-border-default bg-bg-surface/95 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-[calc(100%+1.5rem)]",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border-default px-4">
          <h2 className="text-sm font-semibold text-text-primary">Projects</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close projects sidebar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-subtle"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Tabs defaultValue="my-projects" className="flex flex-1 flex-col overflow-hidden">
          <div className="px-4 pt-3">
            <TabsList className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-bg-elevated p-1 text-text-muted">
              <TabsTrigger
                value="my-projects"
                className="flex-1 inline-flex items-center justify-center rounded-lg px-3 py-1 text-sm font-medium text-text-muted transition-all data-[state=active]:bg-bg-surface data-[state=active]:text-text-primary data-[state=active]:shadow"
              >
                My Projects
              </TabsTrigger>
              <TabsTrigger
                value="shared"
                className="flex-1 inline-flex items-center justify-center rounded-lg px-3 py-1 text-sm font-medium text-text-muted transition-all data-[state=active]:bg-bg-surface data-[state=active]:text-text-primary data-[state=active]:shadow"
              >
                Shared
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent
              value="my-projects"
              className="m-0 flex h-full flex-col text-sm text-text-muted"
            >
              {ownedProjects.length === 0 ? (
                <EmptyState label="No projects yet" />
              ) : (
                <ProjectList
                  projects={ownedProjects}
                  onRename={onRenameProject}
                  onDelete={onDeleteProject}
                  onOpenProject={onOpenProject}
                />
              )}
            </TabsContent>
            <TabsContent
              value="shared"
              className="m-0 flex h-full flex-col text-sm text-text-muted"
            >
              {sharedProjects.length === 0 ? (
                <EmptyState label="No shared projects" />
              ) : (
                <ProjectList
                  projects={sharedProjects}
                  onRename={onRenameProject}
                  onDelete={onDeleteProject}
                  onOpenProject={onOpenProject}
                />
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="border-t border-border-default p-4">
          <Button className="w-full" size="default" onClick={onCreateProject}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center px-6 py-12 text-center text-sm text-text-muted">
      <span className="text-text-faint">{label}</span>
    </div>
  );
}

interface ProjectListProps {
  projects: ProjectData[];
  onRename: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onOpenProject?: (projectId: string) => void;
}

function ProjectList({
  projects,
  onRename,
  onDelete,
  onOpenProject,
}: ProjectListProps) {
  return (
    <ul className="flex flex-col gap-1 p-2">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectRow
            project={project}
            onRename={onRename}
            onDelete={onDelete}
            onOpenProject={onOpenProject}
          />
        </li>
      ))}
    </ul>
  );
}

interface ProjectRowProps {
  project: ProjectData;
  onRename: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onOpenProject?: (projectId: string) => void;
}

function ProjectRow({
  project,
  onRename,
  onDelete,
  onOpenProject,
}: ProjectRowProps) {
  const isOwned = project.role === "owner";
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  function handleClick() {
    if (onOpenProject) {
      onOpenProject(project.id);
    }
  }

  React.useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
      className={cn(
        "group flex cursor-pointer items-center gap-2 rounded-xl border border-transparent px-3 py-2 transition-colors",
        "hover:border-border-subtle hover:bg-bg-elevated",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-text-primary">
          {project.name}
        </span>
        <span className="truncate font-mono text-[11px] text-text-faint">
          /{project.slug}
        </span>
      </div>
      {isOwned ? (
        <div
          ref={menuRef}
          className="relative"
          // Keep menu interactions from bubbling to the row open handler.
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label={`Open actions for ${project.name}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              setMenuOpen((open) => !open);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-bg-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-subtle"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-9 z-50 flex w-40 flex-col overflow-hidden rounded-2xl border border-border-default bg-bg-elevated p-1 shadow-2xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen(false);
                  onRename(project.id);
                }}
                className="inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-sm text-text-secondary transition-colors hover:bg-bg-subtle hover:text-text-primary"
              >
                <Pencil className="h-4 w-4" />
                Rename
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen(false);
                  onDelete(project.id);
                }}
                className="inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-sm text-state-error transition-colors hover:bg-bg-subtle"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
