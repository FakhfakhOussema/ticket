import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectSettings } from "@/components/settings/project-settings";
import { getProjectContext } from "@/lib/queries/projects";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage({ params }: PageProps<"/projets/[id]/parametres">) {
  const { id } = await params;
  const { project, role } = await getProjectContext(id);

  return (
    <>
      <PageHeader title="Paramètres" description="Gérez les informations et la sécurité du projet." />
      <ProjectSettings project={project} isOwner={role === "owner"} />
    </>
  );
}
