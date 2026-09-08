import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import College from "@/lib/models/College";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// PATCH /api/gov/colleges/[id]/verify  → toggle verified flag
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = getCurrentUser();
  if (!user || user.role !== "gov") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await dbConnect();

  const college = await College.findById(params.id);
  if (!college)
    return NextResponse.json({ error: "College not found" }, { status: 404 });

  college.verified = !college.verified;
  await college.save();

  return NextResponse.json({
    ok: true,
    verified: college.verified,
    name: college.name,
  });
}
