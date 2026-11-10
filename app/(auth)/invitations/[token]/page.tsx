import { MailWarning, PartyPopper } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AcceptInvitationButtons, CompleteInvitationForm, SwitchAccountButton } from "@/components/auth/invitation-actions";
import { RoleBadge } from "@/components/shared/badges";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getInvitationByToken } from "@/lib/queries/invitations";

export const metadata: Metadata = { title: "Invitation" };

function Problem({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <span className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <MailWarning className="size-6" aria-hidden />
        </span>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{text}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {children}
        <Link href="/projets" className={buttonVariants({ variant: "outline" })}>
          Aller à mes projets
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function InvitationPage({ params }: PageProps<"/invitations/[token]">) {
  const { token } = await params;
  // Le proxy redirige déjà vers /connexion?next=… si l'utilisateur n'est pas connecté.
  const user = await requireUser();
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return <Problem title="Invitation introuvable" text="Ce lien d'invitation est invalide. Demandez à l'administrateur du projet de vous en envoyer un nouveau." />;
  }
  if (invitation.status !== "pending") {
    return <Problem title="Invitation déjà utilisée" text="Cette invitation a déjà été acceptée, refusée ou annulée." />;
  }
  if (new Date(invitation.expires_at) <= new Date()) {
    return <Problem title="Invitation expirée" text="Ce lien n'est plus valable. Demandez à l'administrateur du projet de vous en renvoyer un." />;
  }
  if ((user.email ?? "").toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <Problem
        title="Cette invitation est destinée à un autre compte"
        text={`Elle a été envoyée à ${invitation.email}, mais vous êtes connecté avec ${user.email}.`}
      >
        <SwitchAccountButton />
      </Problem>
    );
  }

  const needsPassword = user.user_metadata?.needs_password === true;
  const defaultName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <span className="bg-primary/10 text-primary mb-2 flex size-12 items-center justify-center rounded-2xl">
          <PartyPopper className="size-6" aria-hidden />
        </span>
        <CardTitle className="text-xl">Bienvenue !</CardTitle>
        <CardDescription>
          {invitation.invited_by_name ?? "Un membre"} vous invite à rejoindre le projet{" "}
          <strong className="text-foreground">{invitation.project_name}</strong>.
        </CardDescription>
        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
          Votre rôle : <RoleBadge role={invitation.role} />
        </div>
      </CardHeader>
      <CardContent>
        {needsPassword ? (
          <>
            <p className="text-muted-foreground mb-4 text-center text-sm">
              Créez votre mot de passe pour activer votre compte et accéder au projet.
            </p>
            <CompleteInvitationForm token={token} defaultName={defaultName} />
          </>
        ) : (
          <AcceptInvitationButtons token={token} />
        )}
      </CardContent>
    </Card>
  );
}
