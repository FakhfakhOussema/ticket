import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Chargement des paramètres" className="grid max-w-3xl gap-6">
      <div className="grid gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
    </div>
  );
}
