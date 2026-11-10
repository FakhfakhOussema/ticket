import { createClient } from "@/lib/supabase/server";
import type { ProjectInvitation } from "@/types";

/** Invitations en attente adressées à l'utilisateur connecté (via la RPC SECURITY DEFINER). */
export async function getMyPendingInvitations() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_pending_invitations");
  return data ?? [];
}

/** Invitations en attente d'un projet (réservé aux owner/admin par la RLS). */
export async function getProjectInvitations(projectId: string): Promise<ProjectInvitation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_invitations")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getInvitationByToken(token: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_invitation_by_token", { p_token: token });
  return data?.[0] ?? null;
}
