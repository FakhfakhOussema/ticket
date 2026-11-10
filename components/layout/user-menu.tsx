"use client";

import { ListChecks, LogOut, UserCircle } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { TodoList } from "@/components/todos/todo-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { signOut } from "@/lib/actions/auth";
import { displayName } from "@/lib/format";
import type { SidebarProject } from "@/lib/queries/projects";
import type { TodoData } from "@/lib/queries/todos";
import type { ProfileSummary } from "@/types";

type Props = {
  user: ProfileSummary;
  todos: TodoData;
  projects: SidebarProject[];
};

/** Menu du cercle d'avatar : compte + liste de tâches (tickets assignés de tous les projets et tâches personnelles). */
export function UserMenu({ user, todos, projects }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const count = todos.tickets.length + todos.todos.length;
  const close = () => setOpen(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={count > 0 ? `Menu utilisateur, ${count} tâche${count > 1 ? "s" : ""} à faire` : "Menu utilisateur"}
        className="focus-visible:ring-ring relative rounded-full outline-none focus-visible:ring-2"
      >
        <UserAvatar user={user} />
        {count > 0 ? (
          <span
            aria-hidden
            className="bg-primary text-primary-foreground ring-background absolute -top-2 -right-2 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4 font-semibold ring-2"
          >
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(26rem,calc(100vw-1.5rem))] gap-0 p-0">
        <div className="flex items-center gap-3 p-3">
          <UserAvatar user={user} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{displayName(user)}</p>
            <p className="text-muted-foreground truncate text-xs">{user.email}</p>
          </div>
        </div>

        <div className="border-t p-3">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <ListChecks className="size-4" aria-hidden /> Ma liste de tâches
              {count > 0 ? (
                <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">{count}</span>
              ) : null}
            </h2>
            <Link href="/profil#taches" onClick={close} className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline">
              Gérer
            </Link>
          </div>
          <TodoList data={todos} projects={projects} variant="compact" onNavigate={close} />
        </div>

        <div className="flex items-center justify-between gap-2 border-t p-2">
          <Link href="/profil" onClick={close} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <UserCircle aria-hidden /> Mon profil
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={pending}
            onClick={() => startTransition(() => signOut())}
          >
            <LogOut aria-hidden /> Se déconnecter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
