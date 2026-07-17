"use client";

import { useCallback, useRef, useState } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  X,
  Network,
  Sparkles,
  LayoutTemplate,
  Save,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ProjectData } from "@/hooks/use-project-actions";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";
import { AccessDenied } from "@/components/editor/access-denied";
import { AiSidebar } from "@/components/editor/ai-sidebar";
import { Canvas } from "@/components/editor/canvas";
import { ShareDialog } from "@/components/editor/share-dialog";
import { useShareDialog } from "@/hooks/use-share-dialog";

interface WorkspaceShellProps {
  project: { id: string; name: string; ownerId: string } | null;
  currentRoomId: string;
  ownedProjects: ProjectData[];
  sharedProjects: ProjectData[];
}

/**
 * Workspace shell for the editor. Contains the full-viewport layout with
 * navbar, left sidebar, canvas area, and right AI Workspace sidebar.
 */
export function WorkspaceShell({
  project,
  currentRoomId,
  ownedProjects,
  sharedProjects,
}: WorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<CanvasSaveStatus>("idle");
  /** Latest saveNow from the canvas autosave hook (lives under Liveblocks). */
  const latestSaveRef = useRef<() => void>(() => {});

  const handleSaveStatusChange = useCallback((status: CanvasSaveStatus) => {
    setSaveStatus(status);
  }, []);

  const handleSaveReady = useCallback((saveNow: () => void) => {
    latestSaveRef.current = saveNow;
  }, []);

  const handleSaveClick = useCallback(() => {
    latestSaveRef.current();
  }, []);

  // Determine if current user is owner by checking against the projects list
  const isOwner = project
    ? ownedProjects.some((p) => p.id === project.id && p.role === "owner")
    : false;

  // Share dialog state
  const shareDialog = useShareDialog(
    project?.id ?? "",
    isOwner,
  );

  // If no project access, show access denied
  if (!project) {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-bg-base text-text-primary">
        <EditorNavbar
          projectName=""
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
          onToggleAiSidebar={() => setIsAiSidebarOpen((open) => !open)}
          aiSidebarOpen={isAiSidebarOpen}
          onShareClick={() => {}}
          showSaveButton={false}
          saveStatus="idle"
          onSaveClick={() => {}}
        />
        <main className="absolute inset-0 overflow-hidden">
          <ProjectSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            ownedProjects={ownedProjects}
            sharedProjects={sharedProjects}
            currentRoomId={currentRoomId}
          />
          <AccessDenied />
          <AiSidebar
            isOpen={isAiSidebarOpen}
            onClose={() => setIsAiSidebarOpen(false)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-bg-base text-text-primary">
      <div className="absolute inset-0">
        <Canvas
          roomId={currentRoomId}
          templatesOpen={templatesOpen}
          onTemplatesOpenChange={setTemplatesOpen}
          onSaveStatusChange={handleSaveStatusChange}
          onSaveReady={handleSaveReady}
        />
      </div>
      <EditorNavbar
        projectName={project.name}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        onToggleAiSidebar={() => setIsAiSidebarOpen((open) => !open)}
        aiSidebarOpen={isAiSidebarOpen}
        onShareClick={shareDialog.onOpenChange}
        onTemplatesClick={() => setTemplatesOpen(true)}
        showSaveButton
        saveStatus={saveStatus}
        onSaveClick={handleSaveClick}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        currentRoomId={currentRoomId}
      />
      <AiSidebar
        isOpen={isAiSidebarOpen}
        onClose={() => setIsAiSidebarOpen(false)}
      />

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialog.open}
        onOpenChange={shareDialog.onOpenChange}
        projectId={project.id}
        isOwner={shareDialog.isOwner}
        collaborators={shareDialog.collaborators}
        isLoading={shareDialog.isLoading}
        error={shareDialog.error}
        inviteEmail={shareDialog.inviteEmail}
        onInviteEmailChange={shareDialog.onInviteEmailChange}
        onInvite={shareDialog.onInvite}
        onRemove={shareDialog.onRemove}
        onCopyLink={shareDialog.onCopyLink}
        copied={shareDialog.copied}
      />
    </div>
  );
}

interface EditorNavbarProps {
  projectName: string;
  isSidebarOpen: boolean;
  aiSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onToggleAiSidebar: () => void;
  onShareClick: (open: boolean) => void;
  /** Opens the starter templates import modal. Omitted when canvas is unavailable. */
  onTemplatesClick?: () => void;
  /**
   * Workspace-only Save control. Hidden on access-denied and never used by
   * the separate editor-home navbar component.
   */
  showSaveButton?: boolean;
  /** Autosave status shown on the Save button. */
  saveStatus: CanvasSaveStatus;
  /** Manual save via the same persist path as autosave. */
  onSaveClick: () => void;
}

function saveStatusLabel(status: CanvasSaveStatus): string {
  switch (status) {
    case "saving":
      return "Saving...";
    case "saved":
      return "Saved";
    case "error":
      return "Error";
    default:
      return "Save";
  }
}

function SaveStatusIcon({ status }: { status: CanvasSaveStatus }) {
  if (status === "saving") {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }
  if (status === "saved") {
    return <Check className="h-4 w-4 text-state-success" />;
  }
  if (status === "error") {
    return <AlertCircle className="h-4 w-4 text-state-error" />;
  }
  return <Save className="h-4 w-4" />;
}

function EditorNavbar({
  projectName,
  isSidebarOpen,
  aiSidebarOpen,
  onToggleSidebar,
  onToggleAiSidebar,
  onShareClick,
  onTemplatesClick,
  showSaveButton = false,
  saveStatus,
  onSaveClick,
}: EditorNavbarProps) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-14 shrink-0 items-center justify-between px-3 pt-3">
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border-default bg-bg-surface/95 px-2 py-1.5 shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-pressed={isSidebarOpen}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-subtle"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </button>
        <div className="flex min-w-0 flex-col pr-2">
          {projectName ? (
            <span className="truncate text-sm font-semibold text-text-primary">
              {projectName}
            </span>
          ) : (
            <span className="text-sm font-semibold text-text-primary">
              Ghost Room
            </span>
          )}
          <span className="text-[11px] font-medium text-text-faint">
            Workspace
          </span>
        </div>
      </div>
      {/* Right actions only — presence avatars + UserButton live on the canvas */}
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-border-default bg-bg-surface/95 px-1.5 py-1.5 shadow-xl backdrop-blur-md">
        {showSaveButton ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2",
              saveStatus === "error" && "text-state-error",
              saveStatus === "saved" && "text-state-success",
              saveStatus === "saving" && "text-text-secondary",
            )}
            disabled={saveStatus === "saving"}
            onClick={onSaveClick}
            aria-live="polite"
            aria-label={saveStatusLabel(saveStatus)}
            title={saveStatusLabel(saveStatus)}
          >
            <SaveStatusIcon status={saveStatus} />
            {saveStatusLabel(saveStatus)}
          </Button>
        ) : null}
        {onTemplatesClick ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={onTemplatesClick}
          >
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => onShareClick(true)}
        >
          <Network className="h-4 w-4" />
          Share
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 bg-accent-primary/10 text-accent-primary hover:bg-bg-elevated hover:text-accent-primary",
            aiSidebarOpen && "bg-accent-primary/20",
          )}
          onClick={onToggleAiSidebar}
        >
          <Sparkles className="h-4 w-4" />
          AI
        </Button>
      </div>
    </header>
  );
}

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  ownedProjects: ProjectData[];
  sharedProjects: ProjectData[];
  currentRoomId: string;
}

function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  currentRoomId,
}: ProjectSidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
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
          "pointer-events-none fixed left-3 top-16 z-40 flex h-[calc(100vh-5rem)] w-80 flex-col overflow-hidden rounded-2xl border border-border-default bg-bg-surface/95 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-in-out",
          isOpen
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-[calc(100%+1.5rem)]",
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
              <ProjectList
                projects={ownedProjects}
                currentRoomId={currentRoomId}
              />
            </TabsContent>
            <TabsContent
              value="shared"
              className="m-0 flex h-full flex-col text-sm text-text-muted"
            >
              <ProjectList
                projects={sharedProjects}
                currentRoomId={currentRoomId}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="border-t border-border-default p-4">
          <Button
            type="button"
            className="w-full"
            size="default"
            // Create project not wired yet
            onClick={() => {}}
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}

interface ProjectListProps {
  projects: ProjectData[];
  currentRoomId: string;
}

function ProjectList({
  projects,
  currentRoomId,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-12 text-center text-sm text-text-muted">
        <span className="text-text-faint">No projects</span>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1 p-2">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectRow
            project={project}
            isActive={project.id === currentRoomId}
          />
        </li>
      ))}
    </ul>
  );
}

interface ProjectRowProps {
  project: ProjectData;
  isActive: boolean;
}

function ProjectRow({ project, isActive }: ProjectRowProps) {
  return (
    <a
      href={`/editor/${project.id}`}
      className={cn(
        "group flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 transition-colors",
        "hover:border-border-subtle hover:bg-bg-elevated",
        isActive && "border-accent-primary bg-bg-elevated",
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
    </a>
  );
}

