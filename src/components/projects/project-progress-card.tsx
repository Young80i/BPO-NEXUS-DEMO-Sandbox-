import { useState, useEffect } from "react";
import { Gauge, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/lib/projects-store";
import type { Project } from "@/data/demo";

interface Props {
  project: Project;
}

export function ProjectProgressCard({ project }: Props) {
  const { update } = useProjects();
  const [progress, setProgress] = useState<number>(project.progress ?? 0);
  const [description, setDescription] = useState<string>(project.description ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProgress(project.progress ?? 0);
    setDescription(project.description ?? "");
  }, [project.id, project.progress, project.description]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await update(project.id, {
        progress: Number(progress),
        description: description,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="surface-card p-4 md:p-5 space-y-4">
      <header className="flex items-center gap-2 mb-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/12 text-primary">
          <Gauge className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold">Project Progress & Status Report</h2>
      </header>

      {/* Progress Completion Indicator Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-muted-foreground">Completion Indicator</span>
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
            onChange={(e) => setProgress(Math.min(100, Math.max(0, Number(e.target.value))))}
            className="w-16 rounded border border-border bg-surface-2 px-2 py-1 text-xs text-center font-mono"
          />
        </div>
        <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Status / Progress Report Notes */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">
          Progress Report / Milestone Status Notes
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Update website development milestone notes or progress reports..."
          className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <Button size="sm" className="gap-2" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Progress Report
      </Button>
    </section>
  );
}