"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import {
  Bot,
  Download,
  FileText,
  Send,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Floating AI Workspace sidebar. Open/close is controlled by the parent;
 * this component owns only the internal chat UI shell (no backend / Liveblocks).
 */
export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(Math.max(el.scrollHeight, 72), 160);
    el.style.height = `${next}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
      },
    ]);
    setInput("");
  }, [input]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const applyStarter = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

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
          "fixed inset-0 z-30 bg-bg-base/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out md:hidden",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />
      <aside
        aria-hidden={!isOpen}
        aria-label="AI Workspace"
        className={cn(
          "pointer-events-none fixed right-3 top-16 z-40 flex h-[calc(100vh-5rem)] w-80 flex-col overflow-hidden rounded-2xl border border-border-default bg-bg-surface/95 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-in-out",
          isOpen
            ? "translate-x-0 pointer-events-auto"
            : "translate-x-[calc(100%+1.5rem)]",
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border-default px-4 py-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-bg-subtle">
              <Bot className="h-4 w-4 text-accent-ai-text" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-text-primary">
                AI Workspace
              </h2>
              <p className="text-xs text-text-muted">
                Collaborate with Ghost AI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI chat"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-subtle"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue="architect"
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="shrink-0 border-b border-border-default px-3 py-2">
            <TabsList className="grid h-9 w-full grid-cols-2 rounded-xl bg-bg-subtle p-1 text-text-muted">
              <TabsTrigger
                value="architect"
                className="rounded-lg text-xs text-text-muted data-[state=active]:bg-accent-ai data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                AI Architect
              </TabsTrigger>
              <TabsTrigger
                value="specs"
                className="rounded-lg text-xs text-text-muted data-[state=active]:bg-accent-ai data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                Specs
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="architect"
            className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
          >
            <ArchitectTab
              messages={messages}
              input={input}
              textareaRef={textareaRef}
              onInputChange={setInput}
              onKeyDown={handleKeyDown}
              onSend={handleSend}
              onStarter={applyStarter}
            />
          </TabsContent>

          <TabsContent
            value="specs"
            className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
          >
            <SpecsTab />
          </TabsContent>
        </Tabs>
      </aside>
    </>
  );
}

interface ArchitectTabProps {
  messages: ChatMessage[];
  input: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onStarter: (prompt: string) => void;
}

function ArchitectTab({
  messages,
  input,
  textareaRef,
  onInputChange,
  onKeyDown,
  onSend,
  onStarter,
}: ArchitectTabProps) {
  const isEmpty = messages.length === 0;

  return (
    <>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 p-4">
          {isEmpty ? (
            <EmptyArchitectState onStarter={onStarter} />
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  message.role === "user"
                    ? "ml-auto border-2 border-accent-primary/50 bg-accent-primary-dim text-text-primary"
                    : "mr-auto border border-border-default bg-bg-elevated text-accent-ai-text",
                )}
              >
                {message.content}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-border-default p-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Describe the architecture you want…"
            rows={2}
            className="min-h-[72px] max-h-[160px] flex-1 resize-none overflow-y-auto rounded-xl border-border-default bg-bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-faint focus-visible:ring-accent-ai"
          />
          <Button
            type="button"
            size="icon"
            onClick={onSend}
            disabled={!input.trim()}
            aria-label="Send message"
            className="h-10 w-10 shrink-0 rounded-xl bg-accent-ai text-white hover:bg-accent-ai/90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1.5 px-0.5 text-[10px] text-text-faint">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </>
  );
}

function EmptyArchitectState({
  onStarter,
}: {
  onStarter: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-subtle">
        <Bot className="h-6 w-6 text-accent-ai-text" />
      </div>
      <div className="flex flex-col gap-1.5 px-2">
        <p className="text-sm font-medium text-text-primary">
          Start an architecture session
        </p>
        <p className="text-xs leading-relaxed text-text-muted">
          Describe a system and Ghost AI will help map it onto the canvas.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onStarter(prompt)}
            className="rounded-full bg-bg-subtle px-3 py-2 text-left text-xs text-accent-ai-text transition-colors hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-subtle"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function SpecsTab() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
      <Button
        type="button"
        className="w-full rounded-xl bg-accent-ai text-white hover:bg-accent-ai/90"
      >
        Generate Spec
      </Button>

      <div className="rounded-2xl border border-border-default bg-bg-elevated p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg-subtle">
            <FileText className="h-4 w-4 text-accent-ai-text" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-text-primary">
              System Architecture Spec
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              Demo export — a generated markdown overview of services,
              data stores, and integration points will appear here.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled
              className="mt-3 gap-1.5 rounded-xl border-border-default text-text-muted"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
