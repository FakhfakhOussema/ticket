"use client";

import { CalendarIcon, X } from "lucide-react";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRIORITY_LABELS, STATUS_LABELS, TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/constants";
import { displayName, formatDate, isOverdue, toDate, toDateOnly } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProfileSummary, TicketPriority, TicketStatus } from "@/types";

type BaseProps = { id?: string; disabled?: boolean; className?: string };

export function StatusSelect({
  value,
  onChange,
  ...rest
}: BaseProps & { value: TicketStatus; onChange: (v: TicketStatus) => void }) {
  return (
    <Select
      value={value}
      onValueChange={(v) => v && onChange(v as TicketStatus)}
      items={TICKET_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
      disabled={rest.disabled}
    >
      <SelectTrigger id={rest.id} className={cn("w-full", rest.className)}>
        <SelectValue>{(v: TicketStatus) => <StatusBadge status={v} />}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {TICKET_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            <StatusBadge status={s} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PrioritySelect({
  value,
  onChange,
  ...rest
}: BaseProps & { value: TicketPriority; onChange: (v: TicketPriority) => void }) {
  return (
    <Select
      value={value}
      onValueChange={(v) => v && onChange(v as TicketPriority)}
      items={TICKET_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
      disabled={rest.disabled}
    >
      <SelectTrigger id={rest.id} className={cn("w-full", rest.className)}>
        <SelectValue>{(v: TicketPriority) => <PriorityBadge priority={v} />}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {TICKET_PRIORITIES.map((p) => (
          <SelectItem key={p} value={p}>
            <PriorityBadge priority={p} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const NONE = "__none__";

export function AssigneeSelect({
  value,
  onChange,
  members,
  ...rest
}: BaseProps & { value: string | null; onChange: (v: string | null) => void; members: ProfileSummary[] }) {
  const byId = new Map(members.map((m) => [m.id, m]));
  return (
    <Select
      value={value ?? NONE}
      onValueChange={(v) => onChange(!v || v === NONE ? null : v)}
      items={[{ value: NONE, label: "Non assigné" }, ...members.map((m) => ({ value: m.id, label: displayName(m) }))]}
      disabled={rest.disabled}
    >
      <SelectTrigger id={rest.id} className={cn("w-full", rest.className)}>
        <SelectValue>
          {(v: string) => {
            const m = v === NONE ? null : byId.get(v);
            return (
              <span className="flex items-center gap-2">
                <UserAvatar user={m ?? null} size="sm" />
                <span className="truncate">{m ? displayName(m) : "Non assigné"}</span>
              </span>
            );
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>
          <span className="flex items-center gap-2">
            <UserAvatar user={null} size="sm" /> Non assigné
          </span>
        </SelectItem>
        {members.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            <span className="flex items-center gap-2">
              <UserAvatar user={m} size="sm" />
              <span className="truncate">{displayName(m)}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DueDatePicker({
  value,
  onChange,
  status,
  ...rest
}: BaseProps & { value: string | null; onChange: (v: string | null) => void; status?: TicketStatus }) {
  const [open, setOpen] = useState(false);
  const late = status ? isOverdue(value, status) : false;

  return (
    <div className={cn("flex gap-1.5", rest.className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={<Button id={rest.id} type="button" variant="outline" disabled={rest.disabled} />}
          className={cn("h-8 flex-1 justify-start font-normal", !value && "text-muted-foreground", late && "border-red-300 text-red-600 dark:text-red-400")}
        >
          <CalendarIcon className="size-4" aria-hidden />
          {value ? formatDate(value, "EEEE d MMMM yyyy") : "Choisir une échéance"}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            locale={fr}
            weekStartsOn={1}
            selected={value ? toDate(value) : undefined}
            defaultMonth={value ? toDate(value) : undefined}
            onSelect={(d) => {
              onChange(d ? toDateOnly(d) : null);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {value && !rest.disabled ? (
        <Button type="button" variant="ghost" size="icon" onClick={() => onChange(null)} aria-label="Retirer l'échéance">
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
