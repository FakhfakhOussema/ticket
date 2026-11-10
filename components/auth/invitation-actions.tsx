"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut } from "@/lib/actions/auth";
import { acceptInvitation, completeInvitation, declineInvitation } from "@/lib/actions/invitations";
import { completeInvitationSchema, type CompleteInvitationInput } from "@/lib/validations/member";

/** Compte existant : accepter ou refuser. */
export function AcceptInvitationButtons({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-2">
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await acceptInvitation(token);
            if (!result.ok) return void toast.error(result.error);
            toast.success("Bienvenue dans le projet !");
            router.push(`/projets/${result.data?.projectId}`);
          })
        }
      >
        {pending ? "Un instant…" : "Rejoindre le projet"}
      </Button>
      <Button
        variant="ghost"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await declineInvitation(token);
            if (!result.ok) return void toast.error(result.error);
            toast.success("Invitation refusée");
            router.push("/projets");
          })
        }
      >
        Refuser l&apos;invitation
      </Button>
    </div>
  );
}

/** Nouvel invité : nom + mot de passe, puis acceptation et redirection vers le projet. */
export function CompleteInvitationForm({ token, defaultName }: { token: string; defaultName: string }) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteInvitationInput>({
    resolver: zodResolver(completeInvitationSchema),
    defaultValues: { full_name: defaultName, password: "", confirm_password: "" },
  });

  const submit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await completeInvitation(token, values);
      // En cas de succès, l'action redirige vers le projet.
      if (result && !result.ok) toast.error(result.error);
    });
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <Field label="Nom complet" htmlFor="full_name" error={errors.full_name?.message}>
        <Input id="full_name" autoComplete="name" {...register("full_name")} />
      </Field>
      <Field label="Mot de passe" htmlFor="password" error={errors.password?.message} hint="8 caractères minimum.">
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      <Field label="Confirmer le mot de passe" htmlFor="confirm_password" error={errors.confirm_password?.message}>
        <Input id="confirm_password" type="password" autoComplete="new-password" {...register("confirm_password")} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Création du compte…" : "Créer mon mot de passe et rejoindre"}
      </Button>
    </form>
  );
}

export function SwitchAccountButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="outline" className="w-full" disabled={pending} onClick={() => startTransition(() => signOut())}>
      Se connecter avec un autre compte
    </Button>
  );
}
