import { KanbanSquare, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AssigneePieChart } from "@/components/dashboard/assignee-pie-chart";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { MyTasks } from "@/components/dashboard/my-tasks";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatusBarChart } from "@/components/dashboard/status-bar-chart";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectAvatar } from "@/components/shared/project-avatar";
import { buttonVariants } from "@/components/ui/button";
import { buildChartRows } from "@/lib/dashboard";
import { getProjectContext } from "@/lib/queries/projects";
import { getDashboard, getMembers, getMyTasks, getRecentTickets } from "@/lib/queries/tickets";

export async function generateMetadata({ params }: PageProps<"/projets/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { project } = await getProjectContext(id);
  return { title: `${project.name} · Tableau de bord` };
}

export default async function ProjectDashboardPage({ params }: PageProps<"/projets/[id]">) {
  const { id } = await params;
  const { project, userId } = await getProjectContext(id);

  // Agrégats calculés côté base (RPC get_project_dashboard)
  const [dashboard, members, myTasks, recent] = await Promise.all([
    getDashboard(id),
    getMembers(id),
    getMyTasks(id, userId),
    getRecentTickets(id),
  ]);
  const rows = buildChartRows(dashboard, members);

  return (
    <>
      <PageHeader
        icon={<ProjectAvatar project={project} size="size-12" className="text-lg" />}
        title={project.name}
        description={project.description ?? "Vue d'ensemble de l'avancement du projet."}
        actions={
          <>
            <Link href={`/projets/${id}/tickets`} className={buttonVariants({ variant: "outline" })}>
              <KanbanSquare className="size-4" aria-hidden /> Voir les tickets
            </Link>
            <Link href={`/projets/${id}/tickets?nouveau=1`} className={buttonVariants()}>
              <Plus className="size-4" aria-hidden /> Nouveau ticket
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:gap-6">
        <KpiCards kpi={dashboard.kpi} />
        <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
          <AssigneePieChart rows={rows} total={dashboard.kpi.total} />
          <StatusBarChart rows={rows} />
        </div>
        <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
          <MyTasks projectId={id} tickets={myTasks} />
          <RecentActivity projectId={id} tickets={recent} />
        </div>
      </div>
    </>
  );
}
