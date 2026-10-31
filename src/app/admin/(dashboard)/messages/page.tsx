import type { Metadata } from "next";
import { MessageList } from "@/components/admin/MessageList";
import { listMessages } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const messages = await listMessages();
  return <MessageList messages={messages} />;
}
