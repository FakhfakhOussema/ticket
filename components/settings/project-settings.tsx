"use client";

import { AlertTriangle, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectLogoForm } from "@/components/settings/project-logo-form";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteProject, updateProject } from "@/lib/actions/projects";
import type { Project } from "@/types";

export function ProjectSettings({ project, isOwner }: { project: Project; isOwner: boolean }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      const result = await deleteProject(project.id, typed);
      if (!result.ok) return void toast.error(result.error);
      toast.success(result.message ?? "Projet supprimé");
      setConfirmOpen(false);
      router.push("/projets");
    });

  return (
    <div className="grid max-w-3xl gap-6">
      <section className="bg-card rounded-2xl border p-5 shadow-xs sm:p-6">
        <h2 className="font-semibold">Informations générales</h2>
        <p className="text-muted-foreground mb-5 text-sm">Nom, description et couleur du projet.</p>
        {!isOwner ? (
          <p className="text-muted-foreground bg-muted/50 mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm">
            <Lock className="size-4 shrink-0" aria-hidden />
            Seul le propriétaire peut modifier les paramètres du projet.
          </p>
        ) : null}
        <div className="max-w-md">
          <ProjectForm
            key={`${project.updated_at}`}
            defaultValues={{ name: project.name, description: project.description ?? "", color: project.color }}
            submitLabel="Enregistrer"
            disabled={!isOwner}
            onSubmit={(values) => updateProject(project.id, values)}
            onSuccess={() => router.refresh()}
          />
        </div>
      </section>

      <ProjectLogoForm project={project} canEdit={isOwner} />

      {isOwner ? (
        <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5 sm:p-6 dark:border-red-500/30 dark:bg-red-500/5">
          <h2 className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-400">
            <AlertTriangle className="size-4" aria-hidden /> Zone de danger
          </h2>
          <p className="text-muted-foreground mt-1 mb-4 text-sm">
            La suppression du projet est définitive : tous ses tickets, commentaires et membres seront supprimés.
          </p>
          <Button
            variant="destructive"
            onClick={() => {
              setTyped("");
              setConfirmOpen(true);
            }}
          >
            Supprimer ce projet
          </Button>
        </section>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {project.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Pour confirmer, saisissez le nom du projet ci-dessous.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="confirm-name">
              Tapez <strong>{project.name}</strong>
            </Label>
            <Input id="confirm-name" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
            <Button variant="destructive" onClick={remove} disabled={pending || typed.trim() !== project.name}>
              {pending ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
