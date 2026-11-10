import { isMissingTable } from "@/lib/db-error";
import { PROFILE_COLUMNS } from "@/lib/queries/tickets";
import { createClient } from "@/lib/supabase/server";
import type { ProfileSummary, ProjectNote } from "@/types";

export type NoteWithAuthor = ProjectNote & { author: ProfileSummary | null };

export const NOTE_SELECT = `*, author:profiles!project_notes_created_by_fkey(${PROFILE_COLUMNS})`;

/** Notes d'un projet. `available: false` si la migration des notes n'a pas encore été appliquée. */
export async function getNotes(projectId: string): Promise<{ notes: NoteWithAuthor[]; available: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_notes")
    .select(NOTE_SELECT)
    .eq("project_id", projectId)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  if (isMissingTable(error)) return { notes: [], available: false };
  return { notes: data ?? [], available: true };
}
