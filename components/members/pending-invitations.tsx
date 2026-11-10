"use client";

import { Copy, Mail, RotateCw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { RoleBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { resendInvitation, revokeInvitation } from "@/lib/actions/members";
import { timeAgo } from "@/lib/format";
import type { ProjectInvitation } from "@/types";

export function PendingInvitations({ invitations }: { invitations: ProjectInvitation[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const resend = (id: string) =>
    startTransition(async () => {
      const result = await resendInvitation(id);
      if (!result.ok) return void toast.error(result.error);
      toast.success(result.message ?? "Invitation renvoyée");
      router.refresh();
    });

  const revoke = (id: string) =>
    startTransition(async () => {
      const result = await revokeInvitation(id);
      if (!result.ok) return void toast.error(result.error);
      toast.success(result.message ?? "Invitation annulée");
      router.refresh();
    });

  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/invitations/${token}`);
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  };

  if (invitations.length === 0) return null;

  return (
    <section aria-labelledby="pending-title" className="mt-8">
      <h2 id="pending-title" className="mb-3 flex items-center gap-2 font-semibold">
        Invitations en attente
        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">{invitations.length}</span>
      </h2>
      <ul className="bg-card divide-y overflow-hidden rounded-2xl border shadow-xs">
        {invitations.map((inv) => {
          const expired = new Date(inv.expires_at) <= new Date();
          return (
            <li key={inv.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-full">
                <Mail className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 basis-56">
                <p className="truncate text-sm font-medium">{inv.email}</p>
                <p className="text-muted-foreground text-xs">
                  Envoyée {timeAgo(inv.created_at)} ·{" "}
                  {expired ? <span className="font-medium text-red-600 dark:text-red-400">expirée</span> : `expire ${timeAgo(inv.expires_at)}`}
                </p>
              </div>
              <RoleBadge role={inv.role} />
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={() => resend(inv.id)} disabled={pending}>
                  <RotateCw /> Renvoyer
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => copy(inv.token)} aria-label={`Copier le lien d'invitation de ${inv.email}`}>
                  <Copy />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => revoke(inv.id)} disabled={pending}>
                  <X /> Annuler
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
