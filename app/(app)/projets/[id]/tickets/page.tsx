import type { Metadata } from "next";
import { TicketsWorkspace } from "@/components/tickets/tickets-workspace";
import { getProjectContext } from "@/lib/queries/projects";
import { getMembers, getTickets } from "@/lib/queries/tickets";

export const metadata: Metadata = { title: "Tickets" };

export default async function TicketsPage({ params }: PageProps<"/projets/[id]/tickets">) {
  const { id } = await params;
  const { userId } = await getProjectContext(id);
  const [tickets, members] = await Promise.all([getTickets(id), getMembers(id)]);

  return (
    <TicketsWorkspace
      projectId={id}
      initialTickets={tickets}
      members={members.map((m) => m.profile)}
      currentUserId={userId}
    />
  );
}
