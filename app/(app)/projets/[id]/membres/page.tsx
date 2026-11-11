import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { InviteDialog } from "@/components/members/invite-dialog";
import { MembersTable } from "@/components/members/members-table";
import { PendingInvitations } from "@/components/members/pending-invitations";
import { PageHeader } from "@/components/shared/page-header";
import { getProjectInvitations } from "@/lib/queries/invitations";
import { getProjectContext } from "@/lib/queries/projects";
import { getMembers } from "@/lib/queries/tickets";

export const metadata: Metadata = { title: "Membres" };

export default async function MembersPage({ params }: PageProps<"/projets/[id]/membres">) {
  const { id } = await params;
  const { role, userId } = await getProjectContext(id);
  const canManage = role === "owner" || role === "admin";

  const [members, invitations] = await Promise.all([getMembers(id), canManage ? getProjectInvitations(id) : Promise.resolve([])]);

  return (
    <>
      <PageHeader
        title="Membres"
        description={`${members.length} utilisateur${members.length > 1 ? "s" : ""} inscrit${members.length > 1 ? "s" : ""} : tous peuvent se voir assigner des tâches.`}
        actions={canManage ? <InviteDialog projectId={id} /> : null}
      />
      {!canManage ? (
        <p className="text-muted-foreground bg-muted/50 mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm">
          <ShieldCheck className="size-4 shrink-0" aria-hidden />
          Seuls le propriétaire et les administrateurs peuvent inviter des membres et gérer les rôles.
        </p>
      ) : null}
      <MembersTable projectId={id} members={members} currentUserId={userId} canManage={canManage} />
      {canManage ? <PendingInvitations invitations={invitations} /> : null}
    </>
  );
}
