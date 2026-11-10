import type { Metadata } from "next";
import { PasswordForm, ProfileForm } from "@/components/profile/profile-forms";
import { PageHeader } from "@/components/shared/page-header";
import { TodoSection } from "@/components/todos/todo-section";
import { requireUser } from "@/lib/auth";
import { getSidebarProjects } from "@/lib/queries/projects";
import { getTodoData } from "@/lib/queries/todos";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mon profil" };

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: profile }, todos, projects] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, avatar_url").eq("id", user.id).maybeSingle(),
    getTodoData(user.id),
    getSidebarProjects(),
  ]);

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <PageHeader title="Mon profil" description="Gérez vos informations personnelles et votre mot de passe." />
      <ProfileForm profile={profile ?? { id: user.id, full_name: null, email: user.email ?? "", avatar_url: null }} />
      <TodoSection todos={todos} projects={projects} />
      <PasswordForm />
    </div>
  );
}
