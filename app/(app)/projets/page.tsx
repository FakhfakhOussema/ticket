import { FolderPlus } from "lucide-react";
import type { Metadata } from "next";
import { PendingInvitationsBanner } from "@/components/members/pending-invitations-banner";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getMyPendingInvitations } from "@/lib/queries/invitations";
import { getProjectsOverview } from "@/lib/queries/projects";

export const metadata: Metadata = { title: "Mes projets" };

export default async function ProjetsPage() {
  const [projects, invitations] = await Promise.all([getProjectsOverview(), getMyPendingInvitations()]);

  return (
    <>
      <PageHeader
        title="Mes projets"
        description="Les projets dont vous êtes membre."
        actions={projects.length > 0 ? <NewProjectDialog /> : null}
      />
      <PendingInvitationsBanner invitations={invitations} />
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title="Aucun projet pour l'instant"
          description="Créez un projet pour organiser vos tickets et inviter votre équipe."
          action={<NewProjectDialog label="Créer mon premier projet" />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </>
  );
}
