import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="bg-primary/10 text-primary mb-4 flex size-14 items-center justify-center rounded-2xl">
        <Icon className="size-7" aria-hidden />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
