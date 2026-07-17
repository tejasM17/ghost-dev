"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import ReactMarkdown from "react-markdown";
import { Download, FileText, Loader2 } from "lucide-react";

import { useAiChatFeed } from "@/components/editor/ai-chat-feed";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectSpecItem {
  id: string;
  createdAt: string;
  filename: string;
}

interface SpecsTabProps {
  projectId?: string;
  /** Liveblocks room id (project id). Required to generate a spec. */
  roomId?: string;
  /**
   * When true, SpecsTab is under RoomProvider and can read chat + trigger
   * generation. When false, list/download only.
   */
  roomConnected?: boolean;
}

/** Trigger.dev run statuses that mean the subscription should end. */
const TERMINAL_RUN_STATUSES = new Set([
  "COMPLETED",
  "CANCELED",
  "FAILED",
  "CRASHED",
  "SYSTEM_FAILURE",
  "EXPIRED",
  "TIMED_OUT",
]);

function formatCreatedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * Specs tab: list project specs, generate from the live canvas, preview
 * Markdown in a modal, download via API.
 * Content is fetched only while previewing — not kept in long-lived state.
 */
export function SpecsTab({
  projectId,
  roomId,
  roomConnected = false,
}: SpecsTabProps) {
  if (roomConnected && roomId && projectId) {
    return <RoomAwareSpecsTab projectId={projectId} roomId={roomId} />;
  }

  return (
    <SpecsListPanel
      projectId={projectId}
      canGenerate={false}
      isGenerating={false}
      generateError={
        projectId
          ? "Connect to the project room to generate a specification."
          : null
      }
      generateStatus={null}
      onGenerate={undefined}
    />
  );
}

/**
 * Spec generation + list under Liveblocks room (chat history + room id).
 * Uses Trigger.dev `useRealtimeRun` for progress (same pattern as design).
 */
function RoomAwareSpecsTab({
  projectId,
  roomId,
}: {
  projectId: string;
  roomId: string;
}) {
  const { messages } = useAiChatFeed();

  const [runId, setRunId] = useState<string | undefined>(undefined);
  const [publicToken, setPublicToken] = useState<string | undefined>(
    undefined,
  );
  const [isStarting, setIsStarting] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateStatus, setGenerateStatus] = useState<string | null>(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const completionHandledRef = useRef<string | null>(null);

  const clearRunState = useCallback(() => {
    setRunId(undefined);
    setPublicToken(undefined);
    setIsStarting(false);
  }, []);

  const { run, error: runError } = useRealtimeRun(runId, {
    accessToken: publicToken,
    enabled: Boolean(runId && publicToken),
    skipColumns: ["payload", "output"],
    onComplete: (completedRun, err) => {
      if (
        !completedRun?.id ||
        completionHandledRef.current === completedRun.id
      ) {
        return;
      }
      completionHandledRef.current = completedRun.id;

      const failed =
        Boolean(err) ||
        (completedRun.status &&
          completedRun.status !== "COMPLETED" &&
          TERMINAL_RUN_STATUSES.has(completedRun.status));

      if (failed) {
        const detail =
          err?.message ||
          (typeof completedRun.status === "string"
            ? `Run ${completedRun.status.toLowerCase().replaceAll("_", " ")}`
            : "Spec generation failed");
        setGenerateError(detail);
        setGenerateStatus(null);
      } else {
        setGenerateError(null);
        setGenerateStatus("Specification ready.");
        setListRefreshKey((k) => k + 1);
      }
      clearRunState();
    },
  });

  // Surface subscription errors once per run.
  useEffect(() => {
    if (!runError || !runId) return;
    if (completionHandledRef.current === `err:${runId}`) return;
    completionHandledRef.current = `err:${runId}`;
    setGenerateError(`Couldn’t track spec run: ${runError.message}`);
    setGenerateStatus(null);
    clearRunState();
  }, [runError, runId, clearRunState]);

  // Reflect run metadata messages while active.
  useEffect(() => {
    if (!run || !runId) return;
    const message =
      typeof run.metadata?.message === "string"
        ? run.metadata.message
        : null;
    if (message) {
      setGenerateStatus(message);
    }
  }, [run, runId]);

  const runIsTerminal =
    run?.status !== undefined && TERMINAL_RUN_STATUSES.has(run.status);
  const isGenerating =
    isStarting || Boolean(runId && publicToken && !runIsTerminal);

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;

    setGenerateError(null);
    setGenerateStatus("Preparing specification…");
    setIsStarting(true);
    completionHandledRef.current = null;

    try {
      // Prefer saved canvas snapshot for the API contract; the Trigger task
      // re-reads the live Liveblocks room as the source of truth.
      let nodes: unknown[] = [];
      let edges: unknown[] = [];
      try {
        const canvasRes = await fetch(
          `/api/projects/${projectId}/canvas`,
          { cache: "no-store" },
        );
        if (canvasRes.ok) {
          const canvasBody: unknown = await canvasRes.json().catch(() => null);
          if (canvasBody && typeof canvasBody === "object") {
            const record = canvasBody as {
              nodes?: unknown;
              edges?: unknown;
            };
            if (Array.isArray(record.nodes)) nodes = record.nodes;
            if (Array.isArray(record.edges)) edges = record.edges;
          }
        }
      } catch {
        // Liveblocks snapshot inside the task still covers the graph.
      }

      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
        sender: m.sender,
        timestamp: m.timestamp,
      }));

      const specRes = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          chatHistory,
          nodes,
          edges,
        }),
      });

      const specBody: unknown = await specRes.json().catch(() => null);

      if (!specRes.ok) {
        setGenerateError(
          extractApiError(specBody, "Couldn’t start spec generation."),
        );
        setGenerateStatus(null);
        clearRunState();
        return;
      }

      const parsed = parseRunIdResponse(specBody);
      if (!parsed) {
        setGenerateError("Invalid response from spec API.");
        setGenerateStatus(null);
        clearRunState();
        return;
      }

      const tokenRes = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: parsed.runId }),
      });
      const tokenBody: unknown = await tokenRes.json().catch(() => null);
      if (!tokenRes.ok) {
        setGenerateError(
          extractApiError(tokenBody, "Couldn’t authorize run tracking."),
        );
        setGenerateStatus(null);
        clearRunState();
        return;
      }

      const token = parseTokenResponse(tokenBody);
      if (!token) {
        setGenerateError("Invalid token response from spec API.");
        setGenerateStatus(null);
        clearRunState();
        return;
      }

      setRunId(parsed.runId);
      setPublicToken(token);
      setIsStarting(false);
      setGenerateStatus("Generating technical specification…");
    } catch {
      setGenerateError("Network error while starting spec generation.");
      setGenerateStatus(null);
      clearRunState();
    }
  }, [
    isGenerating,
    projectId,
    roomId,
    messages,
    clearRunState,
  ]);

  return (
    <SpecsListPanel
      projectId={projectId}
      refreshKey={listRefreshKey}
      canGenerate
      isGenerating={isGenerating}
      generateError={generateError}
      generateStatus={isGenerating || generateStatus ? generateStatus : null}
      onGenerate={() => {
        void handleGenerate();
      }}
    />
  );
}

interface SpecsListPanelProps {
  projectId?: string;
  refreshKey?: number;
  canGenerate: boolean;
  isGenerating: boolean;
  generateError: string | null;
  generateStatus: string | null;
  onGenerate?: () => void;
}

function SpecsListPanel({
  projectId,
  refreshKey = 0,
  canGenerate,
  isGenerating,
  generateError,
  generateStatus,
  onGenerate,
}: SpecsListPanelProps) {
  const [specs, setSpecs] = useState<ProjectSpecItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [selected, setSelected] = useState<ProjectSpecItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const loadSpecs = useCallback(async (id: string) => {
    setListLoading(true);
    setListError(null);
    try {
      const response = await fetch(`/api/projects/${id}/specs`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to load specs");
      }
      const data = (await response.json()) as { specs: ProjectSpecItem[] };
      setSpecs(Array.isArray(data.specs) ? data.specs : []);
    } catch (err) {
      setSpecs([]);
      setListError(err instanceof Error ? err.message : "Failed to load specs");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!projectId) {
      setSpecs([]);
      setListError(null);
      return;
    }
    void loadSpecs(projectId);
  }, [projectId, loadSpecs, refreshKey]);

  const openPreview = useCallback(
    async (spec: ProjectSpecItem) => {
      if (!projectId) return;
      setSelected(spec);
      setPreviewOpen(true);
      setPreviewContent(null);
      setPreviewError(null);
      setPreviewLoading(true);

      try {
        // Content via download route — never read Blob URLs from the client.
        const response = await fetch(
          `/api/projects/${projectId}/specs/${spec.id}/download`,
        );
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(data?.error ?? "Failed to load spec content");
        }
        const text = await response.text();
        setPreviewContent(text);
      } catch (err) {
        setPreviewError(
          err instanceof Error ? err.message : "Failed to load spec content",
        );
      } finally {
        setPreviewLoading(false);
      }
    },
    [projectId],
  );

  const closePreview = useCallback((open: boolean) => {
    setPreviewOpen(open);
    if (!open) {
      // Drop content when closed — no long-term frontend storage.
      setSelected(null);
      setPreviewContent(null);
      setPreviewError(null);
      setPreviewLoading(false);
    }
  }, []);

  const triggerDownload = useCallback(
    (spec: ProjectSpecItem) => {
      if (!projectId) return;
      // Let the browser handle the attachment response.
      const a = document.createElement("a");
      a.href = `/api/projects/${projectId}/specs/${spec.id}/download`;
      a.download = spec.filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    [projectId],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      <Button
        type="button"
        disabled={!canGenerate || isGenerating || !projectId}
        aria-busy={isGenerating}
        className="w-full shrink-0 rounded-xl bg-accent-ai text-white hover:bg-accent-ai/90 disabled:opacity-50"
        onClick={onGenerate}
      >
        {isGenerating ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating…
          </span>
        ) : (
          "Generate Spec"
        )}
      </Button>

      {generateStatus ? (
        <p
          className="rounded-xl border border-border-default bg-bg-elevated px-3 py-2 text-xs text-text-secondary"
          aria-live="polite"
        >
          {generateStatus}
        </p>
      ) : null}

      {generateError ? (
        <p className="text-xs text-state-error" role="alert">
          {generateError}
        </p>
      ) : null}

      {!projectId ? (
        <p className="text-xs text-text-muted">
          Open a project to view generated specs.
        </p>
      ) : listLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading specs…</span>
        </div>
      ) : listError ? (
        <div className="rounded-2xl border border-border-default bg-bg-elevated p-3">
          <p className="text-xs text-state-error">{listError}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2 rounded-xl border-border-default text-text-secondary"
            onClick={() => void loadSpecs(projectId)}
          >
            Retry
          </Button>
        </div>
      ) : specs.length === 0 ? (
        <p className="text-xs leading-relaxed text-text-muted">
          No specs yet. Generate a technical specification from your canvas to
          see it here.
        </p>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <ul className="flex flex-col gap-1.5 pr-2">
            {specs.map((spec) => (
              <li key={spec.id}>
                <div className="group flex items-center gap-1 rounded-xl border border-border-default bg-bg-elevated transition-colors hover:border-border-subtle">
                  <button
                    type="button"
                    onClick={() => void openPreview(spec)}
                    className="flex min-w-0 flex-1 items-start gap-2.5 px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-subtle"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg-subtle">
                      <FileText className="h-3.5 w-3.5 text-accent-ai-text" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-text-primary">
                        {spec.filename}
                      </p>
                      <p className="mt-0.5 text-[11px] text-text-muted">
                        {formatCreatedAt(spec.createdAt)}
                      </p>
                    </div>
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Download ${spec.filename}`}
                    className="mr-1.5 h-8 w-8 shrink-0 rounded-lg p-0 text-text-muted hover:bg-bg-subtle hover:text-text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerDownload(spec);
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}

      <Dialog open={previewOpen} onOpenChange={closePreview}>
        <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-3 overflow-hidden rounded-3xl border-border-default bg-bg-surface p-0 text-text-primary sm:rounded-3xl">
          <DialogHeader className="shrink-0 space-y-1 border-b border-border-default px-6 pb-3 pt-6 pr-12 text-left">
            <DialogTitle className="truncate text-base text-text-primary">
              {selected?.filename ?? "Spec preview"}
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted">
              {selected
                ? `Created ${formatCreatedAt(selected.createdAt)}`
                : "Generated Markdown specification"}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 px-6">
            {previewLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading content…</span>
              </div>
            ) : previewError ? (
              <p className="py-6 text-sm text-state-error">{previewError}</p>
            ) : (
              <ScrollArea className="h-[min(55vh,28rem)] pr-3">
                <article className="prose-spec pb-4 text-sm leading-relaxed text-text-secondary">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="mb-3 mt-4 text-lg font-semibold text-text-primary first:mt-0">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="mb-2 mt-4 text-base font-semibold text-text-primary">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mb-2 mt-3 text-sm font-semibold text-text-primary">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-2 text-sm text-text-secondary">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-2 list-decimal space-y-1 pl-5 text-sm text-text-secondary">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-sm text-text-secondary">
                          {children}
                        </li>
                      ),
                      code: ({ className, children }) => {
                        const isBlock = Boolean(className);
                        if (isBlock) {
                          return (
                            <code className="font-mono text-xs text-text-primary">
                              {children}
                            </code>
                          );
                        }
                        return (
                          <code className="rounded-md bg-bg-subtle px-1 py-0.5 font-mono text-xs text-accent-ai-text">
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children }) => (
                        <pre className="mb-3 overflow-x-auto rounded-xl border border-border-default bg-bg-elevated p-3 font-mono text-xs text-text-primary">
                          {children}
                        </pre>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          className="text-accent-primary underline-offset-2 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {children}
                        </a>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-text-primary">
                          {children}
                        </strong>
                      ),
                      hr: () => (
                        <hr className="my-4 border-border-default" />
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="mb-2 border-l-2 border-border-subtle pl-3 text-text-muted">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {previewContent ?? ""}
                  </ReactMarkdown>
                </article>
              </ScrollArea>
            )}
          </div>

          <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border-default px-6 py-4 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-border-default text-text-secondary"
              onClick={() => closePreview(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              disabled={!selected || previewLoading}
              className="gap-1.5 rounded-xl bg-accent-ai text-white hover:bg-accent-ai/90"
              onClick={() => {
                if (selected) triggerDownload(selected);
              }}
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function parseRunIdResponse(body: unknown): { runId: string } | null {
  if (body === null || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (typeof record.runId !== "string" || record.runId.trim().length === 0) {
    return null;
  }
  return { runId: record.runId.trim() };
}

function parseTokenResponse(body: unknown): string | null {
  if (body === null || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (typeof record.token === "string" && record.token.trim()) {
    return record.token.trim();
  }
  if (typeof record.publicToken === "string" && record.publicToken.trim()) {
    return record.publicToken.trim();
  }
  return null;
}

function extractApiError(body: unknown, fallback: string): string {
  if (body !== null && typeof body === "object") {
    const error = (body as Record<string, unknown>).error;
    if (typeof error === "string" && error.trim()) return error.trim();
  }
  return fallback;
}
