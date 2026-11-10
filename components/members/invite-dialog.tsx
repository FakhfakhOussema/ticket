"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inviteMember } from "@/lib/actions/members";
import { ROLE_LABELS } from "@/lib/constants";
import { inviteSchema, type InviteInput } from "@/lib/validations/member";

const ROLE_ITEMS = [
  { value: "member", label: ROLE_LABELS.member },
  { value: "admin", label: ROLE_LABELS.admin },
];

export function InviteDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteInput>({ resolver: zodResolver(inviteSchema), defaultValues: { email: "", role: "member" } });

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setLink(null);
      setCopied(false);
      reset({ email: "", role: "member" });
    }
  };

  const submit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await inviteMember(projectId, values);
      if (!result.ok) return void toast.error(result.error);
      toast.success(result.message ?? "Invitation envoyée");
      if (result.data && !result.data.emailSent) setLink(result.data.link);
      else close(false);
    });
  });

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger render={<Button />}>
        <UserPlus className="size-4" aria-hidden /> Inviter un membre
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {link ? (
          <>
            <DialogHeader>
              <DialogTitle>Invitation créée</DialogTitle>
              <DialogDescription>
                Cette personne a déjà un compte : l&apos;invitation apparaîtra dans son espace « Mes projets ». Vous pouvez aussi lui envoyer ce lien directement.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Input readOnly value={link} aria-label="Lien d'invitation" onFocus={(e) => e.currentTarget.select()} />
              <Button type="button" variant="outline" onClick={copy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copié" : "Copier"}
              </Button>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => close(false)}>Terminer</Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Inviter un membre</DialogTitle>
              <DialogDescription>Un email d&apos;invitation sera envoyé. Le lien est valable 7 jours.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} noValidate className="grid gap-4">
              <Field label="Adresse email" htmlFor="invite-email" error={errors.email?.message}>
                <Input id="invite-email" type="email" autoComplete="off" placeholder="prenom@entreprise.fr" {...register("email")} />
              </Field>
              <Field label="Rôle" htmlFor="invite-role" error={errors.role?.message}>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => v && field.onChange(v)} items={ROLE_ITEMS}>
                      <SelectTrigger id="invite-role" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_ITEMS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <p className="text-muted-foreground -mt-1 text-xs">
                Les administrateurs peuvent inviter des membres et gérer les rôles. Les membres peuvent créer et modifier des tickets.
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => close(false)} disabled={pending}>
                  Annuler
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Envoi…" : "Envoyer l'invitation"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
