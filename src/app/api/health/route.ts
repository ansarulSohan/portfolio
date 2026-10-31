import mongoose from "mongoose";
import { connection } from "next/server";
import { connectDB } from "@/lib/db";

/**
 * Health check for Coolify: 200 when the app can reach MongoDB, 503 if not.
 * Reveals nothing beyond up/down.
 */
export async function GET() {
  // Always run at request time (never prerendered at build).
  await connection();
  try {
    await connectDB();
    await mongoose.connection.db?.admin().ping();
    return Response.json(
      { status: "ok", db: "up" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Health check failed", error);
    return Response.json(
      { status: "error", db: "down" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
