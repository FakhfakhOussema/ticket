import { Users } from "lucide-react";
import Link from "next/link";
import { RoleBadge } from "@/components/shared/badges";
import { ProjectAvatar } from "@/components/shared/project-avatar";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import type { ProjectOverview } from "@/lib/queries/projects";
import { pluralize } from "@/lib/format";

export function ProjectCard({ project }: { project: ProjectOverview }) {
  const percent = project.tickets_total ? Math.round((project.tickets_done / project.tickets_total) * 100) : 0;
  const extra = project.member_count - project.members.slice(0, 4).length;

  return (
    <Link
      href={`/projets/${project.id}`}
      className="group bg-card focus-visible:ring-ring relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: project.color }} aria-hidden />
      <div className="flex items-start gap-3">
        <ProjectAvatar project={project} size="size-10" className="text-base" />
        <div className="min-w-0 flex-1">
          <h3 className="group-hover:text-primary truncate font-semibold transition-colors">{project.name}</h3>
          <p className="text-muted-foreground line-clamp-2 min-h-10 text-sm">
            {project.description || "Aucune description."}
          </p>
        </div>
      </div>

      <div className="grid gap-1.5">
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>
            {project.tickets_total === 0
              ? "Aucun ticket"
              : `${pluralize(project.tickets_open, "ticket ouvert", "tickets ouverts")} sur ${project.tickets_total}`}
          </span>
          <span className="text-foreground font-medium tabular-nums">{percent} %</span>
        </div>
        <Progress value={percent} aria-label={`${percent} % de tickets terminés`} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AvatarGroup>
            {project.members.slice(0, 4).map((m) => (
              <UserAvatar key={m.id} user={m} size="sm" />
            ))}
            {extra > 0 ? (
              <Avatar size="sm">
                <AvatarFallback className="bg-muted text-[10px] font-medium">+{extra}</AvatarFallback>
              </Avatar>
            ) : null}
          </AvatarGroup>
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Users className="size-3.5" aria-hidden />
            {project.member_count}
          </span>
        </div>
        <RoleBadge role={project.my_role} />
      </div>
    </Link>
  );
}
