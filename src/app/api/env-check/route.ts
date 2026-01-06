import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    publishable: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secret: !!process.env.CLERK_SECRET_KEY,
  });
}

