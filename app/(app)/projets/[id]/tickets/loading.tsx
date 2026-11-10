import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Chargement des tickets">
      <div className="mb-6 flex items-start justify-between">
        <div className="grid gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-muted/60 grid w-72 shrink-0 content-start gap-2 rounded-2xl p-2 xl:w-auto xl:flex-1">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
