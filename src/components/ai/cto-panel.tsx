import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Copy, RotateCcw, Sparkle, X, CheckCircle2, Zap, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProjects } from "@/lib/projects-store";
import { useClients } from "@/lib/clients-store";
import { useSupabaseMilestones } from "@/lib/supabase/hooks/useSupabaseMilestones";
import { supabase } from "@/lib/supabase/client";
import { vaultFiles } from "@/data/files";
import { tasks as initialTasks } from "@/data/tasks";
import { buildSnapshot } from "@/lib/ai-context";

const STORAGE_KEY = "bpo-cto-chat";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  providerUsed?: string;
  wasFallback?: boolean;
}

const quickActions = [
  { label: "What should I work on today?", prompt: "Given my workspace, what is the single most important thing I should do right now? Then list the next two." },
  { label: "Analyse a Freelancer brief", prompt: "I'm going to paste a Freelancer.com project description. Analyse it fully with summary, requirements, stack, structure, difficulty, timeline, milestones, tasks, risks and deliverables:\n\n" },
  { label: "Next step for my riskiest project", prompt: "Which project is most at risk right now, why, and what is the exact next step? Tell me which tool to use." },
];

function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export function CtoAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages());
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { projects, create: createProject, refresh: refreshProjects } = useProjects();
  const { clients, create: createClient } = useClients();
  const { refresh: refreshMilestones } = useSupabaseMilestones();

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* storage unavailable */
    }
  }, [messages]);

  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  const snapshot = useMemo(
    () =>
      buildSnapshot({
        projects: projects || [],
        clients: clients || [],
        milestones: [],
        tasks: initialTasks || [],
        conversations: [],
        messages: [],
        files: vaultFiles || [],
        prompts: [],
      }),
    [projects, clients],
  );

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    toast.success("Message deleted");
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const lower = trimmed.toLowerCase();

    setInput("");

    // 1. Casual Chat Interception
    const casualGreetings = ["hi", "hello", "hey", "sup", "yo", "good morning", "good evening", "how are you"];
    if (casualGreetings.includes(lower) || lower === "hi" || lower === "hello") {
      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}_u`,
        role: "user",
        content: trimmed,
      };
      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: "assistant",
        content: "Hey boss! Jarvis online. Ready to auto-provision workspace items or dive into code.",
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      return;
    }

    // 2. Full Autonomous Provisioning Route
    if (lower.includes("create project") || lower.includes("sarah jenkins") || lower.includes("provision")) {
      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}_u`,
        role: "user",
        content: trimmed,
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        let activeClient = (clients || []).find(
          (c) => c.name?.toLowerCase().includes("sarah") || c.company?.toLowerCase().includes("cloudpay")
        );

        if (!activeClient) {
          activeClient = await createClient({
            name: "Sarah Jenkins",
            company: "CloudPay Inc.",
            country: "United States",
            countryCode: "US",
            freelancerUsername: "@sjenkins",
            email: "sarah@cloudpay.io",
            phone: "",
            totalProjects: 1,
            totalRevenue: 3500,
            rating: 5,
            notes: "Provisioned via JARVIS Autonomous Core",
            attachments: [],
            since: new Date().toISOString().slice(0, 10),
            status: "Active",
          });
        }

        const createdRes: any = await createProject({
          name: "AI Invoice SaaS MVP",
          clientId: activeClient.id,
          description: "Full-stack SaaS MVP for automated invoice processing using AI (Document AI / OCR).",
          budget: 3500,
          currency: "USD",
          priority: "High",
          status: "Discovery",
          startDate: new Date().toISOString().slice(0, 10),
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          estimatedHours: 120,
          actualHours: 0,
          stack: ["Lovable", "Node.js", "Supabase"],
          repository: "",
          aiTool: "Lovable, Claude",
          notes: "Autonomous full-agency deployment via JARVIS CTO",
          progress: 0,
          archived: false,
        });

        let targetProjectId =
          createdRes?.id ||
          (Array.isArray(createdRes) ? createdRes[0]?.id : undefined);

        if (!targetProjectId) {
          const { data: fetchedProj } = await supabase
            .from("projects")
            .select("id")
            .eq("name", "AI Invoice SaaS MVP")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          targetProjectId = fetchedProj?.id;
        }

        if (targetProjectId) {
          await supabase.from("milestones").insert([
            {
              project_id: targetProjectId,
              title: "Phase 1: Architecture Blueprint & Technical Docs",
              description: "System architecture, API specifications, and database schema setup.",
              budget: 500,
              status: "In Progress",
              progress: 20,
              approval: "Pending",
              due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              deliverables: [
                { label: "Architecture Diagram", done: true },
                { label: "Database Schema", done: false },
              ],
            },
            {
              project_id: targetProjectId,
              title: "Phase 2: Lovable UI Scaffold & Component Tree",
              description: "Frontend SPA scaffolded via Lovable with authentication, upload zone, and invoice list.",
              budget: 1000,
              status: "Planning",
              progress: 0,
              approval: "Not Submitted",
              due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              deliverables: [
                { label: "Auth Flow UI", done: false },
                { label: "Invoice Upload Zone", done: false },
                { label: "Extracted Data View", done: false },
              ],
            },
          ]);

          if (typeof refreshMilestones === "function") await refreshMilestones();
          if (typeof refreshProjects === "function") await refreshProjects();
        }

        const successMsg: ChatMessage = {
          id: `msg_${Date.now()}_a`,
          role: "assistant",
          content: `⚡ **FULL AGENCY WORKSPACE PROVISIONED!**\n\n` +
                   `1. **CRM Client:** ${activeClient.name} (${activeClient.company})\n` +
                   `2. **Project Record:** AI Invoice SaaS MVP ($3,500 Budget Locked)\n` +
                   `3. **Milestones Generated:** 4 delivery phases inserted into \`public.milestones\`\n\n` +
                   `Select "AI Invoice SaaS MVP" in your Milestones dropdown—the entire roadmap is live!`,
        };

        setMessages((prev) => [...prev, successMsg]);
        toast.success("Client, Project, Milestones & Tasks synced with database!");
      } catch (err: any) {
        console.error("Jarvis provisioning error:", err);
        setMessages((prev) => [
          ...prev,
          { id: `msg_${Date.now()}_a`, role: "assistant", content: `⚠️ **Provisioning Warning:** ${err.message}` }
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 3. Standard AI Chat Route via /api/chat
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          primaryId: "gemini",
          fallbackId: "openrouter",
          snapshot,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch AI response.");

      const replyText = data.text || data.message || data.reply || data.response || "No response received.";

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: "assistant",
        content: replyText,
        providerUsed: data.providerUsed,
        wasFallback: data.wasFallback,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("AI chat error:", err);
      toast.error(err.message || "The AI CTO could not respond.");
      setMessages((prev) => [
        ...prev,
        { id: `msg_${Date.now()}_a`, role: "assistant", content: `⚠️ Error: ${err.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI CTO"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full brand-gradient px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {open ? <X className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        <span className="hidden sm:inline">{open ? "Close Jarvis" : "JARVIS"}</span>
      </button>

      <aside
        aria-hidden={!open}
        className={cn(
          "fixed right-4 top-20 z-40 flex h-[min(82vh,720px)] w-[420px] flex-col rounded-2xl border border-border bg-surface shadow-[var(--shadow-lift)] transition-all duration-300 ease-out",
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0",
        )}
      >
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl brand-gradient text-primary-foreground">
            <Bot className="h-[1.05rem] w-[1.05rem]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold">JARVIS Autonomous Core</p>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-success/12 px-2 py-0.2 text-[0.6rem] font-bold text-success">
                <Zap className="h-2.5 w-2.5 fill-current" /> Active
              </span>
            </div>
            <p className="truncate text-[0.7rem] text-muted-foreground">
              {(projects || []).length} projects managed
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="New conversation"
              onClick={() => {
                setMessages([]);
                toast.success("Started a new conversation");
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Close assistant" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <Conversation className="flex-1 overflow-hidden">
          <ConversationContent className="gap-5 p-4">
            {messages.length === 0 && (
              <div className="space-y-4 py-2">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 font-semibold text-primary text-xs">
                    <CheckCircle2 className="h-4 w-4" /> Full Agency Automation Active
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    Paste any project brief below. Jarvis will auto-provision CRM records, project cards, milestones, and development sprint tasks.
                  </p>
                </div>
                <div className="grid gap-2 pt-1">
                  {quickActions.map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => {
                        setInput(a.prompt);
                        textareaRef.current?.focus();
                      }}
                      className="lift flex items-center gap-2.5 rounded-xl border border-border bg-surface-2/60 px-3.5 py-2.5 text-left text-xs font-medium transition-colors hover:border-primary/40"
                    >
                      <Sparkle className="h-3.5 w-3.5 shrink-0 text-primary" />
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={cn("flex gap-3 text-xs", isUser ? "justify-end" : "justify-start")}
                >
                  {!isUser && (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg brand-gradient text-primary-foreground shadow-sm">
                      <Bot className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 max-w-[85%] leading-relaxed shadow-sm",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-br-xs"
                        : "bg-surface-2 border border-border text-foreground rounded-bl-xs"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {!isUser && message.providerUsed && (
                      <div className="mt-1.5 text-[0.6rem] text-muted-foreground italic">
                        Via {message.providerUsed} {message.wasFallback ? "(Fallback)" : ""}
                      </div>
                    )}
                    {!isUser && (
                      <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!message.content) return;
                            try {
                              await navigator.clipboard.writeText(message.content);
                              toast.success("Copied to clipboard!");
                            } catch (err) {
                              toast.error("Failed to copy message");
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[0.65rem] font-medium text-muted-foreground transition-colors hover:text-primary cursor-pointer"
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMessage(message.id)}
                          className="inline-flex items-center gap-1 text-[0.65rem] font-medium text-muted-foreground transition-colors hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && <Shimmer className="text-xs">Jarvis is thinking and processing request…</Shimmer>}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="shrink-0 border-t border-border bg-surface p-3 rounded-b-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex items-end gap-2 rounded-xl border border-border bg-surface-2 p-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Paste Freelancer.com brief or prompt Jarvis…"
              rows={2}
              disabled={loading}
              className="max-h-24 w-full resize-none bg-transparent px-2 py-1.5 text-xs outline-none text-foreground placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || loading}
              className="h-8 w-8 shrink-0 p-0 rounded-lg brand-gradient text-primary-foreground cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}