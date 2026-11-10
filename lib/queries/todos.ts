import { isMissingTable } from "@/lib/db-error";
import { createClient } from "@/lib/supabase/server";
import type { TicketPriority, TicketStatus } from "@/types";

export type TodoProject = { id: string; name: string; color: string };

/** Ticket non terminé assigné à l'utilisateur (tous projets confondus). */
export type AssignedTicketItem = {
  id: string;
  title: string;
  due_date: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  project_id: string;
  project: TodoProject | null;
};

/** Tâche ajoutée par l'utilisateur : liée à un projet (couleur du projet) ou personnelle (project = null). */
export type TodoRow = {
  id: string;
  title: string;
  due_date: string | null;
  done: boolean;
  project_id: string | null;
  project: TodoProject | null;
};

export type TodoData = {
  tickets: AssignedTicketItem[];
  todos: TodoRow[];
  doneTodos: TodoRow[];
  /** false tant que la migration `user_todos` n'a pas été appliquée. */
  available: boolean;
};

const PROJECT_EMBED = "project:projects(id, name, color)";

export async function getTodoData(userId: string): Promise<TodoData> {
  const supabase = await createClient();

  const [ticketsRes, todosRes, doneRes] = await Promise.all([
    supabase
      .from("tickets")
      .select(`id, title, due_date, status, priority, project_id, ${PROJECT_EMBED}`)
      .eq("assignee_id", userId)
      .neq("status", "done")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("user_todos")
      .select(`id, title, due_date, done, project_id, ${PROJECT_EMBED}`)
      .eq("done", false)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("user_todos")
      .select(`id, title, due_date, done, project_id, ${PROJECT_EMBED}`)
      .eq("done", true)
      .order("done_at", { ascending: false })
      .limit(15),
  ]);

  return {
    tickets: ticketsRes.data ?? [],
    todos: todosRes.data ?? [],
    doneTodos: doneRes.data ?? [],
    available: !isMissingTable(todosRes.error),
  };
}
