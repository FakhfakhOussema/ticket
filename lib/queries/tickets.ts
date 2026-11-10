import { notFound } from "next/navigation";
import { UUID_RE } from "@/lib/db-error";
import { createClient } from "@/lib/supabase/server";
import { fetchTicketImages } from "@/lib/ticket-images";
import type { MemberWithProfile, ProjectDashboard, TicketComment, TicketWithPeople, ProfileSummary } from "@/types";

export const PROFILE_COLUMNS = "id, full_name, email, avatar_url";

const TICKET_SELECT = `*,
  assignee:profiles!tickets_assignee_id_fkey(${PROFILE_COLUMNS}),
  creator:profiles!tickets_created_by_fkey(${PROFILE_COLUMNS})`;

export async function getMembers(projectId: string): Promise<MemberWithProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_members")
    .select(`*, profile:profiles!project_members_user_id_fkey(${PROFILE_COLUMNS})`)
    .eq("project_id", projectId)
    .order("created_at");
  return (data ?? []).flatMap((m) => (m.profile ? [{ ...m, profile: m.profile }] : []));
}

export async function getTickets(projectId: string): Promise<TicketWithPeople[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select(TICKET_SELECT)
    .eq("project_id", projectId)
    .order("position")
    .order("created_at");
  return data ?? [];
}

export async function getTicket(projectId: string, ticketId: string): Promise<TicketWithPeople> {
  if (!UUID_RE.test(ticketId)) notFound();
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select(TICKET_SELECT)
    .eq("id", ticketId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!data) notFound();
  return data;
}

export type CommentWithAuthor = TicketComment & { author: ProfileSummary | null };

export async function getComments(ticketId: string): Promise<CommentWithAuthor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ticket_comments")
    .select(`*, author:profiles!ticket_comments_author_id_fkey(${PROFILE_COLUMNS})`)
    .eq("ticket_id", ticketId)
    .order("created_at");
  return data ?? [];
}

export async function getDashboard(projectId: string): Promise<ProjectDashboard> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_project_dashboard", { p_project_id: projectId });
  if (error || !data) throw new Error(error?.message ?? "Impossible de charger le tableau de bord.");
  return data as unknown as ProjectDashboard;
}

/** Tickets non terminés assignés à l'utilisateur, triés par échéance (sans échéance en dernier). */
export async function getMyTasks(projectId: string, userId: string): Promise<TicketWithPeople[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select(TICKET_SELECT)
    .eq("project_id", projectId)
    .eq("assignee_id", userId)
    .neq("status", "done")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function getRecentTickets(projectId: string, limit = 8): Promise<TicketWithPeople[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select(TICKET_SELECT)
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/** Images du ticket (URLs signées). À appeler après getTicket(), qui vérifie l'accès via la RLS. */
export async function getTicketImages(projectId: string, ticketId: string) {
  return fetchTicketImages(projectId, ticketId);
}
