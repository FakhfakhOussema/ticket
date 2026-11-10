import { BarChart3, KanbanSquare, Users } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BrandLogo } from "@/components/shared/brand-logo";

const ADVANTAGES = [
  {
    icon: KanbanSquare,
    title: "Kanban et liste, au choix",
    text: "Glissez-déposez vos tickets entre les statuts ou filtrez-les en un clin d'œil.",
  },
  {
    icon: Users,
    title: "Toute l'équipe synchronisée",
    text: "Invitez vos collègues par email : les changements apparaissent en temps réel.",
  },
  {
    icon: BarChart3,
    title: "Un tableau de bord clair",
    text: "Avancement, retards et charge de chaque membre, calculés pour vous.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Pilotis Ticket, accueil" className="flex items-center gap-3 text-lg font-semibold tracking-tight">
            <BrandLogo className="h-14" />
            Ticket
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="text-muted-foreground text-center text-xs lg:hidden">
          Pilotis Ticket est une version de test, extraite de Pilotis ERP, où ce module sera intégré dans une version plus complète.
        </p>
      </div>

      <aside
        aria-label="Présentation de Pilotis Ticket"
        className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white lg:flex"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 size-[32rem] bg-[radial-gradient(closest-side,rgba(255,255,255,0.18),transparent)]"
        />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-24 size-[32rem] bg-[radial-gradient(closest-side,rgba(167,139,250,0.28),transparent)]" />

        <div className="relative">
          <span className="inline-flex rounded-md bg-white/15 px-3 py-1 text-xs font-medium tracking-wide uppercase backdrop-blur">
            Version test
          </span>
          <h2 className="mt-6 max-w-md text-4xl leading-tight font-semibold tracking-tight">
            Pilotez vos projets, sans friction.
          </h2>
          <p className="mt-3 max-w-md text-indigo-100">
            Un outil de tickets simple et rapide pour que votre équipe sache toujours qui fait quoi, et pour quand.
          </p>

          <ul className="mt-10 grid max-w-md gap-6">
            {ADVANTAGES.map((a) => (
              <li key={a.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <a.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="text-sm text-indigo-100">{a.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative max-w-md text-sm text-indigo-100">
          Pilotis Ticket est une version de test, extraite de Pilotis ERP, où ce module sera intégré dans une version plus complète.
        </p>
      </aside>
    </div>
  );
}
