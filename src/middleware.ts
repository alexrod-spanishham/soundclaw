import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Generate session cookie if not present
  if (!request.cookies.get("soundclaw_session")) {
    const sessionId = crypto.randomUUID();
    response.cookies.set("soundclaw_session", sessionId, {
      httpOnly: false, // accessible from client JS for like hydration
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: "/",
    });
  }

  // Handle CORS preflight for API routes
  if (request.method === "OPTIONS" && request.nextUrl.pathname.startsWith("/api/v1")) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:md|txt|xml|json|ico|svg|png|jpg|jpeg|gif|webp|mp3|wav|ogg|flac)$).*)",
  ],
};
