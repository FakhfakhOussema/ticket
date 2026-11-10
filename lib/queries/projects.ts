import { cache } from "react";
import { notFound } from "next/navigation";
import { UUID_RE } from "@/lib/db-error";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Project, ProfileSummary, ProjectRole } from "@/types";

export type SidebarProject = Pick<Project, "id" | "name" | "color" | "icon" | "updated_at">;

/** Projets dont l'utilisateur est membre (la RLS filtre), pour la barre latérale. */
export const getSidebarProjects = cache(async (): Promise<SidebarProject[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("id, name, color, icon, updated_at").order("name");
  return data ?? [];
});

export type ProjectOverview = Project & {
  my_role: ProjectRole;
  tickets_total: number;
  tickets_done: number;
  tickets_open: number;
  member_count: number;
  members: ProfileSummary[];
};

/** Cartes de « Mes projets » : projet + compteurs de tickets + membres. */
export async function getProjectsOverview(): Promise<ProjectOverview[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: projects } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
  if (!projects?.length) return [];

  const ids = projects.map((p) => p.id);
  const [{ data: members }, { data: tickets }] = await Promise.all([
    supabase
      .from("project_members")
      .select("project_id, user_id, role, created_at, profile:profiles!project_members_user_id_fkey(id, full_name, email, avatar_url)")
      .in("project_id", ids)
      .order("created_at"),
    supabase.from("tickets").select("project_id, status").in("project_id", ids),
  ]);

  return projects.map((p) => {
    const projectMembers = (members ?? []).filter((m) => m.project_id === p.id);
    const projectTickets = (tickets ?? []).filter((t) => t.project_id === p.id);
    const done = projectTickets.filter((t) => t.status === "done").length;
    return {
      ...p,
      my_role: projectMembers.find((m) => m.user_id === user.id)?.role ?? "member",
      tickets_total: projectTickets.length,
      tickets_done: done,
      tickets_open: projectTickets.length - done,
      member_count: projectMembers.length,
      members: projectMembers.flatMap((m) => (m.profile ? [m.profile] : [])),
    };
  });
}

/** Projet + rôle de l'utilisateur ; 404 si le projet n'existe pas ou si l'utilisateur n'en est pas membre. */
export const getProjectContext = cache(async (projectId: string) => {
  if (!UUID_RE.test(projectId)) notFound();
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: project }, { data: membership }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
    supabase.from("project_members").select("role").eq("project_id", projectId).eq("user_id", user.id).maybeSingle(),
  ]);

  if (!project || !membership) notFound();
  return { project, role: membership.role, userId: user.id };
});
