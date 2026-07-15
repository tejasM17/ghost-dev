"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { DialogPattern } from "@/components/editor/dialog-pattern";
import { Input } from "@/components/ui/input";

interface RenameProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  name: string;
  onNameChange: (value: string) => void;
  error: string | null;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function RenameProjectDialog({
  open,
  onOpenChange,
  currentName,
  name,
  onNameChange,
  error,
  isSubmitting,
  onSubmit,
}: RenameProjectDialogProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      // Wait for the dialog open animation to settle, then focus and select
      // the existing name so the user can immediately retype.
      const id = window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  return (
    <DialogPattern
      open={open}
      onOpenChange={onOpenChange}
      title="Rename project"
      description={`Currently named "${currentName}".`}
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
            {isSubmitting ? "Saving…" : "Save changes"}
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
          htmlFor="project-rename-name"
          className="text-sm font-medium text-text-secondary"
        >
          Project name
        </label>
        <Input
          ref={inputRef}
          id="project-rename-name"
          name="name"
          autoComplete="off"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          disabled={isSubmitting}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "project-rename-error" : undefined}
        />
        {error ? (
          <p
            id="project-rename-error"
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
