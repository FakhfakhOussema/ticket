"use client";

import { MailOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { RoleBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { acceptInvitation, declineInvitation } from "@/lib/actions/invitations";
import type { ProjectRole } from "@/types";

type Invitation = {
  id: string;
  token: string;
  project_id: string;
  project_name: string;
  role: ProjectRole;
  invited_by_name: string | null;
};

/** Invitations adressées à l'utilisateur connecté (cas d'un compte déjà existant). */
export function PendingInvitationsBanner({ invitations }: { invitations: Invitation[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hidden, setHidden] = useState<string[]>([]);
  const visible = invitations.filter((i) => !hidden.includes(i.id));
  if (visible.length === 0) return null;

  const accept = (inv: Invitation) =>
    startTransition(async () => {
      const result = await acceptInvitation(inv.token);
      if (!result.ok) return void toast.error(result.error);
      toast.success(`Vous avez rejoint « ${inv.project_name} »`);
      setHidden((h) => [...h, inv.id]);
      router.push(`/projets/${result.data?.projectId ?? inv.project_id}`);
    });

  const decline = (inv: Invitation) =>
    startTransition(async () => {
      const result = await declineInvitation(inv.token);
      if (!result.ok) return void toast.error(result.error);
      toast.success("Invitation refusée");
      setHidden((h) => [...h, inv.id]);
    });

  return (
    <section aria-label="Invitations en attente" className="mb-6 grid gap-2">
      {visible.map((inv) => (
        <div
          key={inv.id}
          className="border-primary/30 bg-primary/5 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center"
        >
          <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
            <MailOpen className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium">
              {inv.invited_by_name ?? "Un membre"} vous invite à rejoindre « {inv.project_name} »
            </p>
            <p className="text-muted-foreground mt-0.5 flex items-center gap-2">
              Rôle proposé : <RoleBadge role={inv.role} />
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => decline(inv)} disabled={pending}>
              Refuser
            </Button>
            <Button onClick={() => accept(inv)} disabled={pending}>
              Accepter
            </Button>
          </div>
        </div>
      ))}
    </section>
  );
}
