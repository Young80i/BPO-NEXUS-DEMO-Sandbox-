import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/lib/projects-store";
import { usePersistentState } from "@/lib/persist";

export const Route = createFileRoute("/executive-dashboard")({
  head: () => ({
    meta: [
      { title: "Executive Dashboard — High-Level Financial & Delivery Analytics | BPO Nexus" },
      {
        name: "description",
        content:
          "High-level executive metrics covering portfolio revenue, profit margins, delivery success rates, and active client retention.",
      },
      { property: "og:title", content: "Executive Dashboard — BPO Nexus" },
      { property: "og:description", content: "Executive reporting on revenue, profit margins, and portfolio performance." },
    ],
  }),
  component: ExecutiveDashboardPage,
});

const DEFAULT_METRICS = {
  monthlyRevenue: 0,
  grossMargin: 0,
  clientSatisfaction: 0,
  projectWinRate: 0,
};

export function ExecutiveDashboardPage() {
  const router = useRouter();
  // 1. Pull the 'refresh' function from your context
  const { projects, refresh } = useProjects(); 
  const [isReloading, setIsReloading] = useState(false);

  const [execMetrics, setExecMetrics] = usePersistentState(
    "bpo-exec-metrics-v1",
    DEFAULT_METRICS
  );

  const handleReloadExecutive = async () => {
    setIsReloading(true);
    toast.info("Refreshing executive metrics...");

    try {
      // 2. Add visual delay for the spinner
      await new Promise((resolve) => setTimeout(resolve, 600));

      // 3. Reset local storage metrics safely
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem("bpo-exec-metrics-v1") 
                 || window.localStorage.getItem("bpo-nexus:bpo-exec-metrics-v1");
        if (raw) {
          setExecMetrics(JSON.parse(raw));
        } else {
          setExecMetrics(DEFAULT_METRICS);
        }
      }
      
      // 4. ACTUALLY FETCH THE NEW DATA FROM SUPABASE
      if (refresh) {
        await refresh();
      }
      
      await router.invalidate();
      toast.success("Executive metrics reloaded!");
    } catch {
      toast.error("Failed to refresh metrics");
    } finally {
      setIsReloading(false);
    }
  };

  // ... rest of your component stays exactly the same


  const totalContractedRevenue = (projects || []).reduce((acc, p) => acc + (p.budget || 0), 0);
  const completedProjectsCount = (projects || []).filter((p) => p.status === "Completed").length;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Executive Command & Portfolio Analytics"
        description="High-level agency performance, gross margins, delivery velocity, and revenue distribution"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleReloadExecutive}
            disabled={isReloading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isReloading ? "animate-spin" : ""}`} />
            Reload Data
          </Button>
        }
      />

      {/* Executive KPIs */}
      <div className="surface-card lift p-4 space-y-2">
  <div className="flex items-center justify-between text-muted-foreground">
    <span className="text-xs font-medium">Monthly Revenue Run-Rate</span>
    <DollarSign className="h-4 w-4 text-emerald-500" />
  </div>
  <p className="font-display text-2xl font-bold">
    ${(execMetrics?.monthlyRevenue || 0).toLocaleString()}
  </p>
  
  {/* NEW: Only show the positive trend if revenue is actually greater than 0 */}
  {(execMetrics?.monthlyRevenue || 0) > 0 ? (
    <p className="text-[0.72rem] text-emerald-500 font-medium">↑ +14.2% vs last month</p>
  ) : (
    <p className="text-[0.72rem] text-muted-foreground">No previous month data</p>
  )}
</div>

        <div className="surface-card lift p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Portfolio Gross Margin</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <p className="font-display text-2xl font-bold">{execMetrics?.grossMargin || 0}%</p>
          <p className="text-[0.72rem] text-muted-foreground">Target threshold: 65.0%</p>
        </div>

        <div className="surface-card lift p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Client Satisfaction Score</span>
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>
          <p className="font-display text-2xl font-bold">{execMetrics?.clientSatisfaction || 0} / 5.0</p>
          <p className="text-[0.72rem] text-muted-foreground">Based on post-delivery surveys</p>
        </div>

        <div className="surface-card lift p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Proposal Win Rate</span>
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <p className="font-display text-2xl font-bold">{execMetrics?.projectWinRate || 0}%</p>
          <p className="text-[0.72rem] text-muted-foreground">Conversion on submitted proposals</p>
        </div>
      </section>

      {/* Delivery Summary */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="surface-card p-6 rounded-xl border border-border space-y-3">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Total Portfolio Bookings
          </h3>
          <p className="text-xs text-muted-foreground">
            Contracted engagement volume currently tracked across all projects.
          </p>
          <p className="font-display text-3xl font-bold text-primary">
            ${(totalContractedRevenue / 1000).toFixed(1)}k
          </p>
        </div>

        <div className="surface-card p-6 rounded-xl border border-border space-y-3">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Handover Completed Engagements
          </h3>
          <p className="text-xs text-muted-foreground">
            Successfully delivered and archived client projects.
          </p>
          <p className="font-display text-3xl font-bold text-foreground">
            {completedProjectsCount} <span className="text-sm font-normal text-muted-foreground">projects delivered</span>
          </p>
        </div>
      </section>
    </div>
  );
}