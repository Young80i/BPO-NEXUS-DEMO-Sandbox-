import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Copy,
  History,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Check,
  Tag,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProjects } from "@/lib/projects-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ai-workspace")({
  head: () => ({
    meta: [
      { title: "JARVIS Workspace — Prompt Library | BPO Nexus" },
      {
        name: "description",
        content:
          "Prompt library, prompt versions, and generated code notes across all engineering engagements.",
      },
    ],
  }),
  component: AIWorkspacePage,
});

export interface WorkspacePrompt {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  model: "Claude" | "Lovable" | "Base44" | "GPT-4o";
  content: string;
  tag: string;
  versionsCount: number;
  updatedAt: string;
}

const AI_MODELS = ["All", "Claude", "Lovable", "Base44"] as const;

export function AIWorkspacePage() {
  const { projects } = useProjects();

  // Initial prompt library seed matching the workspace layout
  const [prompts, setPrompts] = useState<WorkspacePrompt[]>([
    {
      id: "p-1",
      title: "Untitled prompt",
      projectId: projects[0]?.id ?? "fire-dept",
      projectName: projects[0]?.name ?? "FIRE DEPT",
      model: "Claude",
      content: "Describe the task, constraints and expected output format...",
      tag: "#draft",
      versionsCount: 1,
      updatedAt: "2026-07-29",
    },
    {
      id: "p-2",
      title: "Untitled prompt",
      projectId: projects[0]?.id ?? "fire-dept",
      projectName: projects[0]?.name ?? "FIRE DEPT",
      model: "Claude",
      content: "Describe the task, constraints and expected output format...",
      tag: "#draft",
      versionsCount: 1,
      updatedAt: "2026-07-29",
    },
    {
      id: "p-3",
      title: "Untitled prompt",
      projectId: projects[0]?.id ?? "fire-dept",
      projectName: projects[0]?.name ?? "FIRE DEPT",
      model: "Claude",
      content: "Describe the task, constraints and expected output format...",
      tag: "#draft",
      versionsCount: 1,
      updatedAt: "2026-07-29",
    },
  ]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("All");
  const [selectedModel, setSelectedModel] = useState<string>("All");

  // New Prompt Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newModel, setNewModel] = useState<WorkspacePrompt["model"]>("Claude");
  const [newProjectId, setNewProjectId] = useState<string>(projects[0]?.id ?? "");

  // Filtered prompts computed in real time
  const filteredPrompts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return prompts.filter((p) => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tag.toLowerCase().includes(q) ||
        p.projectName.toLowerCase().includes(q);

      const matchesProject =
        selectedProject === "All" ||
        p.projectName.toLowerCase() === selectedProject.toLowerCase() ||
        p.projectId === selectedProject;

      const matchesModel =
        selectedModel === "All" || p.model === selectedModel;

      return matchesSearch && matchesProject && matchesModel;
    });
  }, [prompts, searchQuery, selectedProject, selectedModel]);

  // Copy Prompt handler
  const copyPrompt = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Prompt copied to clipboard!");
  };

  // Update prompt card text directly
  const updatePromptContent = (id: string, text: string) => {
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, content: text } : p))
    );
  };

  // Update prompt card title directly
  const updatePromptTitle = (id: string, title: string) => {
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, title } : p))
    );
  };

  // Bump version count
  const incrementVersion = (id: string) => {
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, versionsCount: p.versionsCount + 1 } : p
      )
    );
    toast.info("Prompt version snapshot created!");
  };

  // Delete Prompt
  const deletePrompt = (id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Prompt removed from library");
  };

  // Handle New Prompt Creation
  const handleCreatePrompt = () => {
    if (!newTitle.trim()) return toast.error("Please enter a prompt title");

    const targetProject = projects.find((p) => p.id === newProjectId);
    const today = new Date().toISOString().split("T")[0];

    const newPromptItem: WorkspacePrompt = {
      id: `p-${Date.now()}`,
      title: newTitle.trim(),
      projectId: newProjectId,
      projectName: targetProject?.name ?? "FIRE DEPT",
      model: newModel,
      content: newContent || "Describe the task, constraints and expected output format...",
      tag: "#draft",
      versionsCount: 1,
      updatedAt: today,
    };

    setPrompts([newPromptItem, ...prompts]);
    setIsModalOpen(false);
    setNewTitle("");
    setNewContent("");
    toast.success("New prompt added to JARVIS Workspace!");
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="JARVIS Workspace"
        description="Prompt library, versions and generated code notes for every engagement"
        actions={
          <Button size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" /> New prompt
          </Button>
        }
      />

      {/* Search & Model Filter Bar */}
      <div className="surface-card flex flex-wrap items-center gap-3 p-3 md:p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts, tags or content..."
            className="h-9 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
        </div>

        {/* Project Dropdown Filter */}
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface-2 px-3 text-sm font-semibold outline-none focus:border-primary/50"
        >
          <option value="All">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Model Tabs Filter */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 p-1">
          {AI_MODELS.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedModel(m)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                selectedModel === m
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* DRAFTS Header & Pill Count */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Drafts
        </span>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[0.7rem] font-bold text-muted-foreground border border-border">
          {filteredPrompts.length}
        </span>
      </div>

      {/* Prompt Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredPrompts.map((p) => (
          <div
            key={p.id}
            className="group surface-card flex flex-col justify-between p-4 space-y-3 hover:border-primary/30 transition-all"
          >
            <div>
              {/* Header: Title & Model Pill */}
              <div className="flex items-start justify-between gap-2">
                <input
                  value={p.title}
                  onChange={(e) => updatePromptTitle(p.id, e.target.value)}
                  className="bg-transparent text-sm font-bold text-foreground outline-none border-b border-transparent hover:border-border focus:border-primary/50 w-full"
                />
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[0.68rem] font-bold text-amber-500 border border-amber-500/20 shrink-0">
                  {p.model}
                </span>
              </div>

              {/* Meta: Project Name & Date */}
              <p className="mt-1 text-[0.75rem] font-medium text-muted-foreground">
                {p.projectName} · updated {p.updatedAt}
              </p>

              {/* Prompt Textarea */}
              <textarea
                value={p.content}
                onChange={(e) => updatePromptContent(p.id, e.target.value)}
                rows={3}
                className="mt-3 w-full rounded-lg border border-border bg-surface-2/60 p-3 font-mono text-xs leading-relaxed text-foreground/90 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Footer Actions & Tags */}
            <div className="flex items-center justify-between pt-2">
              <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-muted-foreground bg-surface-2 px-2 py-0.5 rounded border border-border">
                <Tag className="h-3 w-3" />
                {p.tag}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => deletePrompt(p.id)}
                  className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                  title="Delete prompt"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs gap-1.5"
                  onClick={() => copyPrompt(p.content)}
                >
                  <Copy className="h-3 w-3" /> Copy
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs gap-1.5"
                  onClick={() => incrementVersion(p.id)}
                >
                  <History className="h-3 w-3" /> {p.versionsCount} versions
                </Button>
              </div>
            </div>
          </div>
        ))}

        {filteredPrompts.length === 0 && (
          <div className="col-span-full surface-card grid place-items-center py-12 text-sm text-muted-foreground">
            No prompts found. Click "+ New prompt" above to build one!
          </div>
        )}
      </div>

      {/* New Prompt Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Create New AI Prompt
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Prompt Title
              </label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Supabase RLS Policy Generator"
                className="w-full rounded-lg border border-border bg-surface-2 p-2.5 text-sm outline-none focus:border-primary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Target Project
                </label>
                <select
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-2 p-2 text-sm outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  AI Model
                </label>
                <select
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value as WorkspacePrompt["model"])}
                  className="w-full rounded-lg border border-border bg-surface-2 p-2 text-sm outline-none"
                >
                  <option value="Claude">Claude</option>
                  <option value="Lovable">Lovable</option>
                  <option value="Base44">Base44</option>
                  <option value="GPT-4o">GPT-4o</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Prompt Template Content
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={4}
                placeholder="Describe the task, constraints, and expected code output format..."
                className="w-full rounded-lg border border-border bg-surface-2 p-3 font-mono text-xs outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePrompt}>Save Prompt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}