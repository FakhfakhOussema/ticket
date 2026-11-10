import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarColorClass, displayName, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

type AvatarUser = {
  id?: string | null;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

type Props = {
  user: AvatarUser | null | undefined;
  size?: "sm" | "default" | "lg";
  className?: string;
};

/** Avatar : photo si disponible, sinon initiales sur fond coloré (stable par utilisateur). */
export function UserAvatar({ user, size = "default", className }: Props) {
  const seed = user?.id ?? user?.email ?? user?.full_name;
  return (
    <Avatar size={size} className={className}>
      {user?.avatar_url ? <AvatarImage src={user.avatar_url} alt={displayName(user)} /> : null}
      <AvatarFallback className={cn("font-medium", user ? avatarColorClass(seed) : "bg-muted text-muted-foreground")}>
        {user ? initials(user) : "?"}
      </AvatarFallback>
    </Avatar>
  );
}
