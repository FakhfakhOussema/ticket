"use client";

import { LogOut, MoreHorizontal, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { RoleBadge } from "@/components/shared/badges";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { changeMemberRole, removeMember } from "@/lib/actions/members";
import { ROLE_LABELS } from "@/lib/constants";
import { displayName, formatDate } from "@/lib/format";
import type { MemberWithProfile, ProjectRole } from "@/types";

type Props = {
  projectId: string;
  members: MemberWithProfile[];
  currentUserId: string;
  canManage: boolean;
};

const ROLE_ITEMS = [
  { value: "member", label: ROLE_LABELS.member },
  { value: "admin", label: ROLE_LABELS.admin },
];

export function MembersTable({ projectId, members, currentUserId, canManage }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<MemberWithProfile | null>(null);

  const setRole = (userId: string, role: ProjectRole) =>
    startTransition(async () => {
      const result = await changeMemberRole(projectId, userId, role);
      if (!result.ok) return void toast.error(result.error);
      toast.success(result.message ?? "Rôle mis à jour");
      router.refresh();
    });

  const confirmRemove = () => {
    if (!target) return;
    const leaving = target.user_id === currentUserId;
    startTransition(async () => {
      const result = await removeMember(projectId, target.user_id);
      if (!result.ok) return void toast.error(result.error);
      toast.success(result.message ?? "Membre retiré");
      setTarget(null);
      if (leaving) router.push("/projets");
      else router.refresh();
    });
  };

  return (
    <>
      <div className="bg-card overflow-hidden rounded-2xl border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Membre</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead className="hidden sm:table-cell">Arrivée</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => {
              const isMe = m.user_id === currentUserId;
              const isOwner = m.role === "owner";
              const editable = canManage && !isOwner;
              const canRemove = (canManage && !isOwner) || (isMe && !isOwner);
              return (
                <TableRow key={m.user_id}>
                  <TableCell>
                    <span className="flex items-center gap-3">
                      <UserAvatar user={m.profile} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {displayName(m.profile)}
                          {isMe ? <span className="text-muted-foreground ml-1.5 text-xs font-normal">(vous)</span> : null}
                        </span>
                        <span className="text-muted-foreground block truncate text-xs md:hidden">{m.profile.email}</span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">{m.profile.email}</TableCell>
                  <TableCell>
                    {editable ? (
                      <Select
                        value={m.role}
                        onValueChange={(v) => v && v !== m.role && setRole(m.user_id, v as ProjectRole)}
                        items={ROLE_ITEMS}
                        disabled={pending}
                      >
                        <SelectTrigger size="sm" aria-label={`Rôle de ${displayName(m.profile)}`} className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_ITEMS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <RoleBadge role={m.role} />
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden whitespace-nowrap sm:table-cell">{formatDate(m.created_at)}</TableCell>
                  <TableCell>
                    {canRemove ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions pour ${displayName(m.profile)}`} />}>
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem variant="destructive" onClick={() => setTarget(m)}>
                            {isMe ? <LogOut /> : <UserMinus />} {isMe ? "Quitter le projet" : "Retirer du projet"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{target?.user_id === currentUserId ? "Quitter ce projet ?" : "Retirer ce membre ?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {target?.user_id === currentUserId
                ? "Vous n'aurez plus accès à ce projet, sauf si on vous invite à nouveau."
                : `${displayName(target?.profile)} n'aura plus accès à ce projet. Ses tickets assignés redeviendront non assignés.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmRemove} disabled={pending}>
              {pending ? "En cours…" : target?.user_id === currentUserId ? "Quitter" : "Retirer"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
