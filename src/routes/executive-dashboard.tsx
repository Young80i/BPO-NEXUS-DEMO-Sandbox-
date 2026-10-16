import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Cpu,
  Sparkles,
  TrendingUp,
  Zap,
  FolderKanban,
  Users,
  CheckCircle2,
  DollarSign,
  Clock,
  ShieldCheck,
  Server,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/layout/app-shell";
import { useProjects } from "@/lib/projects-store";
import { useClients } from "@/lib/clients-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/executive-dashboard")({
  head: () => ({
    meta: [
      { title: "Executive Dashboard — BPO Nexus" },
      {
        name: "description",
        content: "High-level overview of active engagements, AI velocity, revenue telemetry, and project health.",
      },
    ],
  }),
  component: ExecutiveDashboardPage,
});

// Detailed Telemetry Dataset
interface DataPoint {
  label: string;
  prompts: number;
  tokens: number; // in thousands
  latency: number; // in ms
  efficiency: number; // %
}

const DETAILED_CHART_DATA: Record<"7D" | "30D" | "90D", DataPoint[]> = {
  "7D": [
    { label: "Mon, Oct 12", prompts: 24, tokens: 38, latency: 280, efficiency: 94.2 },
    { label: "Tue, Oct 13", prompts: 42, tokens: 65, latency: 240, efficiency: 96.5 },
    { label: "Wed, Oct 14", prompts: 38, tokens: 54, latency: 260, efficiency: 93.8 },
    { label: "Thu, Oct 15", prompts: 76, tokens: 112, latency: 210, efficiency: 98.1 },
    { label: "Fri, Oct 16", prompts: 64, tokens: 98, latency: 195, efficiency: 97.4 },
    { label: "Sat, Oct 17", prompts: 89, tokens: 135, latency: 180, efficiency: 99.0 },
    { label: "Sun, Oct 18", prompts: 105, tokens: 152, latency: 175, efficiency: 98.6 },
  ],
  "30D": [
    { label: "Week 1", prompts: 180, tokens: 260, latency: 290, efficiency: 92.1 },
    { label: "Week 2", prompts: 310, tokens: 440, latency: 240, efficiency: 95.8 },
    { label: "Week 3", prompts: 490, tokens: 710, latency: 210, efficiency: 97.9 },
    { label: "Week 4", prompts: 680, tokens: 980, latency: 190, efficiency: 99.2 },
  ],
  "90D": [
    { label: "August", prompts: 890, tokens: 1240, latency: 320, efficiency: 90.4 },
    { label: "September", prompts: 1540, tokens: 2180, latency: 230, efficiency: 96.1 },
    { label: "October", prompts: 2450, tokens: 3620, latency: 185, efficiency: 98.8 },
  ],
};

function ProFuturisticAIChart() {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("7D");
  const [activeModelFilter, setActiveModelFilter] = useState<string>("All");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const activeSeries = DETAILED_CHART_DATA[timeRange];
  const hoveredData = hoveredIdx !== null ? activeSeries[hoveredIdx] : activeSeries[activeSeries.length - 1];

  const maxTokens = Math.max(...activeSeries.map((d) => d.tokens)) * 1.25;

  // Coordinate Calculations
  const viewWidth = 600;
  const viewHeight = 180;
  const paddingX = 40;
  const paddingY = 20;
  const chartWidth = viewWidth - paddingX * 2;
  const chartHeight = viewHeight - paddingY * 2;

  const pointsPrimary = activeSeries.map((d, idx) => {
    const x = paddingX + (idx / (activeSeries.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - (d.tokens / maxTokens) * chartHeight;
    return { x, y, data: d };
  });

  const pointsSecondary = activeSeries.map((d, idx) => {
    const x = paddingX + (idx / (activeSeries.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - (d.prompts / (maxTokens * 0.7)) * chartHeight;
    return { x, y };
  });

  const primaryPathD = `M ${pointsPrimary.map((p) => `${p.x},${p.y}`).join(" L ")}`;
  const primaryAreaD = `M ${paddingX},${paddingY + chartHeight} L ${pointsPrimary.map((p) => `${p.x},${p.y}`).join(" L ")} L ${paddingX + chartWidth},${paddingY + chartHeight} Z`;

  const secondaryPathD = `M ${pointsSecondary.map((p) => `${p.x},${p.y}`).join(" L ")}`;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-b from-surface/95 via-surface/80 to-background p-5 md:p-6 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.6)]">
      {/* Cyberpunk Grid Background Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:1.5rem_1.5rem]" />
      
      {/* Neon Background Accents */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/12 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-cyan-500/12 blur-3xl" />

      <div className="relative space-y-6">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary border border-primary/40 shadow-[0_0_20px_rgba(59,130,246,0.35)]">
                <Activity className="h-5 w-5" />
              </span>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-background">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  JARVIS Telemetry & Engine Velocity
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[0.65rem] font-bold text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> CLUSTER ONLINE
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                High-frequency token throughput, prompt invocation velocity, and neural latency metrics
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Model Filter Pills */}
            <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-surface-2/80 p-1">
              {["All", "Claude 3.5", "GPT-4o", "Lovable"].map((model) => (
                <button
                  key={model}
                  onClick={() => setActiveModelFilter(model)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[0.7rem] font-semibold transition-all",
                    activeModelFilter === model
                      ? "bg-surface text-primary border border-primary/30 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {model}
                </button>
              ))}
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 p-1">
              {(["7D", "30D", "90D"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-bold transition-all",
                    timeRange === range
                      ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-Time Telemetry Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="group rounded-xl border border-border/60 bg-surface-2/40 p-3 backdrop-blur-md transition-colors hover:border-primary/40">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Token Throughput</span>
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-xl font-black font-mono text-cyan-400">
                {hoveredData ? `${hoveredData.tokens}k` : "142.8k"}
              </p>
              <span className="text-[0.68rem] font-semibold text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> +18.4%
              </span>
            </div>
            <p className="mt-1 text-[0.65rem] text-muted-foreground">Tokens generated / stream window</p>
          </div>

          <div className="group rounded-xl border border-border/60 bg-surface-2/40 p-3 backdrop-blur-md transition-colors hover:border-primary/40">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Prompt Invocations</span>
              <Cpu className="h-3.5 w-3.5 text-primary" />
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-xl font-black font-mono text-foreground">
                {hoveredData ? hoveredData.prompts : 85}
              </p>
              <span className="text-[0.68rem] font-semibold text-primary">Active Sessions</span>
            </div>
            <p className="mt-1 text-[0.65rem] text-muted-foreground">Auto-provisioned via brief engine</p>
          </div>

          <div className="group rounded-xl border border-border/60 bg-surface-2/40 p-3 backdrop-blur-md transition-colors hover:border-primary/40">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Average Latency</span>
              <Clock className="h-3.5 w-3.5 text-amber-400" />
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-xl font-black font-mono text-amber-400">
                {hoveredData ? `${hoveredData.latency}ms` : "195ms"}
              </p>
              <span className="text-[0.68rem] font-semibold text-emerald-400">-14% faster</span>
            </div>
            <p className="mt-1 text-[0.65rem] text-muted-foreground">Neural model processing speed</p>
          </div>

          <div className="group rounded-xl border border-border/60 bg-surface-2/40 p-3 backdrop-blur-md transition-colors hover:border-primary/40">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Cache Hit Efficiency</span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-xl font-black font-mono text-emerald-400">
                {hoveredData ? `${hoveredData.efficiency}%` : "98.4%"}
              </p>
              <span className="text-[0.68rem] font-semibold text-emerald-400">Optimal</span>
            </div>
            <p className="mt-1 text-[0.65rem] text-muted-foreground">Prompt caching optimization</p>
          </div>
        </div>

        {/* Main High-Tech SVG Multi-Series Chart */}
        <div className="relative rounded-xl border border-border/40 bg-background/60 p-4 backdrop-blur-md">
          {/* Chart Legend Bar */}
          <div className="mb-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                <span>Token Stream (k)</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span>Prompt Execution Count</span>
              </div>
            </div>

            {hoveredData && (
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                {hoveredData.label}
              </span>
            )}
          </div>

          <div className="relative h-56 w-full">
            <svg
              viewBox={`0 0 ${viewWidth} ${viewHeight}`}
              className="h-full w-full overflow-visible"
              preserveAspectRatio="none"
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <defs>
                {/* Primary Neon Gradient Fill */}
                <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary, #3b82f6)" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="var(--primary, #3b82f6)" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="var(--primary, #3b82f6)" stopOpacity="0.0" />
                </linearGradient>

                {/* Secondary Cyan Glow */}
                <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Y-Axis Horizontal Grid Lines & Scale Markers */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const yVal = paddingY + chartHeight * (1 - ratio);
                const labelVal = Math.round(maxTokens * ratio);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={yVal}
                      x2={viewWidth - paddingX}
                      y2={yVal}
                      stroke="currentColor"
                      className="text-border/25"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={paddingX - 8}
                      y={yVal + 3}
                      textAnchor="end"
                      className="fill-muted-foreground font-mono text-[9px]"
                    >
                      {labelVal}k
                    </text>
                  </g>
                );
              })}

              {/* Primary Area Fill */}
              <path d={primaryAreaD} fill="url(#primaryAreaGrad)" />

              {/* Secondary Line (Prompts Count) */}
              <path
                d={secondaryPathD}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2"
                strokeDasharray="4 2"
                filter="url(#cyanGlow)"
              />

              {/* Primary Line (Tokens) */}
              <path
                d={primaryPathD}
                fill="none"
                stroke="var(--primary, #3b82f6)"
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#cyanGlow)"
              />

              {/* Interactive Crosshair & Hover Handles */}
              {pointsPrimary.map((pt, idx) => {
                const isHovered = hoveredIdx === idx;
                return (
                  <g key={idx} onMouseEnter={() => setHoveredIdx(idx)}>
                    {/* Transparent Click Target Bar */}
                    <rect
                      x={pt.x - chartWidth / activeSeries.length / 2}
                      y={paddingY}
                      width={chartWidth / activeSeries.length}
                      height={chartHeight}
                      fill="transparent"
                      className="cursor-pointer"
                    />

                    {/* Vertical Crosshair Line */}
                    {isHovered && (
                      <line
                        x1={pt.x}
                        y1={paddingY}
                        x2={pt.x}
                        y2={paddingY + chartHeight}
                        stroke="var(--primary, #3b82f6)"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* Primary Glowing Data Point Node */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      className={cn(
                        "fill-primary stroke-background stroke-2 transition-all duration-200",
                        isHovered && "r-7 fill-white shadow-[0_0_15px_#3b82f6]"
                      )}
                    />
                  </g>
                );
              })}
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between px-10 pt-2 font-mono text-[0.7rem] font-semibold text-muted-foreground">
              {activeSeries.map((d, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "cursor-pointer transition-colors",
                    hoveredIdx === idx && "text-primary font-bold"
                  )}
                  onMouseEnter={() => setHoveredIdx(idx)}
                >
                  {d.label.split(",")[0]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Model Execution Load Distribution Bar */}
        <div className="surface-card p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-2 text-foreground">
              <Layers className="h-4 w-4 text-primary" /> Active Model Multi-Tenant Allocation
            </span>
            <span className="font-mono text-muted-foreground text-[0.7rem]">100% Load Balanced</span>
          </div>

          <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-surface-2 p-0.5 border border-border">
            <div className="h-full bg-primary rounded-l-full shadow-[0_0_10px_#3b82f6]" style={{ width: "62%" }} title="Claude 3.5 Sonnet (62%)" />
            <div className="h-full bg-emerald-400" style={{ width: "24%" }} title="GPT-4o (24%)" />
            <div className="h-full bg-amber-400" style={{ width: "10%" }} title="Lovable AI (10%)" />
            <div className="h-full bg-purple-500 rounded-r-full" style={{ width: "4%" }} title="Base44 Engine (4%)" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[0.72rem] font-semibold sm:grid-cols-4 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Claude 3.5 Sonnet</span>
              <span className="font-mono text-foreground ml-auto font-bold">62%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-muted-foreground">GPT-4o</span>
              <span className="font-mono text-foreground ml-auto font-bold">24%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-muted-foreground">Lovable AI</span>
              <span className="font-mono text-foreground ml-auto font-bold">10%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-muted-foreground">Base44 Engine</span>
              <span className="font-mono text-foreground ml-auto font-bold">4%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ExecutiveDashboardPage() {
  const { projects } = useProjects();
  const { clients } = useClients();

  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const inProgressProjects = projects.filter((p) => p.status === "In Progress").length;
  const completedProjects = projects.filter((p) => p.status === "Completed").length;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Executive Delivery Dashboard"
        description="High-level engineering metrics, project progress, and AI delivery performance"
      />

      {/* Executive Overview KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="surface-card p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Projects</span>
            <FolderKanban className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-black font-mono">{projects.length}</p>
          <p className="text-[0.7rem] text-muted-foreground">{inProgressProjects} active in flight</p>
        </div>

        <div className="surface-card p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Active Clients</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-black font-mono">{clients.length}</p>
          <p className="text-[0.7rem] text-muted-foreground">Across all engagements</p>
        </div>

        <div className="surface-card p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Portfolio Value</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-400">${totalBudget.toLocaleString()}</p>
          <p className="text-[0.7rem] text-muted-foreground">Contracted revenue</p>
        </div>

        <div className="surface-card p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Completed</span>
            <CheckCircle2 className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black font-mono text-cyan-400">{completedProjects}</p>
          <p className="text-[0.7rem] text-muted-foreground">Deliverables shipped</p>
        </div>
      </div>

      {/* High-Detail Pro Futuristic Chart */}
      <ProFuturisticAIChart />
    </div>
  );
}