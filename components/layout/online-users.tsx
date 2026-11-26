"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { displayName } from "@/lib/format";
import type { SidebarProject } from "@/lib/queries/projects";
import { subscribeAuthenticated } from "@/lib/supabase/realtime";
import { cn } from "@/lib/utils";
import type { ProfileSummary } from "@/types";

/** Ce que chaque onglet publie sur le canal de présence. */
type PresenceMeta = ProfileSummary & { path: string; online_at: string };

const CHANNEL = "presence:online";
const MAX_AVATARS = 4;

const SECTIONS: Record<string, string> = { tickets: "Tickets", notes: "Notes", membres: "Membres", parametres: "Paramètres" };

/** « Projet X · Tickets » à partir du chemin de la page. */
function locationLabel(path: string, projects: SidebarProject[]): string {
  if (path.startsWith("/profil")) return "Mon profil";
  const m = path.match(/^\/projets\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?/);
  if (!m) return "Mes projets";
  const name = projects.find((p) => p.id === m[1])?.name ?? "Un projet";
  const section = m[2] === "tickets" && m[3] ? "Un ticket" : (SECTIONS[m[2] ?? ""] ?? "Tableau de bord");
  return `${name} · ${section}`;
}

/** Projet affiché (pour mettre en avant les personnes sur le même projet). */
const projectOf = (path: string) => path.match(/^\/projets\/([^/]+)/)?.[1] ?? null;

/**
 * Personnes connectées en ce moment (Supabase Realtime Presence), comme dans Google Docs ou Overleaf.
 * Plusieurs onglets d'une même personne = une seule entrée (clé de présence = id utilisateur).
 */
export function OnlineUsers({ user, projects }: { user: ProfileSummary; projects: SidebarProject[] }) {
  const pathname = usePathname();
  const [online, setOnline] = useState<PresenceMeta[]>([]);
  const [open, setOpen] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pathRef = useRef(pathname);

  useEffect(() => {
    const meta = (): PresenceMeta => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      avatar_url: user.avatar_url,
      path: pathRef.current,
      online_at: new Date().toISOString(),
    });

    const unsubscribe = subscribeAuthenticated(
      (supabase) => {
        const channel = supabase.channel(CHANNEL, { config: { presence: { key: user.id } } });
        channel.on("presence", { event: "sync" }, () => {
          const state = channel.presenceState<PresenceMeta>();
          // Une entrée par personne : l'onglet le plus récemment actif.
          setOnline(Object.values(state).map((metas) => metas.reduce((a, b) => (a.online_at >= b.online_at ? a : b))));
        });
        return channel;
      },
      (channel) => {
        channelRef.current = channel;
        void channel.track(meta());
      },
    );
    return () => {
      channelRef.current = null;
      unsubscribe();
    };
  }, [user.id, user.full_name, user.email, user.avatar_url]);

  // Publie la nouvelle page à chaque navigation.
  useEffect(() => {
    pathRef.current = pathname;
    void channelRef.current?.track({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      avatar_url: user.avatar_url,
      path: pathname,
      online_at: new Date().toISOString(),
    } satisfies PresenceMeta);
  }, [pathname, user.id, user.full_name, user.email, user.avatar_url]);

  const myProject = projectOf(pathname);
  const others = useMemo(
    () =>
      online
        .filter((u) => u.id !== user.id)
        // Les personnes sur le même projet que moi d'abord, puis par nom.
        .sort(
          (a, b) =>
            Number(projectOf(b.path) === myProject && !!myProject) - Number(projectOf(a.path) === myProject && !!myProject) ||
            displayName(a).localeCompare(displayName(b), "fr"),
        ),
    [online, user.id, myProject],
  );

  if (others.length === 0) return null;

  const visible = others.slice(0, MAX_AVATARS);
  const hidden = others.length - visible.length;
  const label = `${others.length} autre${others.length > 1 ? "s" : ""} personne${others.length > 1 ? "s" : ""} en ligne`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={label}
        title={label}
        className="focus-visible:ring-ring hover:bg-muted/60 hidden items-center rounded-full py-0.5 pr-1 pl-0.5 outline-none focus-visible:ring-2 sm:flex"
      >
        <span className="flex -space-x-2">
          {visible.map((u) => (
            <span key={u.id} className="relative">
              <UserAvatar user={u} size="sm" className="ring-background ring-2" />
              <span className="ring-background absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-emerald-500 ring-2" aria-hidden />
            </span>
          ))}
          {hidden > 0 ? (
            <span className="bg-muted text-muted-foreground ring-background relative flex size-6 items-center justify-center rounded-full text-[10px] font-semibold ring-2">
              +{hidden}
            </span>
          ) : null}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-72 gap-0 p-0">
        <p className="text-muted-foreground flex items-center gap-2 border-b px-3 py-2.5 text-xs font-medium">
          <span className="size-2 rounded-full bg-emerald-500" aria-hidden />
          En ligne maintenant · {others.length + 1}
        </p>
        <ul className="max-h-80 overflow-y-auto p-1.5">
          {others.map((u) => {
            const sameProject = !!myProject && projectOf(u.path) === myProject;
            return (
              <li key={u.id}>
                <Link
                  href={u.path}
                  onClick={() => setOpen(false)}
                  title="Aller sur la même page"
                  className="hover:bg-muted focus-visible:ring-ring flex items-center gap-2.5 rounded-md px-2 py-1.5 outline-none focus-visible:ring-2"
                >
                  <span className="relative shrink-0">
                    <UserAvatar user={u} size="sm" />
                    <span className="ring-popover absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-emerald-500 ring-2" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{displayName(u)}</span>
                    <span className={cn("block truncate text-xs", sameProject ? "text-primary" : "text-muted-foreground")}>
                      {locationLabel(u.path, projects)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
          <li className="text-muted-foreground flex items-center gap-2.5 px-2 py-1.5">
            <UserAvatar user={user} size="sm" className="opacity-70" />
            <span className="truncate text-sm">{displayName(user)} (vous)</span>
          </li>
        </ul>
      </PopoverContent>
    </Popover>
  );
}
