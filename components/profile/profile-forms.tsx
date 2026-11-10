"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/forms/field";
import { AvatarCropper } from "@/components/profile/avatar-cropper";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePassword, removeAvatar, updateProfile, uploadAvatar } from "@/lib/actions/profile";
import {
  AVATAR_SOURCE_MAX_BYTES,
  AVATAR_TYPES,
  changePasswordSchema,
  profileSchema,
  type ChangePasswordInput,
  type ProfileInput,
} from "@/lib/validations/profile";
import type { ProfileSummary } from "@/types";

export function ProfileForm({ profile }: { profile: ProfileSummary }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, startSaving] = useTransition();
  const [uploading, startUploading] = useTransition();
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  // Libère l'URL temporaire de l'image choisie quand elle change ou quand le composant disparaît
  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: { full_name: profile.full_name ?? "" } });

  const submit = handleSubmit((values) =>
    startSaving(async () => {
      const result = await updateProfile(values);
      if (!result.ok) return void toast.error(result.error);
      toast.success(result.message ?? "Profil mis à jour");
      router.refresh();
    }),
  );

  // 1) Choix du fichier : on ouvre le recadrage (rien n'est envoyé à ce stade)
  const onFile = (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) return void toast.error("Format non pris en charge (PNG, JPG, WebP ou GIF).");
    if (file.size > AVATAR_SOURCE_MAX_BYTES) return void toast.error("L'image ne doit pas dépasser 15 Mo.");
    setCropSrc(URL.createObjectURL(file));
  };

  // 2) Après « Valider » : envoi de l'image carrée recadrée
  const onCropped = (file: File) => {
    const data = new FormData();
    data.append("file", file);
    startUploading(async () => {
      const result = await uploadAvatar(data);
      if (!result.ok) return void toast.error(result.error);
      toast.success(result.message ?? "Photo mise à jour");
      setCropSrc(null);
      router.refresh();
    });
  };

  const onRemove = () =>
    startUploading(async () => {
      const result = await removeAvatar();
      if (!result.ok) return void toast.error(result.error);
      toast.success(result.message ?? "Photo retirée");
      router.refresh();
    });

  return (
    <section className="bg-card rounded-2xl border p-5 shadow-xs sm:p-6">
      <AvatarCropper
        src={cropSrc}
        busy={uploading}
        onCancel={() => setCropSrc(null)}
        onConfirm={onCropped}
        onError={(message) => toast.error(message)}
      />
      <h2 className="font-semibold">Informations personnelles</h2>
      <p className="text-muted-foreground mb-5 text-sm">Votre nom et votre photo sont visibles par les membres de vos projets.</p>

      <div className="mb-6 flex items-center gap-4">
        <UserAvatar user={profile} size="lg" className="size-16 text-lg" />
        <div className="grid gap-2">
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={AVATAR_TYPES.join(",")}
              className="sr-only"
              id="avatar-input"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <Camera className="size-4" aria-hidden /> {uploading ? "Envoi…" : "Changer la photo"}
            </Button>
            {profile.avatar_url ? (
              <Button type="button" variant="ghost" disabled={uploading} onClick={onRemove}>
                <Trash2 className="size-4" aria-hidden /> Retirer
              </Button>
            ) : null}
          </div>
          <p className="text-muted-foreground text-xs">PNG, JPG, WebP ou GIF. Vous choisirez la zone carrée à conserver.</p>
        </div>
      </div>

      <form onSubmit={submit} noValidate className="grid max-w-md gap-4">
        <Field label="Nom complet" htmlFor="full_name" error={errors.full_name?.message}>
          <Input id="full_name" autoComplete="name" {...register("full_name")} />
        </Field>
        <Field label="Email" htmlFor="email" hint="L'adresse email ne peut pas être modifiée ici.">
          <Input id="email" value={profile.email} readOnly disabled />
        </Field>
        <div>
          <Button type="submit" disabled={saving || !isDirty}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </section>
  );
}

export function PasswordForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: "", confirm_password: "" },
  });

  const submit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await changePassword(values);
      if (!result.ok) return void toast.error(result.error);
      toast.success(result.message ?? "Mot de passe modifié");
      reset();
    }),
  );

  return (
    <section className="bg-card rounded-2xl border p-5 shadow-xs sm:p-6">
      <h2 className="font-semibold">Mot de passe</h2>
      <p className="text-muted-foreground mb-5 text-sm">Choisissez un mot de passe d&apos;au moins 8 caractères.</p>
      <form onSubmit={submit} noValidate className="grid max-w-md gap-4">
        <Field label="Nouveau mot de passe" htmlFor="new-password" error={errors.password?.message}>
          <Input id="new-password" type="password" autoComplete="new-password" {...register("password")} />
        </Field>
        <Field label="Confirmer le mot de passe" htmlFor="confirm-password" error={errors.confirm_password?.message}>
          <Input id="confirm-password" type="password" autoComplete="new-password" {...register("confirm_password")} />
        </Field>
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Changer le mot de passe"}
          </Button>
        </div>
      </form>
    </section>
  );
}
