"use client";

import * as React from "react";

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
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  error,
  isSubmitting,
  onSubmit,
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

  return (
    <DialogPattern
      open={open}
      onOpenChange={onOpenChange}
      title="Create a new project"
      description="Give your project a name. You can change this later."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || name.trim().length === 0}
          >
            {isSubmitting ? "Creating…" : "Create project"}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
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
          aria-describedby={error ? "project-name-error" : "project-name-slug"}
        />
        {showPreview ? (
          <p
            id="project-name-slug"
            className="font-mono text-xs text-text-muted"
          >
            <span className="text-text-faint">Slug:</span> /{previewSlug}
          </p>
        ) : (
          <p id="project-name-slug" className="text-xs text-text-faint">
            Slug will appear here as you type.
          </p>
        )}
        {error ? (
          <p
            id="project-name-error"
            role="alert"
            className="text-xs text-state-error"
          >
            {error}
          </p>
        ) : null}
      </form>
    </DialogPattern>
  );
}
