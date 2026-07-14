"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <aside
      aria-hidden={!isOpen}
      className={cn(
        "pointer-events-none fixed left-0 top-0 z-40 flex h-full w-80 flex-col border-r border-border-default bg-bg-surface/95 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full",
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
            className="m-0 flex h-full items-center justify-center px-6 py-12 text-center text-sm text-text-muted"
          >
            <EmptyState label="No projects yet" />
          </TabsContent>
          <TabsContent
            value="shared"
            className="m-0 flex h-full items-center justify-center px-6 py-12 text-center text-sm text-text-muted"
          >
            <EmptyState label="No shared projects" />
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <div className="border-t border-border-default p-4">
        <Button className="w-full" size="default">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </aside>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-text-faint">{label}</span>
    </div>
  );
}
