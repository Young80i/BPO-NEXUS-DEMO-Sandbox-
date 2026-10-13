import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Check,
  Copy,
  Cpu,
  Globe,
  Key,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Save,
  Server,
  Shield,
  ShieldCheck,
  User,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useClients } from "@/lib/clients-store";
import { usePersistentState } from "@/lib/persist";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AI Models, Integrations & Agency Config | BPO Nexus" },
      {
        name: "description",
        content:
          "Configure workspace preferences, primary and fallback AI model providers, client email directory, team notifications, and agency profiles.",
      },
      { property: "og:title", content: "Settings — BPO Nexus" },
      { property: "og:description", content: "Manage workspace settings, client directory, and AI model providers." },
    ],
  }),
  component: SettingsPage,
});

export interface AIProviderConfig {
  id: string;
  name: string;
  providerLabel: string;
  defaultModel: string;
  envKeyName: string;
}

export const PRESET_PROVIDERS: AIProviderConfig[] = [
  {
    id: "gemini",
    name: "Gemini Flash via Google AI",
    providerLabel: "Google AI Studio",
    defaultModel: "gemini-2.0-flash",
    envKeyName: "GEMINI_API_KEY",
  },
  {
    id: "openrouter",
    name: "NVIDIA Nemotron via OpenRouter",
    providerLabel: "OpenRouter AI",
    defaultModel: "nvidia/nemotron-3-super-120b-a12b:free",
    envKeyName: "OPENROUTER_API_KEY",
  },
  {
    id: "cohere",
    name: "Command R+ via Cohere AI",
    providerLabel: "Cohere API",
    defaultModel: "command-r-plus",
    envKeyName: "COHERE_API_KEY",
  },
];

export function getActiveProviders(): { primary: AIProviderConfig; fallback: AIProviderConfig } {
  if (typeof window === "undefined") {
    return { primary: PRESET_PROVIDERS[0], fallback: PRESET_PROVIDERS[1] };
  }
  try {
    const pId = localStorage.getItem("jarvis-primary-provider");
    const fId = localStorage.getItem("jarvis-fallback-provider");
    const primaryId = pId ? JSON.parse(pId) : PRESET_PROVIDERS[0].id;
    const fallbackId = fId ? JSON.parse(fId) : PRESET_PROVIDERS[1].id;

    const primary = PRESET_PROVIDERS.find((p) => p.id === primaryId) ?? PRESET_PROVIDERS[0];
    const fallback = PRESET_PROVIDERS.find((p) => p.id === fallbackId) ?? PRESET_PROVIDERS[1];
    return { primary, fallback };
  } catch {
    return { primary: PRESET_PROVIDERS[0], fallback: PRESET_PROVIDERS[1] };
  }
}

export function SettingsPage() {
  const { clients } = useClients();

  // General Profile State
  const [agencyName, setAgencyName] = usePersistentState("settings-agency-name", "BPO Nexus Agency");
  const [supportEmail, setSupportEmail] = usePersistentState("settings-support-email", "support@bponexus.io");
  const [timezone, setTimezone] = usePersistentState("settings-timezone", "UTC-5 (Eastern Time)");
  const [currency, setCurrency] = usePersistentState("settings-currency", "USD ($)");

  // Notification Toggles
  const [emailAlerts, setEmailAlerts] = usePersistentState("settings-email-alerts", true);
  const [slackAlerts, setSlackAlerts] = usePersistentState("settings-slack-alerts", true);
  const [milestoneReminders, setMilestoneReminders] = usePersistentState("settings-milestone-reminders", true);

  // Security Toggles
  const [twoFactor, setTwoFactor] = usePersistentState("settings-2fa", false);
  const [sessionTimeout, setSessionTimeout] = usePersistentState("settings-session-timeout", "24 hours");

  // AI Provider State
  const [primaryId, setPrimaryId] = usePersistentState<string>(
    "jarvis-primary-provider",
    PRESET_PROVIDERS[0].id
  );
  const [fallbackId, setFallbackId] = usePersistentState<string>(
    "jarvis-fallback-provider",
    PRESET_PROVIDERS[1].id
  );

  const primaryProvider = useMemo(
    () => PRESET_PROVIDERS.find((p) => p.id === primaryId) ?? PRESET_PROVIDERS[0],
    [primaryId]
  );

  const availableFallbackOptions = useMemo(
    () => PRESET_PROVIDERS.filter((p) => p.id !== primaryId),
    [primaryId]
  );

  const handlePrimaryChange = (newPrimaryId: string) => {
    setPrimaryId(newPrimaryId);
    if (newPrimaryId === fallbackId) {
      const nextFallback = PRESET_PROVIDERS.find((p) => p.id !== newPrimaryId);
      if (nextFallback) {
        setFallbackId(nextFallback.id);
      }
    }
    toast.success("Primary AI provider updated");
  };

  const handleFallbackChange = (newFallbackId: string) => {
    setFallbackId(newFallbackId);
    toast.success("Fallback AI provider updated");
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard?.writeText(email);
    toast.success(`Copied ${email} to clipboard`);
  };

  const handleSignOut = () => {
    toast.info("Signing out of workspace...");
    setTimeout(() => {
      window.location.href = "/";
    }, 800);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Workspace profile saved successfully");
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl">
      <PageHeader
        title="Settings"
        description="Workspace configuration, primary and fallback AI models, client directory, and security"
        actions={
          <Button
            variant="destructive"
            size="sm"
            onClick={handleSignOut}
            className="gap-1.5"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        }
      />

      {/* 1. AI Integration & Model Configuration */}
      <section className="surface-card p-6 space-y-6 rounded-xl border border-border">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Cpu className="h-5 w-5 text-primary" /> AI Integration & Model Configuration
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage Jarvis autonomous CTO runtime provider choices and emergency fallback redundancy.
          </p>
        </div>

        {/* Vault Display */}
        <div className="rounded-lg border border-border/60 bg-surface-2 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Server className="h-3.5 w-3.5" /> Preserved API Provider Vault (.env Synced)
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {PRESET_PROVIDERS.map((provider) => {
              const isPrimary = provider.id === primaryId;
              const isFallback = provider.id === fallbackId;
              return (
                <div
                  key={provider.id}
                  className={`flex flex-col justify-between rounded-lg border p-3 text-xs transition-colors ${
                    isPrimary
                      ? "border-primary bg-primary/10 font-medium"
                      : isFallback
                        ? "border-amber-500/50 bg-amber-500/10"
                        : "border-border bg-background"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="truncate font-semibold text-foreground">{provider.providerLabel}</p>
                      <span className="font-mono text-[0.6rem] text-muted-foreground bg-surface-2 px-1.5 py-0.5 rounded border border-border">
                        {provider.envKeyName}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[0.7rem] text-muted-foreground">
                      {provider.name}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/40">
                    <span className="text-[0.65rem] opacity-80 font-mono">{provider.defaultModel}</span>
                    {isPrimary && (
                      <span className="text-[0.65rem] font-bold uppercase text-primary">Primary</span>
                    )}
                    {isFallback && (
                      <span className="text-[0.65rem] font-bold uppercase text-amber-500">Fallback</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dropdowns */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Primary AI Provider</label>
            <select
              value={primaryId}
              onChange={(e) => handlePrimaryChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {PRESET_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Fallback AI Provider (Active)
            </label>
            <select
              value={fallbackId}
              onChange={(e) => handleFallbackChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {availableFallbackOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current Active Model Badge */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 p-4">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground">Current Active Model Target</p>
            <p className="font-mono text-sm font-bold text-primary">{primaryProvider.defaultModel}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Synced to {primaryProvider.envKeyName}</span>
          </div>
        </div>
      </section>

      {/* 2. Client Email Directory & Handles Monitor */}
      <section className="surface-card p-6 space-y-4 rounded-xl border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-5 w-5 text-primary" /> Client Email Directory & Handles
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Live record monitoring all active client email addresses across current projects.
            </p>
          </div>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted-foreground border border-border">
            {clients?.length || 0} Clients Registered
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-background">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Client / Company</th>
                <th className="px-4 py-3 font-semibold">Contact Email Handle</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(clients || []).map((client) => {
                const email = client.email || `${client.name.toLowerCase().replace(/\s+/g, ".")}@client.io`;
                return (
                  <tr key={client.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {client.name}
                      {client.company && (
                        <span className="ml-1.5 text-muted-foreground font-normal">
                          ({client.company})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-primary">{email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-500/10 text-emerald-500 px-2 py-0.5 text-[0.68rem] font-semibold">
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(email)}
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        title="Copy email handle"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {(!clients || clients.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    No client email records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Workspace Profile & Agency Config */}
      <section className="surface-card p-6 space-y-4 rounded-xl border border-border">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Globe className="h-5 w-5 text-primary" /> Workspace & Agency Profile
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            General operational preferences for client proposals, deliverables, and headers.
          </p>
        </div>

        <form onSubmit={handleSaveGeneral} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Agency / Organization Name</label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Support / Client Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Default Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Primary Currency</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="sm" className="gap-1.5">
              <Save className="h-4 w-4" /> Save Workspace Profile
            </Button>
          </div>
        </form>
      </section>

      {/* 4. Notifications & Alerts */}
      <section className="surface-card p-6 space-y-4 rounded-xl border border-border">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Bell className="h-5 w-5 text-primary" /> Notifications & Alerts
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure system digests, milestone updates, and emergency alert channels.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between rounded-lg border border-border bg-background p-3.5 cursor-pointer">
            <div>
              <p className="text-sm font-medium">Email Digest & Weekly Summary</p>
              <p className="text-xs text-muted-foreground">Receive weekly performance and milestone reports</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => {
                setEmailAlerts(e.target.checked);
                toast.success(`Email alerts ${e.target.checked ? "enabled" : "disabled"}`);
              }}
              className="h-4 w-4 accent-primary cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-border bg-background p-3.5 cursor-pointer">
            <div>
              <p className="text-sm font-medium">Slack Instant Notifications</p>
              <p className="text-xs text-muted-foreground">Real-time alerts for incoming client messages and task completions</p>
            </div>
            <input
              type="checkbox"
              checked={slackAlerts}
              onChange={(e) => {
                setSlackAlerts(e.target.checked);
                toast.success(`Slack alerts ${e.target.checked ? "enabled" : "disabled"}`);
              }}
              className="h-4 w-4 accent-primary cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-border bg-background p-3.5 cursor-pointer">
            <div>
              <p className="text-sm font-medium">Milestone Approval Reminders</p>
              <p className="text-xs text-muted-foreground">Automatic nudges when milestone reviews are pending client sign-off</p>
            </div>
            <input
              type="checkbox"
              checked={milestoneReminders}
              onChange={(e) => {
                setMilestoneReminders(e.target.checked);
                toast.success(`Milestone reminders ${e.target.checked ? "enabled" : "disabled"}`);
              }}
              className="h-4 w-4 accent-primary cursor-pointer"
            />
          </label>
        </div>
      </section>

      {/* 5. Security & Access Controls */}
      <section className="surface-card p-6 space-y-4 rounded-xl border border-border">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Shield className="h-5 w-5 text-primary" /> Security & Access Controls
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage authentication requirements, session expiry, and API key permissions.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between rounded-lg border border-border bg-background p-3.5 cursor-pointer">
            <div>
              <p className="text-sm font-medium">Two-Factor Authentication (2FA)</p>
              <p className="text-xs text-muted-foreground">Require authenticator app code on login</p>
            </div>
            <input
              type="checkbox"
              checked={twoFactor}
              onChange={(e) => {
                setTwoFactor(e.target.checked);
                toast.success(`2FA ${e.target.checked ? "enabled" : "disabled"}`);
              }}
              className="h-4 w-4 accent-primary cursor-pointer"
            />
          </label>

          <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3.5">
            <div>
              <p className="text-sm font-medium">Session Inactivity Timeout</p>
              <p className="text-xs text-muted-foreground">Automatically log out inactive sessions</p>
            </div>
            <select
              value={sessionTimeout}
              onChange={(e) => {
                setSessionTimeout(e.target.value);
                toast.success(`Session timeout set to ${e.target.value}`);
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="1 hour">1 hour</option>
              <option value="8 hours">8 hours</option>
              <option value="24 hours">24 hours</option>
              <option value="7 days">7 days</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}