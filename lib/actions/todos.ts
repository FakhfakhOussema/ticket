"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { dbErrorMessage, isMissingTable, UUID_RE } from "@/lib/db-error";
import type { TodoRow } from "@/lib/queries/todos";
import { createClient } from "@/lib/supabase/server";
import { todoSchema, type TodoInput } from "@/lib/validations/todo";
import type { ActionResult } from "@/lib/actions/types";

const TODO_SELECT = "id, title, due_date, done, project_id, project:projects(id, name, color)";
const MIGRATION_MSG = "La liste de tâches n'est pas encore disponible : appliquez la migration 0006 dans Supabase.";

export async function createTodo(input: TodoInput): Promise<ActionResult<TodoRow>> {
  const user = await requireUser();
  const parsed = todoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_todos")
    .insert({ user_id: user.id, ...parsed.data })
    .select(TODO_SELECT)
    .single();
  if (isMissingTable(error)) return { ok: false, error: MIGRATION_MSG };
  if (error?.code === "42501") return { ok: false, error: "Vous n'êtes pas membre de ce projet." };
  if (error || !data) return { ok: false, error: dbErrorMessage(error, "Impossible d'ajouter la tâche.") };

  revalidatePath("/", "layout");
  return { ok: true, message: "Tâche ajoutée", data };
}

export async function setTodoDone(todoId: string, done: boolean): Promise<ActionResult> {
  await requireUser();
  if (!UUID_RE.test(todoId)) return { ok: false, error: "Tâche introuvable." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("user_todos").update({ done }).eq("id", todoId).select("id");
  if (error) return { ok: false, error: dbErrorMessage(error, "Impossible de modifier la tâche.") };
  if (!data?.length) return { ok: false, error: "Tâche introuvable." };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteTodo(todoId: string): Promise<ActionResult> {
  await requireUser();
  if (!UUID_RE.test(todoId)) return { ok: false, error: "Tâche introuvable." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("user_todos").delete().eq("id", todoId).select("id");
  if (error) return { ok: false, error: dbErrorMessage(error, "Impossible de supprimer la tâche.") };
  if (!data?.length) return { ok: false, error: "Tâche introuvable." };

  revalidatePath("/", "layout");
  return { ok: true, message: "Tâche supprimée" };
}
