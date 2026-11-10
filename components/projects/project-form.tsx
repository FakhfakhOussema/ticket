"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/forms/field";
import { ColorPicker } from "@/components/projects/color-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/actions/types";
import { DEFAULT_PROJECT_COLOR, projectSchema, type ProjectInput } from "@/lib/validations/project";

type Props = {
  defaultValues?: Partial<ProjectInput>;
  submitLabel: string;
  onSubmit: (values: ProjectInput) => Promise<ActionResult<{ id: string }>>;
  onSuccess?: (result: Extract<ActionResult<{ id: string }>, { ok: true }>) => void;
  onCancel?: () => void;
  disabled?: boolean;
};

export function ProjectForm({ defaultValues, submitLabel, onSubmit, onSuccess, onCancel, disabled }: Props) {
  const [pending, startTransition] = useTransition();
  const uid = useId();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      color: defaultValues?.color ?? DEFAULT_PROJECT_COLOR,
    },
  });

  const submit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await onSubmit(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.message) toast.success(result.message);
      onSuccess?.(result);
    });
  });

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <Field label="Nom du projet" htmlFor={`${uid}-name`} error={errors.name?.message}>
        <Input id={`${uid}-name`} placeholder="Ex. Refonte du site" autoComplete="off" disabled={disabled} {...register("name")} />
      </Field>
      <Field label="Description" htmlFor={`${uid}-description`} error={errors.description?.message} hint="Facultatif.">
        <Textarea
          id={`${uid}-description`}
          rows={3}
          placeholder="À quoi sert ce projet ?"
          disabled={disabled}
          {...register("description")}
        />
      </Field>
      <div className="grid gap-1.5">
        <span className="text-sm leading-none font-medium">Couleur</span>
        <Controller control={control} name="color" render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Annuler
          </Button>
        ) : null}
        <Button type="submit" disabled={pending || disabled}>
          {pending ? "Enregistrement…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
