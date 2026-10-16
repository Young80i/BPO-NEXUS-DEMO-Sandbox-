import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Code2,
  Gauge,
  Plus,
  Save,
  CheckCircle2,
  Circle,
  Trash2,
  Layers,
  Sparkles,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ProgressBar, StatusBadge } from "@/components/badges";
import { useProjects } from "@/lib/projects-store";
import type { Project } from "@/data/demo";

export const Route = createFileRoute("/website")({
  head: () => ({
    meta: [{ title: "Website Development Track — BPO Nexus" }],
  }),
  component: WebsiteDevPage,
});

interface WebTrackItem {
  id: string;
  title: string;
  category: "Frontend" | "Backend" | "Design" | "DevOps" | "SEO";
  completed: boolean;
}

export function WebsiteDevPage() {
  const { projects, update } = useProjects();

  // Find or default to a Web Dev project
  const webProjects = useMemo(() => {
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes("web") ||
        p.name.toLowerCase().includes("site") ||
        p.aiTool?.toLowerCase().includes("web")
    );
  }, [projects]);

  const [selectedId, setSelectedId] = useState<string>(
    () => webProjects[0]?.id ?? projects[0]?.id ?? ""
  );

  const activeProject =
    projects.find((p) => p.id === selectedId) ?? webProjects[0] ?? projects[0];

  // Progress state
  const [progress, setProgress] = useState<number>(activeProject?.progress ?? 0);
  const [description, setDescription] = useState<string>(activeProject?.description ?? "");
  const [saving, setSaving] = useState(false);

  // Default Web Dev Track Milestones
  const [tracks, setTracks] = useState<WebTrackItem[]>([
    { id: "1", title: "UI/UX Figma Wireframes & Design System", category: "Design", completed: true },
    { id: "2", title: "Supabase Database Schema & RLS Policies", category: "Backend", completed: true },
    { id: "3", title: "React Component Library & Responsive Layouts", category: "Frontend", completed: false },
    { id: "4", title: "REST / GraphQL API & State Management Integration", category: "Frontend", completed: false },
    { id: "5", title: "SEO Optimization, Lighthouse Audit & Vercel Deploy", category: "DevOps", completed: false },
  ]);

  const [newTrackTitle, setNewTrackTitle] = useState("");
  const [newTrackCategory, setNewTrackCategory] = useState<WebTrackItem["category"]>("Frontend");

  // Save Progress & Description to Supabase
  const handleSaveProject = async () => {
    if (!activeProject) return toast.error("No active project selected");
    setSaving(true);
    try {
      await update(activeProject.id, {
        progress: Number(progress),
        description: description,
      });
      toast.success("Website Dev progress & status notes saved to Supabase!");
    } catch (e) {
      toast.error("Failed to update project progress");
    } finally {
      setSaving(false);
    }
  };

  // Add a new track deliverable
  const handleAddTrack = () => {
    if (!newTrackTitle.trim()) return toast.error("Enter a track item title");
    const item: WebTrackItem = {
      id: Date.now().toString(),
      title: newTrackTitle.trim(),
      category: newTrackCategory,
      completed: false,
    };
    const updated = [...tracks, item];
    setTracks(updated);
    setNewTrackTitle("");

    // Auto calculate progress percentage recommendation
    const completedCount = updated.filter((t) => t.completed).length;
    const calcProgress = Math.round((completedCount / updated.length) * 100);
    setProgress(calcProgress);
    toast.success("Added new web track deliverable!");
  };

  // Toggle track completion
  const handleToggleTrack = (id: string) => {
    const updated = tracks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTracks(updated);

    const completedCount = updated.filter((t) => t.completed).length;
    const calcProgress = Math.round((completedCount / updated.length) * 100);
    setProgress(calcProgress);
  };

  // Delete track item
  const handleDeleteTrack = (id: string) => {
    const updated = tracks.filter((t) => t.id !== id);
    setTracks(updated);
    if (updated.length > 0) {
      const completedCount = updated.filter((t) => t.completed).length;
      setProgress(Math.round((completedCount / updated.length) * 100));
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Website Development Track"
        description="Manage website builds, feature milestones, frontend architecture, and live completion scores."
      />

      {/* Project Selector & Direct Sync Header */}
      <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-primary" />
          <label className="text-xs font-semibold text-muted-foreground">Select Web Project:</label>
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              const found = projects.find((p) => p.id === e.target.value);
              if (found) {
                setProgress(found.progress ?? 0);
                setDescription(found.description ?? "");
              }
            }}
            className="h-9 rounded-lg border border-border bg-surface-2 px-3 text-sm outline-none font-medium"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.progress ?? 0}%)
              </option>
            ))}
          </select>
        </div>

        {activeProject && (
          <div className="flex items-center gap-3 text-xs">
            <StatusBadge status={activeProject.status} />
            <span className="font-mono text-muted-foreground">
              Budget: {activeProject.currency} ${activeProject.budget}
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Progress Slider & Status Editor */}
        <div className="space-y-6 lg:col-span-1">
          <section className="surface-card p-5 space-y-4">
            <header className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/12 text-primary">
                <Gauge className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold">Web Dev Completion Sync</h2>
            </header>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Completion Progress</span>
                <span className="font-mono text-primary font-bold">{progress}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) =>
                    setProgress(Math.min(100, Math.max(0, Number(e.target.value))))
                  }
                  className="w-16 rounded border border-border bg-surface-2 p-1 text-center font-mono text-xs"
                />
              </div>
              <ProgressBar value={progress} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Website Development Notes
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Log website milestone progress, tech stack updates, or client status reports..."
                className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm outline-none focus:border-primary/50"
              />
            </div>

            <Button size="sm" className="w-full gap-2" onClick={handleSaveProject} disabled={saving}>
              <Save className="h-4 w-4" /> Save to Supabase Store
            </Button>
          </section>
        </div>

        {/* Right Column: Game-Track style Web Development Feature Roadmap */}
        <div className="space-y-6 lg:col-span-2">
          <section className="surface-card p-5 space-y-5">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/12 text-primary">
                  <Layers className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold">Web Development Milestone Tracks</h2>
                  <p className="text-xs text-muted-foreground">
                    Interactive feature roadmap & deliverable checklist
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                {tracks.filter((t) => t.completed).length} / {tracks.length} Completed
              </span>
            </header>

            {/* Add New Web Track Deliverable Form */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newTrackTitle}
                onChange={(e) => setNewTrackTitle(e.target.value)}
                placeholder="Add a new feature or deliverable track (e.g. Stripe Checkout Integration)..."
                className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
              <select
                value={newTrackCategory}
                onChange={(e) => setNewTrackCategory(e.target.value as WebTrackItem["category"])}
                className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none"
              >
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Design">Design</option>
                <option value="DevOps">DevOps</option>
                <option value="SEO">SEO</option>
              </select>
              <Button size="sm" onClick={handleAddTrack} className="gap-1.5 shrink-0">
                <Plus className="h-4 w-4" /> Add Track
              </Button>
            </div>

            {/* Track List */}
            <div className="space-y-2">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
                    track.completed
                      ? "border-emerald-500/30 bg-emerald-500/5 text-muted-foreground"
                      : "border-border bg-surface-2/40 text-foreground"
                  }`}
                >
                  <button
                    onClick={() => handleToggleTrack(track.id)}
                    className="flex items-center gap-3 text-left min-w-0 flex-1"
                  >
                    {track.completed ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    <span
                      className={`text-sm font-medium truncate ${
                        track.completed ? "line-through opacity-70" : ""
                      }`}
                    >
                      {track.title}
                    </span>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded bg-surface px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground border border-border">
                      {track.category}
                    </span>
                    <button
                      onClick={() => handleDeleteTrack(track.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {tracks.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No deliverables in this track yet. Add one above!
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}