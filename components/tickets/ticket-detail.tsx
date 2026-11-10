"use client";

import { ArrowLeft, Pencil, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { CommentThread } from "@/components/tickets/comment-thread";
import { TicketImages } from "@/components/tickets/ticket-images";
import { DeleteTicketDialog } from "@/components/tickets/delete-ticket-dialog";
import { TicketFormSheet } from "@/components/tickets/ticket-form-sheet";
import { AssigneeSelect, DueDatePicker, PrioritySelect, StatusSelect } from "@/components/tickets/ticket-fields";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { updateTicket } from "@/lib/actions/tickets";
import { displayName, formatDateTime, timeAgo } from "@/lib/format";
import type { CommentWithAuthor } from "@/lib/queries/tickets";
import type { TicketImage } from "@/lib/ticket-image-config";
import { subscribeAuthenticated } from "@/lib/supabase/realtime";
import type { TicketPatch } from "@/lib/validations/ticket";
import type { ProfileSummary, Ticket, TicketWithPeople } from "@/types";

type Props = {
  projectId: string;
  initialTicket: TicketWithPeople;
  comments: CommentWithAuthor[];
  images: TicketImage[];
  members: ProfileSummary[];
  currentUser: ProfileSummary;
  isAdmin: boolean;
};

export function TicketDetail({ projectId, initialTicket, comments, images, members, currentUser, isAdmin }: Props) {
  const router = useRouter();
  const [ticket, setTicket] = useState(initialTicket);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<TicketWithPeople | null>(null);
  const [pending, startTransition] = useTransition();
  const membersRef = useRef(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  // Mises à jour en temps réel du ticket affiché
  useEffect(() => {
    return subscribeAuthenticated((supabase) =>
      supabase
      .channel(`ticket-${initialTicket.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets", filter: `id=eq.${initialTicket.id}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            toast.info("Ce ticket a été supprimé.");
            router.push(`/projets/${projectId}/tickets`);
            return;
          }
          const row = payload.new as Ticket;
          const find = (id: string | null) => membersRef.current.find((m) => m.id === id) ?? null;
          setTicket({ ...row, assignee: find(row.assignee_id), creator: find(row.created_by) });
        },
      ),
    );
  }, [initialTicket.id, projectId, router]);

  const patch = (changes: TicketPatch) => {
    const previous = ticket;
    // Mise à jour optimiste
    setTicket((t) => ({
      ...t,
      ...changes,
      description: changes.description !== undefined ? changes.description || null : t.description,
      assignee: changes.assignee_id !== undefined ? (members.find((m) => m.id === changes.assignee_id) ?? null) : t.assignee,
    }));
    startTransition(async () => {
      const result = await updateTicket(ticket.id, changes);
      if (!result.ok) {
        setTicket(previous);
        return void toast.error(result.error);
      }
      if (result.data) setTicket(result.data);
      toast.success("Ticket mis à jour");
    });
  };

  const canDelete = isAdmin || ticket.created_by === currentUser.id;

  return (
    <>
      <div className="mb-4">
        <Link href={`/projets/${projectId}/tickets`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="size-4" aria-hidden /> Retour aux tickets
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 content-start gap-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="min-w-0 text-2xl font-semibold tracking-tight break-words">{ticket.title}</h1>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" aria-hidden /> Modifier
              </Button>
              {canDelete ? (
                <Button variant="destructive" onClick={() => setDeleting(ticket)}>
                  <Trash2 className="size-4" aria-hidden /> Supprimer
                </Button>
              ) : null}
            </div>
          </header>

          <section aria-labelledby="description-title" className="bg-card rounded-2xl border p-5">
            <h2 id="description-title" className="mb-2 text-sm font-semibold">
              Description
            </h2>
            {ticket.description ? (
              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{ticket.description}</p>
            ) : (
              <p className="text-muted-foreground text-sm">Aucune description.</p>
            )}
          </section>

          <TicketImages ticketId={ticket.id} initialImages={images} />

          <CommentThread
            ticketId={ticket.id}
            initialComments={comments}
            members={members}
            currentUser={currentUser}
            canModerate={isAdmin}
          />
        </div>

        <aside aria-label="Propriétés du ticket" className="bg-card grid h-fit content-start gap-4 rounded-2xl border p-5">
          <h2 className="text-sm font-semibold">Détails</h2>
          <div className="grid gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">Statut</span>
            <StatusSelect value={ticket.status} onChange={(status) => patch({ status })} disabled={pending} />
          </div>
          <div className="grid gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">Priorité</span>
            <PrioritySelect value={ticket.priority} onChange={(priority) => patch({ priority })} disabled={pending} />
          </div>
          <div className="grid gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">Assigné à</span>
            <AssigneeSelect value={ticket.assignee_id} onChange={(assignee_id) => patch({ assignee_id })} members={members} disabled={pending} />
            {!ticket.assignee_id ? (
              <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => patch({ assignee_id: currentUser.id })} disabled={pending}>
                <UserPlus aria-hidden /> M&apos;assigner ce ticket
              </Button>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">Échéance</span>
            <DueDatePicker value={ticket.due_date} status={ticket.status} onChange={(due_date) => patch({ due_date })} disabled={pending} />
          </div>

          <dl className="text-muted-foreground mt-1 grid gap-2 border-t pt-4 text-xs">
            <div className="flex items-center justify-between gap-2">
              <dt>Créé par</dt>
              <dd className="text-foreground flex items-center gap-1.5">
                <UserAvatar user={ticket.creator} size="sm" /> {displayName(ticket.creator)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt>Créé le</dt>
              <dd className="text-foreground">{formatDateTime(ticket.created_at)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt>Mis à jour</dt>
              <dd className="text-foreground">{timeAgo(ticket.updated_at)}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <TicketFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        projectId={projectId}
        members={members}
        ticket={ticket}
        onSaved={setTicket}
      />
      <DeleteTicketDialog
        ticket={deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        onDeleted={() => router.push(`/projets/${projectId}/tickets`)}
      />
    </>
  );
}
