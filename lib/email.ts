import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Envoi d'emails applicatifs (notifications) via SMTP.
 * Supabase n'envoie que les emails d'authentification : pour le reste, on passe par notre propre SMTP
 * (ex. Gmail avec un mot de passe d'application, cf. README).
 *
 * Variables (serveur uniquement) : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM (optionnelle).
 * Si elles ne sont pas définies, les emails sont ignorés (avec un avertissement) : l'application continue de fonctionner.
 */

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) {
    console.warn("[email] SMTP non configuré (SMTP_HOST / SMTP_USER / SMTP_PASSWORD) : email non envoyé.");
    transporter = null;
    return null;
  }
  const port = Number(process.env.SMTP_PORT || 465);
  transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  return transporter;
}

export type Email = { to: string; subject: string; html: string; text: string };

/** Envoie un email. Ne lève jamais d'erreur : un échec d'envoi ne doit pas faire échouer l'action de l'utilisateur. */
export async function sendEmail(email: Email): Promise<boolean> {
  const t = getTransporter();
  if (!t) return false;
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || `Pilotis Ticket <${process.env.SMTP_USER}>`,
      ...email,
    });
    return true;
  } catch (error) {
    console.error("[email] Échec d'envoi à", email.to, error);
    return false;
  }
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
