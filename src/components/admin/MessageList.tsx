"use client";

import { useState } from "react";
import { MailIcon, MailOpenIcon, ReplyIcon } from "lucide-react";
import { deleteMessage, setMessageRead } from "@/actions/admin/messages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MessageDTO } from "@/lib/admin-queries";
import { cn } from "@/lib/utils";
import { ConfirmDelete } from "./ConfirmDelete";
import { useAdminAction } from "./useAdminAction";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Oslo",
});

/**
 * Inbox: a disclosure per message. Opening an unread message marks it read.
 * Uses native <details> so it works with keyboard and screen readers as is.
 */
export function MessageList({ messages }: { messages: MessageDTO[] }) {
  const { pending, run } = useAdminAction();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const shown =
    filter === "unread" ? messages.filter((m) => !m.read) : messages;
  const unread = messages.filter((m) => !m.read).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            From the contact form. {unread} unread of {messages.length}.
          </p>
        </div>
        <div role="group" aria-label="Show" className="flex gap-1">
          {(["all", "unread"] as const).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? "secondary" : "ghost"}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {value === "all" ? "All" : "Unread"}
            </Button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
          {filter === "unread" ? "No unread messages." : "No messages yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3" aria-busy={pending}>
          {shown.map((message) => (
            <li key={message.id}>
              <details
                className={cn(
                  "bg-card group rounded-xl border",
                  !message.read && "border-primary/50",
                )}
                onToggle={(event) => {
                  if (event.currentTarget.open && !message.read) {
                    run(() => setMessageRead(message.id, true));
                  }
                }}
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  {message.read ? (
                    <MailOpenIcon
                      className="text-muted-foreground size-4"
                      aria-hidden
                    />
                  ) : (
                    <MailIcon className="text-primary size-4" aria-hidden />
                  )}
                  <span
                    className={cn(
                      "font-medium",
                      !message.read && "font-semibold",
                    )}
                  >
                    {message.name}
                  </span>
                  {!message.read && <Badge>New</Badge>}
                  <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm">
                    {message.subject || message.body.slice(0, 80)}
                  </span>
                  <time
                    dateTime={message.createdAt}
                    className="text-muted-foreground text-xs tabular-nums"
                  >
                    {dateFormat.format(new Date(message.createdAt))}
                  </time>
                </summary>
                <div className="border-t px-4 py-4">
                  <p className="text-muted-foreground mb-3 text-sm">
                    From {message.name} &lt;{message.email}&gt;
                    {message.subject && <> · {message.subject}</>}
                  </p>
                  <p className="text-sm leading-6 whitespace-pre-wrap">
                    {message.body}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <a
                        href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject || "Your message"}`)}`}
                      >
                        <ReplyIcon aria-hidden data-icon="inline-start" />
                        Reply by email
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        run(() => setMessageRead(message.id, !message.read))
                      }
                    >
                      Mark as {message.read ? "unread" : "read"}
                    </Button>
                    <ConfirmDelete
                      itemName={`message from ${message.name}`}
                      disabled={pending}
                      onConfirm={() => run(() => deleteMessage(message.id))}
                    />
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
