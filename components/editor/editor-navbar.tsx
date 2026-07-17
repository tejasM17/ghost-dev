"use client";

import { UserButton } from "@clerk/nextjs";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
}: EditorNavbarProps) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-14 shrink-0 items-center justify-between px-3 pt-3">
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-border-default bg-bg-surface/95 px-1.5 py-1.5 shadow-xl backdrop-blur-md">
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
      </div>
      <div className="pointer-events-auto flex items-center rounded-2xl border border-border-default bg-bg-surface/95 px-1.5 py-1.5 shadow-xl backdrop-blur-md">
        <UserButton
          appearance={{
            elements: {
              userButtonBox: "h-9 w-9",
              userButtonTrigger:
                "h-9 w-9 rounded-full ring-2 ring-bg-base hover:ring-border-subtle transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-accent-primary/50",
              userButtonAvatarBox: "h-full w-full rounded-full",
              userButtonAvatarImage: "h-full w-full object-cover",
            },
          }}
        />
      </div>
    </header>
  );
}
