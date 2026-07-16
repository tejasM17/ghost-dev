"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { PanelLeftClose, PanelLeftOpen, Share2, MessageSquare, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ProjectData } from "@/hooks/use-project-actions";
import { AccessDenied } from "@/components/editor/access-denied";
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
 * navbar, left sidebar, canvas area, and right AI chat sidebar placeholder.
 */
export function WorkspaceShell({
  project,
  currentRoomId,
  ownedProjects,
  sharedProjects,
}: WorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);

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
      <div className="flex h-screen w-full flex-col overflow-hidden bg-bg-base text-text-primary">
        <EditorNavbar
          projectName=""
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
          onToggleAiSidebar={() => setIsAiSidebarOpen((open) => !open)}
          aiSidebarOpen={isAiSidebarOpen}
          onShareClick={() => {}}
        />
        {/* Canvas area with access denied message */}
        <div className="fixed inset-0 top-14">
          <AccessDenied />
        </div>
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
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-bg-base text-text-primary">
      <EditorNavbar
        projectName={project.name}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        onToggleAiSidebar={() => setIsAiSidebarOpen((open) => !open)}
        aiSidebarOpen={isAiSidebarOpen}
        onShareClick={shareDialog.onOpenChange}
      />
      {/* Canvas fills full viewport - sidebars float over it */}
      <div className="fixed inset-0 top-14">
        <Canvas roomId={currentRoomId} />
      </div>
      {/* Sidebars rendered outside canvas container so they float over it */}
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
}

function EditorNavbar({
  projectName,
  isSidebarOpen,
  aiSidebarOpen,
  onToggleSidebar,
  onToggleAiSidebar,
  onShareClick,
}: EditorNavbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border-default bg-bg-surface px-4">
      <div className="flex items-center gap-3">
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
        {projectName ? (
          <span className="text-sm font-medium text-text-primary">
            {projectName}
          </span>
        ) : (
          <span className="text-sm font-medium text-text-muted">Editor</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => onShareClick(true)}
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2",
            aiSidebarOpen && "bg-bg-elevated text-text-primary",
          )}
          onClick={onToggleAiSidebar}
        >
          <MessageSquare className="h-4 w-4" />
          AI Chat
        </Button>
      </div>
      <div className="flex items-center">
        <UserButton
          appearance={{
            elements: {
              userButtonBox: "h-9 w-9",
              userButtonTrigger:
                "h-9 w-9 rounded-xl ring-1 ring-border-default hover:ring-border-subtle transition",
              userButtonAvatarBox: "h-9 w-9 rounded-xl",
            },
          }}
        />
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
          "fixed inset-0 z-40 bg-bg-base/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out md:hidden",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />
      <aside
        aria-hidden={!isOpen}
        className={cn(
          "pointer-events-none fixed left-0 top-14 z-50 flex h-full w-80 flex-col border-r border-border-default bg-bg-surface/90 shadow-xl backdrop-blur-md transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-[100%]",
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
            <Share2 className="h-4 w-4" />
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

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Right sidebar placeholder for future AI chat.
 */
function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  return (
    <>
      {/* Mobile backdrop for AI sidebar */}
      <button
        type="button"
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
        aria-label="Close AI chat"
        className={cn(
          "fixed inset-0 z-40 bg-bg-base/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out md:hidden",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />
      <aside
        aria-hidden={!isOpen}
        className={cn(
          "pointer-events-none fixed right-0 top-14 z-50 flex h-full w-80 flex-col border-l border-border-default bg-bg-surface/90 shadow-xl backdrop-blur-md transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border-default px-4">
          <h2 className="text-sm font-semibold text-text-primary">AI Chat</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI chat"
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-subtle"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-text-muted">AI chat coming soon</p>
        </div>
      </aside>
    </>
  );
}