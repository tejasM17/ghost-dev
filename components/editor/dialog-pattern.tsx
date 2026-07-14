"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DialogPatternProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function DialogPattern({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: DialogPatternProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "rounded-3xl border-border-default bg-bg-elevated text-text-primary shadow-2xl",
          className,
        )}
      >
        <DialogHeader className="space-y-1.5 text-left">
          <DialogTitle className="text-lg font-semibold leading-none tracking-tight text-text-primary">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-sm text-text-muted">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {children ? <div className="text-sm text-text-secondary">{children}</div> : null}

        {footer ? (
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2 sm:space-x-0">
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
