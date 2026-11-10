"use client";

import { FolderKanban, KanbanSquare, LayoutDashboard, Settings, StickyNote, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ProjectAvatar } from "@/components/shared/project-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SidebarProject } from "@/lib/queries/projects";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const itemBase =
  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";
const itemIdle = "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground";
const itemActive = "bg-sidebar-accent text-sidebar-accent-foreground";

export function AppSidebar({ projects, onNavigate }: { projects: SidebarProject[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const currentId = params.id;

  const projectNav = (id: string): NavItem[] => [
    { href: `/projets/${id}`, label: "Tableau de bord", icon: LayoutDashboard, exact: true },
    { href: `/projets/${id}/tickets`, label: "Tickets", icon: KanbanSquare },
    { href: `/projets/${id}/notes`, label: "Notes", icon: StickyNote },
    { href: `/projets/${id}/membres`, label: "Membres", icon: Users },
    { href: `/projets/${id}/parametres`, label: "Paramètres", icon: Settings },
  ];

  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));

  return (
    <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col">
      <div className="flex h-20 shrink-0 items-center px-4">
        <Link href="/projets" onClick={onNavigate} aria-label="Pilotis Ticket, accueil" className="flex items-center gap-3">
          <BrandLogo className="h-12" />
          <span className="grid leading-tight">
            <span className="text-base font-semibold tracking-tight whitespace-nowrap">Ticket</span>
            <span className="mt-0.5 w-fit rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-semibold tracking-wide whitespace-nowrap text-amber-800 uppercase dark:bg-amber-500/20 dark:text-amber-300">
              Version test
            </span>
          </span>
        </Link>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav aria-label="Navigation principale" className="grid gap-5 px-3 py-3">
          <div className="grid gap-1">
            <Link
              href="/projets"
              onClick={onNavigate}
              aria-current={pathname === "/projets" ? "page" : undefined}
              className={cn(itemBase, pathname === "/projets" ? itemActive : itemIdle)}
            >
              <FolderKanban className="size-4" aria-hidden />
              Mes projets
            </Link>
          </div>

          <div className="grid gap-1">
            <p className="text-muted-foreground px-2.5 pb-1 text-[11px] font-semibold tracking-wider uppercase">Projets</p>
            {projects.length === 0 ? (
              <p className="text-muted-foreground px-2.5 py-1 text-sm">Aucun projet pour l&apos;instant.</p>
            ) : (
              projects.map((project) => {
                const isCurrent = project.id === currentId;
                return (
                  <div key={project.id} className="grid gap-0.5">
                    <Link
                      href={`/projets/${project.id}`}
                      onClick={onNavigate}
                      className={cn(itemBase, isCurrent ? "text-foreground font-semibold" : itemIdle)}
                    >
                      <ProjectAvatar project={project} size="size-6" className="rounded-md text-[11px]" />
                      <span className="truncate">{project.name}</span>
                    </Link>
                    {isCurrent ? (
                      <div className="border-sidebar-border ml-[1.15rem] grid gap-0.5 border-l pl-2">
                        {projectNav(project.id).map((item) => {
                          const active = isActive(item);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={onNavigate}
                              aria-current={active ? "page" : undefined}
                              className={cn(itemBase, "py-1.5", active ? itemActive : itemIdle)}
                            >
                              <item.icon className="size-4" aria-hidden />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </nav>
      </ScrollArea>

      <div className="border-sidebar-border shrink-0 border-t p-3">
        <NewProjectDialog variant="outline" className="w-full" onOpen={onNavigate} />
      </div>
    </div>
  );
}
