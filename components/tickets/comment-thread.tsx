"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquare, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment, deleteComment } from "@/lib/actions/tickets";
import { displayName, formatDateTime, timeAgo } from "@/lib/format";
import type { CommentWithAuthor } from "@/lib/queries/tickets";
import { subscribeAuthenticated } from "@/lib/supabase/realtime";
import { commentSchema, type CommentInput } from "@/lib/validations/ticket";
import type { ProfileSummary, TicketComment } from "@/types";

type Props = {
  ticketId: string;
  initialComments: CommentWithAuthor[];
  members: ProfileSummary[];
  currentUser: ProfileSummary;
  canModerate: boolean;
};

export function CommentThread({ ticketId, initialComments, members, currentUser, canModerate }: Props) {
  const [comments, setComments] = useState(initialComments);
  const [pending, startTransition] = useTransition();
  const membersRef = useRef(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentInput>({ resolver: zodResolver(commentSchema), defaultValues: { body: "" } });

  // Commentaires en temps réel
  useEffect(() => {
    return subscribeAuthenticated((supabase) =>
      supabase
      .channel(`ticket-comments-${ticketId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ticket_comments", filter: `ticket_id=eq.${ticketId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as Partial<TicketComment>).id;
            if (id) setComments((prev) => prev.filter((c) => c.id !== id));
            return;
          }
          const row = payload.new as TicketComment;
          const withAuthor: CommentWithAuthor = { ...row, author: membersRef.current.find((m) => m.id === row.author_id) ?? null };
          setComments((prev) =>
            prev.some((c) => c.id === row.id) ? prev.map((c) => (c.id === row.id ? withAuthor : c)) : [...prev, withAuthor],
          );
        },
      ),
    );
  }, [ticketId]);

  const submit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await addComment(ticketId, values);
      if (!result.ok) return void toast.error(result.error);
      const created = result.data;
      if (created) setComments((prev) => (prev.some((c) => c.id === created.id) ? prev : [...prev, created]));
      toast.success(result.message ?? "Commentaire ajouté");
      reset({ body: "" });
    });
  });

  const remove = (id: string) =>
    startTransition(async () => {
      const result = await deleteComment(id);
      if (!result.ok) return void toast.error(result.error);
      setComments((prev) => prev.filter((c) => c.id !== id));
      toast.success(result.message ?? "Commentaire supprimé");
    });

  return (
    <section aria-labelledby="comments-title" className="grid gap-4">
      <h2 id="comments-title" className="flex items-center gap-2 font-semibold">
        <MessageSquare className="size-4" aria-hidden /> Commentaires
        <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium tabular-nums">{comments.length}</span>
      </h2>

      {comments.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-6 text-center text-sm">
          Aucun commentaire. Lancez la discussion !
        </p>
      ) : (
        <ul className="grid gap-4">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <UserAvatar user={c.author} />
              <div className="bg-card min-w-0 flex-1 rounded-xl border px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{displayName(c.author)}</span>
                  <time dateTime={c.created_at} title={formatDateTime(c.created_at)} className="text-muted-foreground text-xs">
                    {timeAgo(c.created_at)}
                  </time>
                  {c.author_id === currentUser.id || canModerate ? (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground ml-auto"
                      onClick={() => remove(c.id)}
                      disabled={pending}
                      aria-label="Supprimer le commentaire"
                    >
                      <Trash2 />
                    </Button>
                  ) : null}
                </div>
                <p className="mt-1 text-sm break-words whitespace-pre-wrap">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} noValidate className="flex gap-3">
        <UserAvatar user={currentUser} />
        <div className="grid flex-1 gap-2">
          <Textarea rows={3} placeholder="Écrire un commentaire…" aria-label="Nouveau commentaire" {...register("body")} />
          {errors.body ? (
            <p role="alert" className="text-destructive text-xs">
              {errors.body.message}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Envoi…" : "Commenter"}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
