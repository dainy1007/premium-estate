import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
} from "@/lib/admin-session";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/admin");
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword || !process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.redirect(
      new URL("/admin/login?error=config", request.url),
      303,
    );
  }

  if (password !== configuredPassword) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("error", "password");
    if (nextPath.startsWith("/admin")) loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl, 303);
  }

  const token = await createAdminSessionToken();
  const safeNextPath =
    nextPath.startsWith("/admin") && !nextPath.startsWith("/admin/login")
      ? nextPath
      : "/admin";
  const response = NextResponse.redirect(new URL(safeNextPath, request.url), 303);

  response.cookies.set(ADMIN_COOKIE_NAME, token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
