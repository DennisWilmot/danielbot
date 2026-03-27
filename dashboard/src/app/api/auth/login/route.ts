import { NextResponse } from "next/server";
import { validateCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (validateCredentials(username, password)) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  }

  return NextResponse.json(
    { error: "Invalid credentials" },
    { status: 401 }
  );
}
