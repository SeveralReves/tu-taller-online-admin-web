import { NextResponse, NextRequest } from "next/server";

// Si el backend emite cookie HttpOnly "tutaller_session", la leemos aquí.
// Si usas JWT en client-storage, igualmente podemos proteger desde client guard.
// Para SSR fuerte, ideal validar con una endpoint interna.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = pathname.startsWith("/login") || pathname.startsWith("/_next") || pathname.startsWith("/api");
  if (isPublic) return NextResponse.next();

  // Rutas protegidas
  const session = req.cookies.get("tutaller_token") || req.cookies.get("tutaller_session");
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|favicon.ico).*)"],
};
