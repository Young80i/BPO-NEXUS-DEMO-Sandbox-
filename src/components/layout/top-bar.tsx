import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, LogIn, LogOut, Menu, Moon, Plus, Search, Settings, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/supabase/hooks/useAuth";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const meta = (user?.user_metadata ?? {}) as { full_name?: string; name?: string; avatar_url?: string };
  const displayName = meta.full_name || meta.name || user?.email || "Guest";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Toggle navigation">
        <Menu className="h-5 w-5" />
      </Button>
      <div className="relative hidden min-w-0 flex-1 md:block md:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search projects, clients, milestones…"
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate({ to: "/projects" });
          }}
          className="h-9 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
        />
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <Button size="sm" className="hidden gap-1.5 sm:inline-flex" asChild>
          <Link to="/projects">
            <Plus className="h-4 w-4" /> New Project
          </Link>
        </Button>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-[1.1rem] w-[1.1rem]" /> : <Moon className="h-[1.1rem] w-[1.1rem]" />}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications" asChild>
          <Link to="/automation">
            <Bell className="h-[1.1rem] w-[1.1rem]" />
          </Link>
        </Button>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3">
                {meta.avatar_url ? (
                  <img src={meta.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full brand-gradient text-[0.7rem] font-bold text-primary-foreground">
                    {initials(displayName)}
                  </span>
                )}
                <span className="hidden max-w-32 truncate text-xs font-semibold sm:block">{displayName}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex w-full cursor-pointer items-center">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={async (e) => {
                  e.preventDefault();
                  await signOut();
                  navigate({ to: "/login" });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" size="sm" className="ml-1 gap-1.5" asChild>
            <Link to="/login">
              <LogIn className="h-4 w-4" /> Sign in
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}