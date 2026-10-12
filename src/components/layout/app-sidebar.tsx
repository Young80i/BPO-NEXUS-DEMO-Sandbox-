import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  MessagesSquare,
  Flag,
  CheckSquare,
  FileText,
  CalendarDays,
  BarChart3,
  Settings,
  Sparkles,
  Bot,
  Globe,
  Gamepad2,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

const main = [
  // FIX: Point Dashboard directly to the working route so it clicks instantly and highlights
  { title: "Dashboard", url: "/executive-dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Conversations", url: "/conversations", icon: MessagesSquare, badge: "6" },
];

const work = [
  { title: "Milestones", url: "/milestones", icon: Flag },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Invoices", url: "/invoices", icon: Receipt },
  { title: "Files", url: "/files", icon: FileText },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
];

const ai = [
  { title: "AI Workspace", url: "/ai-workspace", icon: Bot },
  { title: "Automation", url: "/automation", icon: Sparkles },
  { title: "Website Dev", url: "/website", icon: Globe },
  { title: "Game Dev", url: "/game-dev", icon: Gamepad2 },
];

const insight = [
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

function Section({
  label,
  items,
  pathname,
}: {
  label: string;
  items: { title: string; url: string; icon: typeof Users; badge?: string }[];
  pathname: string;
}) {
  return (
    <div className="px-3 py-2">
      <p className="px-3 pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
        {label}
      </p>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const active = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <span
                className={cn(
                  "absolute left-0 h-5 w-[3px] rounded-r-full brand-gradient transition-opacity duration-200",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
              <item.icon className="h-[1.05rem] w-[1.05rem] shrink-0" />
              <span className="truncate">{item.title}</span>
              {item.badge && (
                <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[0.68rem] font-semibold text-primary">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AppSidebar({ open }: { open: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-[260px] shrink-0 border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-out lg:static lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-sidebar-accent shadow-[var(--shadow-soft)]">
            <img src="/logo.png" alt="BPO Nexus Logo" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-[0.98rem] font-bold leading-tight">BPO Nexus</p>
            <p className="truncate text-[0.7rem] text-muted-foreground">Delivery Command Center</p>
          </div>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto py-2">
          <Section label="Overview" items={main} pathname={pathname} />
          <Section label="Delivery" items={work} pathname={pathname} />
          <Section label="AI & Build" items={ai} pathname={pathname} />
          <Section label="Company" items={insight} pathname={pathname} />
        </div>

        <div className="m-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
          <p className="text-xs font-semibold">AI Delivery Copilot</p>
          <p className="mt-1 text-[0.72rem] leading-relaxed text-muted-foreground">
            Drafting your Friday client digest — 3 projects need attention.
          </p>
        </div>
      </div>
    </aside>
  );
}