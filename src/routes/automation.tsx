import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bot,
  Check,
  Copy,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/lib/projects-store";
import { useAutomation } from "@/lib/automation-store";
import { supabase } from "@/lib/supabase/client";
import {
  automationCatalog,
  detectProjectKind,
} from "@/lib/automation";
import { analyseBrief, analyseConversation, type BriefAnalysis, type ConversationAnalysis } from "@/lib/ai.functions";

export const Route = createFileRoute("/automation")({
  head: () => ({
    meta: [
      { title: "JARVIS Automation Engine — BPO Nexus" },
      {
        name: "description",
        content:
          "Automate project setup, milestone planning, health scoring, reminders and delivery packs across every project.",
      },
    ],
  }),
  component: AutomationPage,
});

function copy(text: string) {
  void navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
}

function Card({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon: typeof Bot;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="surface-card p-4 md:p-5">
      <header className="mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/12 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
        {action && <div className="ml-auto">{action}</div>}
      </header>
      {children}
    </section>
  );
}

type WorkstationAnalysis = BriefAnalysis & {
  proposal?: string;
  executionPlan?: string[];
  prompts?: { tool: string; prompt: string }[];
};

function AutomationPage() {
  const { projects, refresh } = useProjects();
  const { enabled, isOn, setAll } = useAutomation();

  const [focusId, setFocusId] = useState(() => projects[0]?.id ?? "");
  const [brief, setBrief] = useState("");
  const [briefResult, setBriefResult] = useState<WorkstationAnalysis | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [convo, setConvo] = useState("");
  const [convoResult, setConvoResult] = useState<ConversationAnalysis | null>(null);
  const [convoLoading, setConvoLoading] = useState(false);

  const focus = projects.find((p) => p.id === focusId) ?? projects[0];
  const kind = focus ? detectProjectKind(focus) : "Web App";

  // Auto-load existing saved brief analysis when focus project changes from Supabase
  useEffect(() => {
    async function loadProjectBrief() {
      if (!focus?.id) return;
      try {
        const { data } = await supabase
          .from("project_briefs")
          .select("*")
          .eq("project_id", focus.id)
          .single();
          
        if (data) {
          setBriefResult({
            summary: data.summary,
            difficulty: data.difficulty,
            estimatedCompletion: data.estimated_completion,
            techStack: data.tech_stack || [],
            functionalRequirements: [],
            nonFunctionalRequirements: [],
            risks: [],
            clientExpectations: [],
            deliverables: [],
            milestones: [],
            tasks: [],
            proposal: data.proposal,
            executionPlan: data.execution_plan || [],
            prompts: data.ai_prompts || [],
          });
          setBrief(data.brief_text || "");
        } else {
          setBriefResult(null);
          setBrief("");
        }
      } catch (e) {
        setBriefResult(null);
      }
    }
    loadProjectBrief();
  }, [focus?.id]);

  const runBrief = async () => {
    if (brief.trim().length < 20) return toast.error("Paste a longer project description first.");
    setBriefLoading(true);
    try {
      // 1. Analyse via AI
      const result = (await analyseBrief({ text: brief })) as WorkstationAnalysis;
      setBriefResult(result);

      // 2. Auto-create Client and Project in Supabase
      const clientNameMatch = brief.match(/client|posted by:? ([a-zA-Z0-9_-]+)/i);
      const inferredClientName = clientNameMatch ? "Freelancer Client" : "Star Labs Client";

      const { data: newClient, error: clientErr } = await supabase
        .from("clients")
        .insert([{
          name: inferredClientName,
          company: inferredClientName,
          country: "South Africa",
          country_code: "ZA",
          freelancer_username: "bpo_nexus_user",
          email: "client@freelancer.com",
          phone: "+27000000000",
          status: "Active"
        }])
        .select()
        .single();

      if (clientErr) {
        console.error("Client creation error:", clientErr);
        throw new Error("Failed to auto-create client in Supabase: " + clientErr.message);
      }

      const projectName = brief.split("\n")[0]?.slice(0, 40) || "Freelancer AI Project";
      const todayStr = new Date().toISOString().split("T")[0];
      const dueDateStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      
      const { data: newProj, error: projErr } = await supabase
        .from("projects")
        .insert([{
          name: projectName,
          description: brief.slice(0, 200),
          client_id: newClient.id,
          status: "In Progress",
          priority: "High",
          budget: 1000,
          currency: "USD",
          estimated_hours: 40,
          actual_hours: 0,
          repository: "",
          start_date: todayStr,
          due_date: dueDateStr,
          progress: 10,
        }])
        .select()
        .single();

      if (projErr) {
        console.error("Project creation error:", projErr);
        throw new Error("Failed to auto-create project in Supabase: " + projErr.message);
      }

      const targetProjectId = newProj.id;

      // REFRESH CONTEXT: Syncs local React ProjectsContext state immediately!
      await refresh();
      setFocusId(targetProjectId);
      toast.success("New Client & Project automatically created & selected!");

      // 3. Save Blueprint to Supabase using clean insert
      const { error: briefErr } = await supabase.from("project_briefs").insert({
        project_id: targetProjectId,
        brief_text: brief,
        summary: result.summary,
        difficulty: result.difficulty,
        estimated_completion: result.estimatedCompletion,
        tech_stack: result.techStack,
        proposal: result.proposal,
        execution_plan: result.executionPlan,
        ai_prompts: result.prompts,
      });

      if (briefErr) {
        console.error("Project brief save error:", briefErr);
        toast.error("Brief generated, but Supabase save failed: " + briefErr.message);
      } else {
        toast.success("Project blueprint permanently engraved into Supabase!");
      }

      // 4. Auto-inject Execution Roadmap into Tasks table
      if (result.executionPlan && result.executionPlan.length > 0) {
        const newTaskInserts = result.executionPlan.map((step, idx) => ({
          project_id: targetProjectId,
          title: `Roadmap Step ${idx + 1}: ${step.slice(0, 50)}`,
          description: step,
          status: "Todo",
          priority: idx === 0 ? "High" : "Medium",
        }));

        const { error: taskErr } = await supabase.from("tasks").insert(newTaskInserts);
        if (taskErr) {
          console.error("Tasks insert error:", taskErr);
        } else {
          toast.success("Execution roadmap successfully synced to Tasks tab!");
        }
      }

    } catch (e) {
      console.error("Run brief critical error:", e);
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setBriefLoading(false);
    }
  };

  const runConvo = async () => {
    if (convo.trim().length < 20) return toast.error("Paste a longer conversation first.");
    setConvoLoading(true);
    try {
      setConvoResult(await analyseConversation({ text: convo }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setConvoLoading(false);
    }
  };

  const activeCount = Object.values(enabled).filter(Boolean).length;

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="JARVIS Automation Engine"
        description={`${activeCount} of ${automationCatalog.length} automations running across every project`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setAll(false)}>
              Disable all
            </Button>
            <Button size="sm" onClick={() => setAll(true)}>
              Enable all
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-semibold text-muted-foreground" htmlFor="focus-project">
          Focus project
        </label>
        <select
          id="focus-project"
          className="field h-9 w-auto min-w-[16rem]"
          value={focus?.id ?? ""}
          onChange={(e) => setFocusId(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-[0.7rem] font-semibold">
          Detected type: {kind}
        </span>
      </div>

      {/* AI analysers */}
      <div className="grid gap-4 lg:grid-cols-2">
        {isOn("briefAnalysis") && (
          <Card title="Freelancer Brief Workstation" icon={Wand2}>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={5}
              placeholder="Paste the Freelancer.com project description here to generate a proposal, execution plan, and AI prompts..."
              className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />
            <Button className="mt-2 gap-2 w-full justify-center" size="sm" onClick={runBrief} disabled={briefLoading}>
              {briefLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Analyse & Generate Plan
            </Button>
            
            {briefResult && (
              <div className="mt-6 space-y-5 text-sm">
                
                {/* 1. Proposal Draft */}
                {briefResult.proposal && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 relative">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">Proposal Draft</p>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => copy(briefResult.proposal!)}>
                        <Copy className="h-3 w-3 mr-1.5" /> Copy to Bid
                      </Button>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-medium">
                      {briefResult.proposal}
                    </p>
                  </div>
                )}

                {/* 2. Step-by-step Execution */}
                {briefResult.executionPlan && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Execution Roadmap
                    </p>
                    <div className="rounded-lg border border-border bg-surface-2/50 p-3">
                      <ol className="space-y-2">
                        {briefResult.executionPlan.map((step, idx) => (
                          <li key={idx} className="flex gap-2.5 text-sm text-foreground/80">
                            <span className="font-mono text-xs text-muted-foreground mt-0.5">{idx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}

                {/* 3. AI Tool Prompts */}
                {briefResult.prompts && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      AI Generation Prompts
                    </p>
                    <div className="space-y-3">
                      {briefResult.prompts.map((p, idx) => (
                        <div key={idx} className="group rounded-lg border border-border bg-background p-3 hover:border-primary/30 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center rounded bg-surface px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground border border-border">
                              {p.tool}
                            </span>
                            <button onClick={() => copy(p.prompt)} className="text-muted-foreground hover:text-primary transition-colors">
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="font-mono text-[0.75rem] text-muted-foreground leading-relaxed">
                            {p.prompt}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legacy Breakdown */}
                <div className="pt-4 border-t border-border/50">
                  <p className="text-muted-foreground mb-3">{briefResult.summary}</p>
                  <div className="flex flex-wrap gap-2 text-[0.7rem] font-semibold">
                    <span className="rounded-full border border-primary/25 bg-primary/12 px-2.5 py-0.5 text-primary">
                      {briefResult.difficulty}
                    </span>
                    <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5">
                      {briefResult.estimatedCompletion}
                    </span>
                  </div>
                </div>

              </div>
            )}
          </Card>
        )}

        {isOn("conversationAnalysis") && (
          <Card title="Analyse a client conversation" icon={Bot}>
            <textarea
              value={convo}
              onChange={(e) => setConvo(e.target.value)}
              rows={5}
              placeholder="Paste the client conversation here…"
              className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />
            <Button className="mt-2 gap-2" size="sm" onClick={runConvo} disabled={convoLoading}>
              {convoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Analyse conversation
            </Button>
            {convoResult && (
              <div className="mt-4 space-y-3 text-sm">
                <p className="text-muted-foreground">{convoResult.summary}</p>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action items</p>
                  <ul className="mt-1 space-y-1">
                    {convoResult.actionItems.map((a, i) => (
                      <li key={i} className="flex gap-2 text-xs">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" /> {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Outstanding questions
                  </p>
                  <ul className="mt-1 space-y-1">
                    {convoResult.outstandingQuestions.map((q, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        • {q}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-border bg-surface-2/60 p-3">
                  <p className="text-xs font-semibold">Suggested reply</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{convoResult.suggestedReply}</p>
                  <Button variant="outline" size="sm" className="mt-2 gap-1.5" onClick={() => copy(convoResult.suggestedReply)}>
                    <Copy className="h-3.5 w-3.5" /> Copy reply
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}