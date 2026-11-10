"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/actions/auth";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await requestPasswordReset(values);
      if (!result.ok) toast.error(result.error);
      else setSent(result.message ?? "Email envoyé.");
    });
  });

  if (sent) {
    return (
      <div className="grid gap-3 text-center" role="status">
        <MailCheck className="text-primary mx-auto size-10" />
        <p className="text-sm">{sent}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" placeholder="vous@exemple.fr" {...register("email")} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer le lien"}
      </Button>
    </form>
  );
}
