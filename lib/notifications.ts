import "server-only";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";
import { escapeHtml, sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/env";
import { displayName, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { TicketWithPeople } from "@/types";

/**
 * Email à la personne assignée à un ticket.
 * Pas d'email quand on s'assigne soi-même un ticket.
 */
export async function notifyTicketAssigned(ticket: TicketWithPeople, assignerId: string): Promise<void> {
  const assignee = ticket.assignee;
  if (!assignee?.email || assignee.id === assignerId) return;

  const supabase = await createClient();
  const [{ data: project }, { data: assigner }] = await Promise.all([
    supabase.from("projects").select("name").eq("id", ticket.project_id).maybeSingle(),
    supabase.from("profiles").select("full_name, email").eq("id", assignerId).maybeSingle(),
  ]);

  const projectName = project?.name ?? "Projet";
  const assignerName = assigner ? displayName(assigner) : "Un membre du projet";
  const url = `${SITE_URL()}/projets/${ticket.project_id}/tickets/${ticket.id}`;
  const due = ticket.due_date ? formatDate(ticket.due_date) : null;
  const description = ticket.description?.trim() ? ticket.description.trim().slice(0, 500) : null;

  const rows: Array<[string, string]> = [
    ["Projet", projectName],
    ["Statut", STATUS_LABELS[ticket.status]],
    ["Priorité", PRIORITY_LABELS[ticket.priority]],
    ...(due ? ([["Échéance", due]] as Array<[string, string]>) : []),
    ["Assigné par", assignerName],
  ];

  const subject = `[${projectName}] Ticket assigné : ${ticket.title}`;

  const text = [
    `Bonjour ${displayName(assignee)},`,
    "",
    `${assignerName} vous a assigné un ticket :`,
    "",
    ticket.title,
    ...rows.map(([k, v]) => `${k} : ${v}`),
    ...(description ? ["", description] : []),
    "",
    `Voir le ticket : ${url}`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="fr">
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7">
    <tr><td style="padding:24px 28px">
      <p style="margin:0 0 12px;font-size:14px">Bonjour ${escapeHtml(displayName(assignee))},</p>
      <p style="margin:0 0 20px;font-size:14px"><strong>${escapeHtml(assignerName)}</strong> vous a assigné un ticket :</p>
      <h1 style="margin:0 0 16px;font-size:18px;line-height:1.4">${escapeHtml(ticket.title)}</h1>
      <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:13px;margin-bottom:16px">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:3px 16px 3px 0;color:#71717a">${escapeHtml(k)}</td><td style="padding:3px 0;font-weight:bold">${escapeHtml(v)}</td></tr>`,
          )
          .join("")}
      </table>
      ${
        description
          ? `<p style="margin:0 0 20px;padding:12px 14px;background:#f4f4f5;border-radius:8px;font-size:13px;line-height:1.5;white-space:pre-wrap">${escapeHtml(description)}</p>`
          : ""
      }
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:10px 18px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:bold">Voir le ticket</a>
    </td></tr>
  </table>
  <p style="max-width:560px;margin:12px auto 0;font-size:11px;color:#a1a1aa;text-align:center">Pilotis Ticket · notification automatique</p>
</body>
</html>`;

  await sendEmail({ to: assignee.email, subject, html, text });
}
