"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeAuthenticated } from "@/lib/supabase/realtime";
import type { ProfileSummary, Ticket, TicketWithPeople } from "@/types";

/**
 * État local des tickets d'un projet, synchronisé en temps réel (Supabase Realtime).
 * La RLS s'applique aussi aux événements : on ne reçoit que les tickets des projets dont on est membre.
 */
export function useProjectTickets(projectId: string, initial: TicketWithPeople[], members: ProfileSummary[]) {
  const [tickets, setTickets] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    // Nouvelles données serveur (après un refresh) : on repart d'elles.
    setPrevInitial(initial);
    setTickets(initial);
  }

  const membersRef = useRef(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  useEffect(() => {
    const hydrate = (row: Ticket): TicketWithPeople => {
      const find = (id: string | null) => membersRef.current.find((m) => m.id === id) ?? null;
      return { ...row, assignee: find(row.assignee_id), creator: find(row.created_by) };
    };

    return subscribeAuthenticated((supabase) =>
      supabase
      .channel(`project-tickets-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets", filter: `project_id=eq.${projectId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as Partial<Ticket>).id;
            if (id) setTickets((prev) => prev.filter((t) => t.id !== id));
            return;
          }
          const ticket = hydrate(payload.new as Ticket);
          setTickets((prev) =>
            prev.some((t) => t.id === ticket.id) ? prev.map((t) => (t.id === ticket.id ? ticket : t)) : [...prev, ticket],
          );
        },
      ),
    );
  }, [projectId]);

  const upsert = useCallback((ticket: TicketWithPeople) => {
    setTickets((prev) =>
      prev.some((t) => t.id === ticket.id) ? prev.map((t) => (t.id === ticket.id ? ticket : t)) : [...prev, ticket],
    );
  }, []);

  const remove = useCallback((id: string) => setTickets((prev) => prev.filter((t) => t.id !== id)), []);

  return { tickets, setTickets, upsert, remove };
}
