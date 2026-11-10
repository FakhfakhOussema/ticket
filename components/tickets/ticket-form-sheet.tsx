"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/forms/field";
import { AssigneeSelect, DueDatePicker, PrioritySelect, StatusSelect } from "@/components/tickets/ticket-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { createTicket, updateTicket } from "@/lib/actions/tickets";
import { TICKET_IMAGE_MAX_COUNT, TICKET_IMAGE_TYPES } from "@/lib/ticket-image-config";
import { uploadTicketImages, validateTicketImage } from "@/lib/ticket-images-client";
import { ticketSchema, type TicketInput } from "@/lib/validations/ticket";
import type { ProfileSummary, TicketStatus, TicketWithPeople } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  members: ProfileSummary[];
  /** Ticket à modifier ; absent = création. */
  ticket?: TicketWithPeople | null;
  defaultStatus?: TicketStatus;
  currentUserId?: string;
  onSaved: (ticket: TicketWithPeople) => void;
};

const emptyValues = (status: TicketStatus = "todo"): TicketInput => ({
  title: "",
  description: "",
  status,
  priority: "medium",
  assignee_id: null,
  due_date: null,
});

export function TicketFormSheet({ open, onOpenChange, projectId, members, ticket, defaultStatus, onSaved }: Props) {
  const editing = !!ticket;
  const [pending, startTransition] = useTransition();
  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const imageInput = useRef<HTMLInputElement>(null);

  const clearImages = () => {
    setImages((prev) => {
      prev.forEach((i) => URL.revokeObjectURL(i.url));
      return [];
    });
  };
  const addImages = (files: File[]) => {
    const accepted: { file: File; url: string }[] = [];
    for (const file of files) {
      const problem = validateTicketImage(file);
      if (problem) toast.error(problem);
      else accepted.push({ file, url: URL.createObjectURL(file) });
    }
    setImages((prev) => [...prev, ...accepted].slice(0, TICKET_IMAGE_MAX_COUNT));
  };
  const removeImage = (url: string) =>
    setImages((prev) => {
      URL.revokeObjectURL(url);
      return prev.filter((i) => i.url !== url);
    });
  const handleOpenChange = (next: boolean) => {
    if (!next) clearImages();
    onOpenChange(next);
  };
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketInput>({ resolver: zodResolver(ticketSchema), defaultValues: emptyValues(defaultStatus) });

  // Réinitialise le formulaire à chaque ouverture (création ou modification d'un ticket donné).
  useEffect(() => {
    if (!open) return;
    reset(
      ticket
        ? {
            title: ticket.title,
            description: ticket.description ?? "",
            status: ticket.status,
            priority: ticket.priority,
            assignee_id: ticket.assignee_id,
            due_date: ticket.due_date,
          }
        : emptyValues(defaultStatus),
    );
  }, [open, ticket, defaultStatus, reset]);

  const submit = handleSubmit((values) => {
    startTransition(async () => {
      const result = ticket ? await updateTicket(ticket.id, values) : await createTicket(projectId, values);
      if (!result.ok) return void toast.error(result.error);
      toast.success(result.message ?? (editing ? "Ticket mis à jour" : "Ticket créé"));
      if (result.data) onSaved(result.data);
      // Création : envoi des images choisies, une fois le ticket créé
      if (!ticket && result.data && images.length > 0) {
        const errors = await uploadTicketImages(result.data.id, images.map((i) => i.file));
        if (errors.length) toast.error(errors[0]);
        else toast.success(images.length > 1 ? `${images.length} images ajoutées` : "Image ajoutée");
      }
      handleOpenChange(false);
    });
  });

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{editing ? "Modifier le ticket" : "Nouveau ticket"}</SheetTitle>
          <SheetDescription>
            {editing ? "Mettez à jour les informations du ticket." : "Décrivez le travail à effectuer."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="grid flex-1 content-start gap-4 overflow-y-auto p-4">
            <Field label="Titre" htmlFor="ticket-title" error={errors.title?.message}>
              <Input id="ticket-title" autoFocus placeholder="Ex. Corriger le bug d'affichage" autoComplete="off" {...register("title")} />
            </Field>
            <Field label="Description" htmlFor="ticket-description" error={errors.description?.message} hint="Facultatif.">
              <Textarea id="ticket-description" rows={5} placeholder="Contexte, étapes, critères d'acceptation…" {...register("description")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Statut" htmlFor="ticket-status" error={errors.status?.message}>
                <Controller control={control} name="status" render={({ field }) => <StatusSelect id="ticket-status" value={field.value} onChange={field.onChange} />} />
              </Field>
              <Field label="Priorité" htmlFor="ticket-priority" error={errors.priority?.message}>
                <Controller control={control} name="priority" render={({ field }) => <PrioritySelect id="ticket-priority" value={field.value} onChange={field.onChange} />} />
              </Field>
            </div>
            <Field label="Assigné à" htmlFor="ticket-assignee" error={errors.assignee_id?.message}>
              <Controller
                control={control}
                name="assignee_id"
                render={({ field }) => <AssigneeSelect id="ticket-assignee" value={field.value} onChange={field.onChange} members={members} />}
              />
            </Field>
            <Field label="Échéance" htmlFor="ticket-due" error={errors.due_date?.message}>
              <Controller
                control={control}
                name="due_date"
                render={({ field }) => <DueDatePicker id="ticket-due" value={field.value} onChange={field.onChange} />}
              />
            </Field>
            {!editing ? (
              <div className="grid gap-2">
                <span className="text-sm leading-none font-medium">Images</span>
                <input
                  ref={imageInput}
                  type="file"
                  multiple
                  accept={TICKET_IMAGE_TYPES.join(",")}
                  className="sr-only"
                  aria-label="Choisir des images"
                  onChange={(e) => {
                    addImages(Array.from(e.target.files ?? []));
                    e.target.value = "";
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {images.map((img, i) => (
                    <div key={img.url} className="relative size-16 overflow-hidden rounded-lg border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={`Image ${i + 1} à joindre`} className="bg-muted size-full object-contain" />
                      <button
                        type="button"
                        onClick={() => removeImage(img.url)}
                        aria-label={`Retirer l'image ${i + 1}`}
                        className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => imageInput.current?.click()}
                    className="text-muted-foreground hover:border-primary/50 hover:text-foreground flex size-16 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed text-[11px] transition-colors"
                  >
                    <ImagePlus className="size-5" aria-hidden /> Ajouter
                  </button>
                </div>
                <p className="text-muted-foreground text-xs">Facultatif. PNG, JPG, WebP ou GIF, 8 Mo maximum par image.</p>
              </div>
            ) : null}
          </div>
          <div className="flex justify-end gap-2 border-t p-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : editing ? "Enregistrer" : "Créer le ticket"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
