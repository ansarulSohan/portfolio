"use server";

import { z } from "zod";
import { connectDB } from "@/lib/db";
import { clientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validation";
import { Message } from "@/models";

export type ContactFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<
        Record<"name" | "email" | "subject" | "body", string>
      >;
      /** Echo inputs back so a failed submit doesn't wipe what the visitor typed. */
      values?: Record<string, string>;
    };

const LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 }; // 5 messages per hour per IP

export async function sendContactMessage(
  _previous: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const raw = Object.fromEntries(
    ["name", "email", "subject", "body", "website"].map((key) => [
      key,
      String(formData.get(key) ?? ""),
    ]),
  );

  // Honeypot filled: almost certainly a bot. Pretend it worked so it doesn't retry.
  if (raw.website) {
    return {
      status: "success",
      message: "Thanks! Your message has been sent.",
    };
  }

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error).fieldErrors;
    const first = (key: keyof typeof flat) => flat[key]?.[0];
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        name: first("name") && "Please enter your name.",
        email: first("email") && "Please enter a valid email address.",
        subject:
          first("subject") && "Subject is too long (200 characters max).",
        body:
          first("body") && "Please write a message (up to 5,000 characters).",
      },
      values: raw,
    };
  }

  try {
    const ipHash = hashIp(await clientIp());
    const { allowed, retryAfterSeconds } = await rateLimit(
      `contact:${ipHash}`,
      LIMIT,
    );
    if (!allowed) {
      const minutes = Math.ceil(retryAfterSeconds / 60);
      return {
        status: "error",
        message: `Too many messages from your network. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
        values: raw,
      };
    }

    await connectDB();
    const { name, email, subject, body } = parsed.data;
    await Message.create({ name, email, subject, body, ipHash });
    return {
      status: "success",
      message: "Thanks! Your message has been sent. I'll get back to you soon.",
    };
  } catch (error) {
    console.error("Contact form failed", error);
    return {
      status: "error",
      message:
        "Something went wrong sending your message. Please try again, or email me directly.",
      values: raw,
    };
  }
}
