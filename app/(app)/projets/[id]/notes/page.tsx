import type { Metadata } from "next";
import { NotesBoard } from "@/components/notes/notes-board";
import { getNotes } from "@/lib/queries/notes";
import { getProjectContext } from "@/lib/queries/projects";

export const metadata: Metadata = { title: "Notes" };

export default async function NotesPage({ params }: PageProps<"/projets/[id]/notes">) {
  const { id } = await params;
  const { role, userId } = await getProjectContext(id);
  const { notes, available } = await getNotes(id);

  return (
    <NotesBoard
      projectId={id}
      initialNotes={notes}
      currentUserId={userId}
      isAdmin={role === "owner" || role === "admin"}
      available={available}
    />
  );
}
