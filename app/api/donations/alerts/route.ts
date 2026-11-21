import { NextRequest, NextResponse } from "next/server";
import { getCache, invalidateCache } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  const profileId = req.nextUrl.searchParams.get("profileId");

  let targetId = profileId;

  if (!targetId && username) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { profile: true },
    });
    targetId = user?.profile?.id || null;
  }

  if (!targetId) {
    return NextResponse.json({ alert: null });
  }

  const streamKey = `donations:latest:${targetId}`;
  const latestDonation = await getCache<any>(streamKey);

  if (latestDonation) {
    // Consume alert so it doesn't replay indefinitely
    await invalidateCache(streamKey);
    return NextResponse.json({ alert: latestDonation });
  }

  return NextResponse.json({ alert: null });
}
