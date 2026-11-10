import type { Metadata } from "next";
import { TicketDetail } from "@/components/tickets/ticket-detail";
import { createClient } from "@/lib/supabase/server";
import { getProjectContext } from "@/lib/queries/projects";
import { getComments, getMembers, getTicket, getTicketImages } from "@/lib/queries/tickets";

export async function generateMetadata({ params }: PageProps<"/projets/[id]/tickets/[ticketId]">): Promise<Metadata> {
  const { id, ticketId } = await params;
  await getProjectContext(id);
  const ticket = await getTicket(id, ticketId);
  return { title: ticket.title };
}

export default async function TicketPage({ params }: PageProps<"/projets/[id]/tickets/[ticketId]">) {
  const { id, ticketId } = await params;
  const { role, userId } = await getProjectContext(id);
  const [ticket, comments, members] = await Promise.all([getTicket(id, ticketId), getComments(ticketId), getMembers(id)]);
  const images = await getTicketImages(id, ticket.id);

  const supabase = await createClient();
  const { data: me } = await supabase.from("profiles").select("id, full_name, email, avatar_url").eq("id", userId).maybeSingle();

  return (
    <TicketDetail
      projectId={id}
      initialTicket={ticket}
      comments={comments}
      images={images}
      members={members.map((m) => m.profile)}
      currentUser={me ?? { id: userId, full_name: null, email: "", avatar_url: null }}
      isAdmin={role === "owner" || role === "admin"}
    />
  );
}
