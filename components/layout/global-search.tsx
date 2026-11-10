"use client";

import { Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { TicketStatus } from "@/types";

type Result = {
  id: string;
  title: string;
  status: TicketStatus;
  project_id: string;
  project: { name: string; color: string } | null;
};

/** Recherche globale de tickets (tous les projets de l'utilisateur ; la RLS limite les résultats). Raccourci : Ctrl/⌘ + K. */
export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ term: string; rows: Result[] } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const term = query.trim();
  const results = result?.term === term ? result.rows : [];
  const loading = term.length >= 2 && result?.term !== term;

  useEffect(() => {
    if (term.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const escaped = term.replace(/[\\%_]/g, (c) => `\\${c}`);
      const { data } = await supabase
        .from("tickets")
        .select("id, title, status, project_id, project:projects(name, color)")
        .ilike("title", `%${escaped}%`)
        .order("updated_at", { ascending: false })
        .limit(8);
      if (!cancelled) setResult({ term, rows: (data as Result[] | null) ?? [] });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  const go = (r: Result) => {
    setOpen(false);
    setQuery("");
    router.push(`/projets/${r.project_id}/tickets/${r.id}`);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hidden h-9 w-56 justify-start gap-2 bg-background font-normal lg:flex xl:w-72"
        aria-label="Rechercher un ticket"
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1 text-left">Rechercher un ticket…</span>
        <kbd className="bg-muted text-muted-foreground rounded border px-1.5 text-[10px] font-medium">Ctrl K</kbd>
      </Button>
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Rechercher un ticket">
        <Search className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader className="sr-only">
          <DialogTitle>Recherche de tickets</DialogTitle>
          <DialogDescription>Saisissez au moins 2 caractères pour chercher un ticket par son titre.</DialogDescription>
        </DialogHeader>
        <DialogContent className="top-1/4 translate-y-0 overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
          <Command shouldFilter={false}>
            <CommandInput placeholder="Rechercher un ticket par titre…" value={query} onValueChange={setQuery} />
            <CommandList>
              {loading ? (
                <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
                  <Loader2 className="size-4 animate-spin" /> Recherche…
                </div>
              ) : term.length < 2 ? (
                <div className="text-muted-foreground py-6 text-center text-sm">Saisissez au moins 2 caractères.</div>
              ) : results.length === 0 ? (
                <CommandEmpty>Aucun ticket trouvé.</CommandEmpty>
              ) : (
                <CommandGroup heading="Tickets">
                  {results.map((r) => (
                    <CommandItem key={r.id} value={r.id} onSelect={() => go(r)} className="gap-3">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.project?.color }} aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{r.title}</span>
                      <span className="text-muted-foreground hidden truncate text-xs sm:block">{r.project?.name}</span>
                      <StatusBadge status={r.status} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
