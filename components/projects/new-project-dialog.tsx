"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ComponentProps } from "react";
import { ProjectForm } from "@/components/projects/project-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createProject } from "@/lib/actions/projects";

type Props = {
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
  label?: string;
  onOpen?: () => void;
};

/** Bouton « Nouveau projet » + modale de création (nom, description, couleur). */
export function NewProjectDialog({ variant = "default", size = "default", className, label = "Nouveau projet", onOpen }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) onOpen?.();
      }}
    >
      <DialogTrigger render={<Button variant={variant} size={size} className={className} />}>
        <Plus className="size-4" aria-hidden />
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau projet</DialogTitle>
          <DialogDescription>Un projet regroupe les tickets et les membres d&apos;une même équipe.</DialogDescription>
        </DialogHeader>
        <ProjectForm
          submitLabel="Créer le projet"
          onSubmit={createProject}
          onCancel={() => setOpen(false)}
          onSuccess={(result) => {
            setOpen(false);
            if (result.data?.id) router.push(`/projets/${result.data.id}`);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
