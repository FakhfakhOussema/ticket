"use client";

import { Check } from "lucide-react";
import { PROJECT_COLORS } from "@/lib/ticket-ui";
import { cn } from "@/lib/utils";

const COLOR_NAMES: Record<string, string> = {
  "#4F46E5": "Indigo",
  "#0EA5E9": "Bleu ciel",
  "#10B981": "Émeraude",
  "#F59E0B": "Ambre",
  "#EF4444": "Rouge",
  "#EC4899": "Rose",
  "#8B5CF6": "Violet",
  "#14B8A6": "Turquoise",
  "#64748B": "Ardoise",
};

type Props = {
  value: string;
  onChange: (color: string) => void;
};

export function ColorPicker({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Couleur du projet" className="flex flex-wrap gap-2">
      {PROJECT_COLORS.map((color) => {
        const selected = value.toLowerCase() === color.toLowerCase();
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={COLOR_NAMES[color] ?? color}
            title={COLOR_NAMES[color] ?? color}
            onClick={() => onChange(color)}
            className={cn(
              "flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              selected ? "ring-2 ring-foreground/70" : "hover:scale-110",
            )}
            style={{ backgroundColor: color }}
          >
            {selected ? <Check className="size-4 text-white" aria-hidden /> : null}
          </button>
        );
      })}
    </div>
  );
}
