"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteTicket } from "@/lib/actions/tickets";
import type { TicketWithPeople } from "@/types";

type Props = {
  ticket: TicketWithPeople | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: string) => void;
};

export function DeleteTicketDialog({ ticket, onOpenChange, onDeleted }: Props) {
  const [pending, startTransition] = useTransition();

  const confirm = () => {
    if (!ticket) return;
    startTransition(async () => {
      const result = await deleteTicket(ticket.id);
      if (!result.ok) return void toast.error(result.error);
      toast.success(result.message ?? "Ticket supprimé");
      onDeleted(ticket.id);
      onOpenChange(false);
    });
  };

  return (
    <AlertDialog open={!!ticket} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce ticket ?</AlertDialogTitle>
          <AlertDialogDescription>
            « {ticket?.title} » et tous ses commentaires seront définitivement supprimés. Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? "Suppression…" : "Supprimer"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
