"use client";

import * as React from "react";
import { FolderPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogPattern } from "@/components/editor/dialog-pattern";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/mock-projects";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (value: string) => void;
  error: string | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  roomId?: string;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  error,
  isSubmitting,
  onSubmit,
  roomId,
}: CreateProjectDialogProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      // Wait for the dialog open animation to settle before focusing.
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const previewSlug = slugify(name);
  const showPreview = previewSlug.length > 0;
  const showRoomId = roomId && roomId.length > 0;
  const canSubmit = !isSubmitting && name.trim().length > 0;

  return (
    <DialogPattern
      open={open}
      onOpenChange={onOpenChange}
      title="Create a new project"
      description="Give your project a name. You can change this later."
      className="gap-5 sm:max-w-md"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="rounded-xl gap-2"
          >
            <FolderPlus className="h-4 w-4" />
            {isSubmitting ? "Creating…" : "Create project"}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) onSubmit();
        }}
      >
        <div className="flex flex-col gap-2">
          <label
            htmlFor="project-name"
            className="text-sm font-medium text-text-secondary"
          >
            Project name
          </label>
          <Input
            ref={inputRef}
            id="project-name"
            name="name"
            autoComplete="off"
            placeholder="e.g. Aurora Payments"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            disabled={isSubmitting}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error ? "project-name-error" : "project-name-slug"
            }
            className="h-11 rounded-xl border-border-default bg-bg-subtle text-text-primary placeholder:text-text-faint focus-visible:ring-accent-primary"
          />
        </div>

        <div
          id="project-name-slug"
          className="rounded-xl border border-border-default bg-bg-subtle/80 px-3 py-2.5"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">
            Room ID
          </p>
          {showPreview ? (
            <p className="mt-1 truncate font-mono text-xs text-text-muted">
              /{showRoomId ? roomId : previewSlug}
            </p>
          ) : (
            <p className="mt-1 text-xs text-text-faint">
              Appears here as you type a name.
            </p>
          )}
        </div>

        {error ? (
          <p
            id="project-name-error"
            role="alert"
            className="rounded-xl border border-state-error/30 bg-state-error/10 px-3 py-2 text-xs text-state-error"
          >
            {error}
          </p>
        ) : null}
      </form>
    </DialogPattern>
  );
}
