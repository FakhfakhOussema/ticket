import { ListChecks } from "lucide-react";
import { TodoList } from "@/components/todos/todo-list";
import type { SidebarProject } from "@/lib/queries/projects";
import type { TodoData } from "@/lib/queries/todos";

/** Section « Ma liste de tâches » des paramètres du compte (affichée aussi dans le menu de l'avatar). */
export function TodoSection({ todos, projects }: { todos: TodoData; projects: SidebarProject[] }) {
  return (
    <section id="taches" aria-labelledby="todo-title" className="bg-card scroll-mt-20 rounded-2xl border p-5 shadow-xs sm:p-6">
      <h2 id="todo-title" className="flex items-center gap-2 font-semibold">
        <ListChecks className="size-4" aria-hidden /> Ma liste de tâches
      </h2>
      <p className="text-muted-foreground mb-5 text-sm">
        Vos tickets assignés (de tous les projets, avec leur couleur) et vos propres tâches, liées à un projet ou personnelles. Elle s&apos;affiche aussi dans le menu de votre avatar.
      </p>
      <TodoList data={todos} projects={projects} variant="full" />
    </section>
  );
}
