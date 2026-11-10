"use client";

import { useState, type ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { SidebarProject } from "@/lib/queries/projects";
import type { TodoData } from "@/lib/queries/todos";
import type { ProfileSummary } from "@/types";

type Props = {
  user: ProfileSummary;
  projects: SidebarProject[];
  todos: TodoData;
  children: ReactNode;
};

export function AppShell({ user, projects, todos, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-svh">
      {/* Sidebar desktop */}
      <aside className="border-sidebar-border fixed inset-y-0 left-0 z-40 hidden w-64 border-r lg:block">
        <AppSidebar projects={projects} />
      </aside>

      {/* Sidebar mobile : tiroir */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-72 gap-0 p-0 sm:max-w-72">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Navigation entre vos projets</SheetDescription>
          </SheetHeader>
          <AppSidebar projects={projects} onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <AppHeader user={user} projects={projects} todos={todos} onOpenMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
        <footer className="text-muted-foreground border-t px-4 py-4 text-center text-xs sm:px-6">
          Pilotis Ticket est une version de test, extraite de Pilotis ERP, où ce module sera intégré dans une version plus complète.
        </footer>
      </div>
    </div>
  );
}
