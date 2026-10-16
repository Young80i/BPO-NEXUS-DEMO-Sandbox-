import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Archive,
  Columns3,
  Copy,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Table2,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/app-shell";
import { PriorityBadge, ProgressBar, StatusBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProjects } from "@/lib/projects-store";
import {
  formatMoney,
  priorities,
  statusOrder,
  type Priority,
  type Project,
  type ProjectStatus,
} from "@/data/demo";
import { useClients } from "@/lib/clients-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Kanban, Table & Cards | BPO Nexus" },
      {
        name: "description",
        content:
          "Plan and track outsourcing projects across Kanban, table and card views with budgets, priorities, stacks and deadlines.",
      },
      { property: "og:title", content: "Projects — BPO Nexus" },
      { property: "og:description", content: "Kanban, table and card views for every software outsourcing engagement." },
    ],
  }),
  component: ProjectsPage,
});

const views = [
  { key: "kanban", label: "Kanban", icon: Columns3 },
  { key: "table", label: "Table", icon: Table2 },
  { key: "cards", label: "Cards", icon: LayoutGrid },
] as const;

function clientName(id: string, list: { id: string; company: string }[]) {
  return list.find((c) => c.id === id)?.company ?? "Unassigned";
}

function RowMenu({
  project,
  onEdit,
}: {
  project: Project;
  onEdit: (p: Project) => void;
}) {
  const { remove, archive, duplicate } = useProjects();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Project actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onEdit(project)}>
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => duplicate(project.id)}>
          <Copy className="mr-2 h-4 w-4" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => archive(project.id)}>
          <Archive className="mr-2 h-4 w-4" /> {project.archived ? "Unarchive" : "Archive"}
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => remove(project.id)}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectCard({ project, onEdit }: { project: Project; onEdit: (p: Project) => void }) {
  const { clients } = useClients();
  return (
    <article className="lift rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{project.name}</h3>
          <p className="truncate text-xs text-muted-foreground">{clientName(project.clientId, clients)}</p>
        </div>
        <RowMenu project={project} onEdit={onEdit} />
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{project.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.stack.slice(0, 3).map((tech) => (
          <span key={tech} className="rounded-md bg-surface-2 px-2 py-0.5 text-[0.68rem] text-muted-foreground">
            {tech}
          </span>
        ))}
        {project.stack.length > 3 && (
          <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[0.68rem] text-muted-foreground">
            +{project.stack.length - 3}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-[0.7rem] text-muted-foreground">
          <span className="font-semibold text-primary">{project.progress}% complete</span>
          <span>due {project.dueDate.slice(5)}</span>
        </div>
        <ProgressBar value={project.progress} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <PriorityBadge priority={project.priority} />
        <span className="text-xs font-semibold">{formatMoney(project.budget, project.currency)}</span>
      </div>
    </article>
  );
}

function ProjectsPage() {
  const { projects, create, update } = useProjects();
  const { clients } = useClients();
  const [view, setView] = useState<(typeof views)[number]["key"]>("kanban");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("All");
  const [priority, setPriority] = useState<string>("All");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [draft, setDraft] = useState<Omit<Project, "id"> | null>(null);

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return projects.filter(
      (p) =>
        (showArchived ? true : !p.archived) &&
        (status === "All" || p.status === status) &&
        (priority === "All" || p.priority === priority) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          clientName(p.clientId, clients).toLowerCase().includes(q) ||
          p.stack.join(" ").toLowerCase().includes(q)),
    );
  }, [projects, query, status, priority, showArchived]);

  const openCreate = () => {
    setEditing(null);

    if (clients.length === 0) {
      toast.error("Create a client before creating a project");
      return;
    }

    setDraft({
      name: "",
      clientId: clients[0].id,
      description: "",
      budget: 10000,
      currency: "USD",
      priority: "Medium",
      status: "Discovery",
      startDate: "2026-08-01",
      dueDate: "2026-11-01",
      estimatedHours: 200,
      actualHours: 0,
      stack: [],
      repository: "",
      aiTool: "Lovable",
      notes: "",
      progress: 0,
      archived: false,
    });
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    const { id: _id, ...rest } = p;
    setDraft(rest);
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) return toast.error("Project name is required");
    if (!draft.clientId) return toast.error("Select a client");
    if (!draft.dueDate) return toast.error("Due date is required");
    if (draft.budget < 0) return toast.error("Budget cannot be negative");
    try {
      if (editing) await update(editing.id, draft);
      else await create(draft);
    } catch {
      return; // store handles error toast
    }
    setDraft(null);
    setEditing(null);
  };

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Projects"
        description={`${visible.length} engagements · ${projects.filter((p) => p.status === "In Progress").length} in flight`}
        actions={
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Project
          </Button>
        }
      />

      <div className="surface-card flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, clients or tech stack"
            className="h-9 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface-2 px-3 text-sm outline-none"
        >
          {["All", ...statusOrder, "Archived"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface-2 px-3 text-sm outline-none"
        >
          {["All", ...priorities].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 text-sm">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="accent-[var(--primary)]"
          />
          Archived
        </label>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 p-1">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                view === v.key ? "bg-surface text-foreground shadow-[var(--shadow-soft)]" : "text-muted-foreground",
              )}
            >
              <v.icon className="h-3.5 w-3.5" /> {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === "kanban" && (
        <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-3">
          {statusOrder.map((col) => {
            const items = visible.filter((p) => p.status === col);
            return (
              <section key={col} className="w-[300px] shrink-0">
                <div className="mb-3 flex items-center justify-between px-1">
                  <StatusBadge status={col as ProjectStatus} />
                  <span className="text-xs font-semibold text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-3 rounded-2xl border border-dashed border-border bg-surface-2/40 p-3">
                  {items.map((p) => (
                    <ProjectCard key={p.id} project={p} onEdit={openEdit} />
                  ))}
                  {items.length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">Nothing here</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {view === "cards" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} onEdit={openEdit} />
          ))}
        </div>
      )}

      {view === "table" && (
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Project</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Budget</th>
                <th className="px-4 py-3 font-semibold">Hours</th>
                <th className="px-4 py-3 font-semibold">Due</th>
                <th className="px-4 py-3 font-semibold">Progress</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40">
                  <td className="max-w-[240px] px-4 py-3">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.aiTool} · {p.repository}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{clientName(p.clientId, clients)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={p.priority} />
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatMoney(p.budget, p.currency)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.actualHours}/{p.estimatedHours}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.dueDate}</td>
                  <td className="w-[140px] px-4 py-3">
                    <ProgressBar value={p.progress} />
                  </td>
                  <td className="px-2 py-3">
                    <RowMenu project={p} onEdit={openEdit} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {visible.length === 0 && (
        <div className="surface-card grid place-items-center p-12 text-sm text-muted-foreground">
          No projects match those filters.
        </div>
      )}

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit project" : "New project"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Project name" className="sm:col-span-2">
                <input
                  className="field"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Field>
              <Field label="Client">
                <select
                  className="field"
                  value={draft.clientId}
                  onChange={(e) => setDraft({ ...draft, clientId: e.target.value })}
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select
                  className="field"
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value as ProjectStatus })}
                >
                  {statusOrder.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>

              {/* Progress completion indicator slider & numeric control */}
              <Field label={`Progress Completion (${draft.progress ?? 0}%)`} className="sm:col-span-2">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={draft.progress ?? 0}
                    onChange={(e) => setDraft({ ...draft, progress: Number(e.target.value) })}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={draft.progress ?? 0}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        progress: Math.min(100, Math.max(0, Number(e.target.value))),
                      })
                    }
                    className="field w-20 text-center font-mono"
                  />
                </div>
              </Field>

              <Field label="Description / Status Report" className="sm:col-span-2">
                <textarea
                  className="field min-h-20 py-2"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Summarize latest milestone progress or client deliverables..."
                />
              </Field>
              <Field label="Budget">
                <input
                  type="number"
                  className="field"
                  value={draft.budget}
                  onChange={(e) => setDraft({ ...draft, budget: Number(e.target.value) })}
                />
              </Field>
              <Field label="Currency">
                <select
                  className="field"
                  value={draft.currency}
                  onChange={(e) => setDraft({ ...draft, currency: e.target.value as Project["currency"] })}
                >
                  {["USD", "EUR", "GBP", "AUD"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <select
                  className="field"
                  value={draft.priority}
                  onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })}
                >
                  {priorities.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>
              <Field label="AI tool used">
                <input
                  className="field"
                  value={draft.aiTool}
                  onChange={(e) => setDraft({ ...draft, aiTool: e.target.value })}
                />
              </Field>
              <Field label="Start date">
                <input
                  type="date"
                  className="field"
                  value={draft.startDate}
                  onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                />
              </Field>
              <Field label="Due date">
                <input
                  type="date"
                  className="field"
                  value={draft.dueDate}
                  onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                />
              </Field>
              <Field label="Estimated hours">
                <input
                  type="number"
                  className="field"
                  value={draft.estimatedHours}
                  onChange={(e) => setDraft({ ...draft, estimatedHours: Number(e.target.value) })}
                />
              </Field>
              <Field label="Actual hours">
                <input
                  type="number"
                  className="field"
                  value={draft.actualHours}
                  onChange={(e) => setDraft({ ...draft, actualHours: Number(e.target.value) })}
                />
              </Field>
              <Field label="Technology stack (comma separated)" className="sm:col-span-2">
                <input
                  className="field"
                  value={draft.stack.join(", ")}
                  onChange={(e) =>
                    setDraft({ ...draft, stack: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
                  }
                />
              </Field>
              <Field label="Repository" className="sm:col-span-2">
                <input
                  className="field"
                  value={draft.repository}
                  onChange={(e) => setDraft({ ...draft, repository: e.target.value })}
                />
              </Field>
              <Field label="Project notes" className="sm:col-span-2">
                <textarea
                  className="field min-h-20 py-2"
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create project"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}