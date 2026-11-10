"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { AvatarCropper } from "@/components/profile/avatar-cropper";
import { ProjectAvatar } from "@/components/shared/project-avatar";
import { Button } from "@/components/ui/button";
import { removeProjectLogo, uploadProjectLogo } from "@/lib/actions/projects";
import { PROJECT_LOGO_MARKER } from "@/lib/project-logo";
import { AVATAR_SOURCE_MAX_BYTES, AVATAR_TYPES } from "@/lib/validations/profile";
import type { Project } from "@/types";

export function ProjectLogoForm({ project, canEdit }: { project: Project; canEdit: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  const onFile = (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) return void toast.error("Format non pris en charge (PNG, JPG, WebP ou GIF).");
    if (file.size > AVATAR_SOURCE_MAX_BYTES) return void toast.error("L'image ne doit pas dépasser 15 Mo.");
    setCropSrc(URL.createObjectURL(file));
  };

  const onCropped = (file: File) => {
    const data = new FormData();
    data.append("file", file);
    startTransition(async () => {
      const result = await uploadProjectLogo(project.id, data);
      if (!result.ok) return void toast.error(result.error);
      toast.success(result.message ?? "Logo mis à jour");
      setCropSrc(null);
      router.refresh();
    });
  };

  const onRemove = () =>
    startTransition(async () => {
      const result = await removeProjectLogo(project.id);
      if (!result.ok) return void toast.error(result.error);
      toast.success(result.message ?? "Logo retiré");
      router.refresh();
    });

  return (
    <section className="bg-card rounded-2xl border p-5 shadow-xs sm:p-6">
      <AvatarCropper
        src={cropSrc}
        busy={pending}
        format="png"
        title="Recadrer le logo"
        onCancel={() => setCropSrc(null)}
        onConfirm={onCropped}
        onError={(message) => toast.error(message)}
      />
      <h2 className="font-semibold">Logo du projet</h2>
      <p className="text-muted-foreground mb-5 text-sm">
        Affiché dans la barre latérale, sur la carte du projet et dans le tableau de bord. Le logo est carré : vous choisissez la zone à conserver.
      </p>
      <div className="flex items-center gap-4">
        <ProjectAvatar project={project} size="size-16" className="text-2xl" />
        {canEdit ? (
          <div className="grid gap-2">
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                id="project-logo-input"
                type="file"
                accept={AVATAR_TYPES.join(",")}
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" disabled={pending} onClick={() => fileRef.current?.click()}>
                <ImagePlus className="size-4" aria-hidden /> {project.icon === PROJECT_LOGO_MARKER ? "Changer le logo" : "Ajouter un logo"}
              </Button>
              {project.icon === PROJECT_LOGO_MARKER ? (
                <Button type="button" variant="ghost" disabled={pending} onClick={onRemove}>
                  <Trash2 className="size-4" aria-hidden /> Retirer
                </Button>
              ) : null}
            </div>
            <p className="text-muted-foreground text-xs">PNG, JPG, WebP ou GIF. La transparence est conservée.</p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Seul le propriétaire peut modifier le logo.</p>
        )}
      </div>
    </section>
  );
}
