import { NextResponse } from "next/server";
import { getProfile } from "@/lib/queries";

/** /resume → the uploaded résumé PDF, so the public link never changes. */
export async function GET() {
  const profile = await getProfile();
  if (!profile?.resume) {
    return new NextResponse("No résumé has been uploaded yet.", {
      status: 404,
    });
  }
  return NextResponse.redirect(profile.resume.url, 307);
}
