"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/actions/auth";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export function RegisterForm({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: "", password: "", confirm_password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await signUp(values, next);
      if (!result) return;
      if (!result.ok) toast.error(result.error);
      else setConfirmation(result.message ?? "Compte créé.");
    });
  });

  if (confirmation) {
    return (
      <div className="grid gap-3 text-center" role="status">
        <MailCheck className="text-primary mx-auto size-10" />
        <p className="text-sm">{confirmation}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <Field label="Nom complet" htmlFor="full_name" error={errors.full_name?.message}>
        <Input id="full_name" autoComplete="name" placeholder="Camille Dupont" {...register("full_name")} />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" placeholder="vous@exemple.fr" {...register("email")} />
      </Field>
      <Field label="Mot de passe" htmlFor="password" error={errors.password?.message} hint="8 caractères minimum.">
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      <Field label="Confirmer le mot de passe" htmlFor="confirm_password" error={errors.confirm_password?.message}>
        <Input id="confirm_password" type="password" autoComplete="new-password" {...register("confirm_password")} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer mon compte"}
      </Button>
    </form>
  );
}
