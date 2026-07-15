"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EditorHomeProps {
  onCreateProject: () => void;
}

export function EditorHome({ onCreateProject }: EditorHomeProps) {
  return (
    <div className="flex h-full w-full items-center justify-center px-6">
      <div className="flex max-w-xl flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
          Create a project or open an existing one
        </h1>
        <p className="text-sm text-text-muted sm:text-base">
          Start a new architecture workspace, or choose a project from the
          sidebar.
        </p>
        <Button
          type="button"
          size="default"
          onClick={onCreateProject}
          className="mt-2"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </div>
  );
}
