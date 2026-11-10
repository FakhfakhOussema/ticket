import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth";
import { getSidebarProjects } from "@/lib/queries/projects";
import { getTodoData } from "@/lib/queries/todos";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const supabase = await createClient();
  const [projects, todos, { data: profile }] = await Promise.all([
    getSidebarProjects(),
    getTodoData(user.id),
    supabase.from("profiles").select("id, full_name, email, avatar_url").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <AppShell
      user={profile ?? { id: user.id, email: user.email ?? "", full_name: null, avatar_url: null }}
      projects={projects}
      todos={todos}
    >
      {children}
    </AppShell>
  );
}
