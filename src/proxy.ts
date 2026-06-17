import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./lib/routing";

const GATE_COOKIE = "ep_gatekeeper";
const GATE_PATH = "/gate";

const intlMiddleware = createIntlMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always let the gate page and its actions through — prevents redirect loop
  if (pathname.startsWith(GATE_PATH)) {
    return NextResponse.next();
  }

  const password = process.env.GATEKEEPER_PASSWORD?.trim();
  if (password) {
    const cookie = request.cookies.get(GATE_COOKIE);
    if (cookie?.value !== "granted") {
      const url = request.nextUrl.clone();
      url.pathname = GATE_PATH;
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|plasmic-host|.*\\..*).*)"],
};
