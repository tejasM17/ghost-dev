"use client";

import { Button } from "@/components/ui/button";
import { DialogPattern } from "@/components/editor/dialog-pattern";

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  projectName,
  isSubmitting,
  onConfirm,
}: DeleteProjectDialogProps) {
  return (
    <DialogPattern
      open={open}
      onOpenChange={onOpenChange}
      title="Delete project"
      description={`This will permanently delete "${projectName}". This action cannot be undone.`}
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
            variant="destructive"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Deleting…" : "Delete project"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-secondary">
        Type-safe confirmation will be added once persistence is wired. For
        now, clicking the button removes the project from this editor session.
      </p>
    </DialogPattern>
  );
}
