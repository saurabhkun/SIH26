import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import College from "@/lib/models/College";

export const dynamic = "force-dynamic";

// GET /api/colleges — list all colleges (for gov portal)
export async function GET() {
  await dbConnect();
  const colleges = await College.find()
    .select("_id name tier district verified capabilities")
    .sort({ name: 1 })
    .lean();
  return NextResponse.json({ colleges });
}
