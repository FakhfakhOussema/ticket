"use client";

import { ChevronRight, Menu, Plus } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Fragment } from "react";
import { GlobalSearch } from "@/components/layout/global-search";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SidebarProject } from "@/lib/queries/projects";
import type { TodoData } from "@/lib/queries/todos";
import type { ProfileSummary } from "@/types";

type Crumb = { label: string; href?: string };

function useCrumbs(projects: SidebarProject[]): Crumb[] {
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();

  if (pathname.startsWith("/profil")) return [{ label: "Mon profil" }];

  const crumbs: Crumb[] = [{ label: "Projets", href: "/projets" }];
  const project = projects.find((p) => p.id === params.id);
  if (!project) return [{ label: "Mes projets" }];

  const base = `/projets/${project.id}`;
  const rest = pathname.slice(base.length).split("/").filter(Boolean);
  crumbs.push({ label: project.name, href: rest.length ? base : undefined });

  const section = rest[0];
  if (section === "tickets") {
    crumbs.push({ label: "Tickets", href: rest.length > 1 ? `${base}/tickets` : undefined });
    if (rest[1]) crumbs.push({ label: "Détail du ticket" });
  } else if (section === "notes") crumbs.push({ label: "Notes" });
  else if (section === "membres") crumbs.push({ label: "Membres" });
  else if (section === "parametres") crumbs.push({ label: "Paramètres" });
  else crumbs.push({ label: "Tableau de bord" });

  return crumbs;
}

type Props = {
  user: ProfileSummary;
  projects: SidebarProject[];
  todos: TodoData;
  onOpenMenu: () => void;
};

export function AppHeader({ user, projects, todos, onOpenMenu }: Props) {
  const params = useParams<{ id?: string }>();
  const crumbs = useCrumbs(projects);
  const currentProject = projects.find((p) => p.id === params.id);

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur sm:px-5">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMenu} aria-label="Ouvrir le menu">
        <Menu className="size-5" />
      </Button>

      <nav aria-label="Fil d'Ariane" className="min-w-0 flex-1">
        <ol className="text-muted-foreground flex items-center gap-1.5 text-sm">
          {crumbs.map((crumb, i) => {
            const last = i === crumbs.length - 1;
            return (
              <Fragment key={`${crumb.label}-${i}`}>
                {i > 0 ? <ChevronRight className="hidden size-3.5 shrink-0 opacity-60 sm:block" aria-hidden /> : null}
                <li className={last ? "text-foreground min-w-0 truncate font-medium" : "hidden min-w-0 truncate sm:block"}>
                  {crumb.href && !last ? (
                    <Link href={crumb.href} className="hover:text-foreground transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? "page" : undefined}>{crumb.label}</span>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ol>
      </nav>

      <GlobalSearch />

      {currentProject ? (
        <Link href={`/projets/${currentProject.id}/tickets?nouveau=1`} className={buttonVariants({ size: "default" })}>
          <Plus className="size-4" aria-hidden />
          <span className="hidden sm:inline">Nouveau ticket</span>
          <span className="sr-only sm:hidden">Nouveau ticket</span>
        </Link>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={projects.length === 0}
            className={buttonVariants({ size: "default" })}
          >
            <Plus className="size-4" aria-hidden />
            <span className="hidden sm:inline">Nouveau ticket</span>
            <span className="sr-only sm:hidden">Nouveau ticket</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Dans quel projet ?</DropdownMenuLabel>
            </DropdownMenuGroup>
            {projects.map((p) => (
              <DropdownMenuItem key={p.id} render={<Link href={`/projets/${p.id}/tickets?nouveau=1`} />}>
                <span className="size-2.5 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
                <span className="truncate">{p.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <ThemeToggle />
      <UserMenu user={user} todos={todos} projects={projects} />
    </header>
  );
}
