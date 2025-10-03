// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";

/** Rutas públicas (no requieren sesión) */
const PUBLIC_PATHS = [
  "/login",
  "/_next",          // assets Next
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/api",            // si tienes /api internas públicas
  "/images",         // assets de /public/images
  "/docs",
  "/video",
];

/** Prefijos protegidos por rol */
function isAllowedByRole(path: string, role: string | null) {
  if (!role) return false;
  if (path.startsWith("/superadmin")) return role === "superadmin";
  if (path.startsWith("/workshop")) return role === "superadmin" || role === "admin";
  if (path.startsWith("/mechanics")) return role === "admin" || role === "mechanic";
  // dashboard general, profile, etc.
  return true;
}

/** ¿Es pública la ruta? */
function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  // 1) Deja pasar todo lo público
  if (isPublicPath(pathname)) return NextResponse.next();

  // 2) Revisa si hay cookie de sesión (JWT en cookie o tu cookie de sesión)
  const tokenCookie = req.cookies.get("tutaller_token")?.value;
  if (!tokenCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname); // para volver luego
    return NextResponse.redirect(url);
  }

  let role: string | null = null;
  try {
    const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        ...(tokenCookie ? { Authorization: `Bearer ${tokenCookie}` } : {}),
      },
      // En middleware estamos en runtime Edge; evita cachear
      cache: "no-store",
    });
    
    if (verifyRes.status === 200) {
      const data = (await verifyRes.json()) as { id: string; name: string; roles: Array<{role: string}>};
      role = data.roles[0]?.role || null;
    } else if (verifyRes.status === 401) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", encodeURIComponent(pathname));
      return NextResponse.redirect(url);
    } else {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", encodeURIComponent(pathname));
      return NextResponse.redirect(url);
    }
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", encodeURIComponent(pathname));
    return NextResponse.redirect(url);
  }

  // 4) Chequeo RBAC por prefijo
  if (!isAllowedByRole(pathname, role)) {
    // Si no tiene permiso, a home del dashboard o 403
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 5) (Opcional) Propaga el rol como header para que lo lean tus layouts/server components
  const requestHeaders = new Headers(req.headers);
  if (role) requestHeaders.set("x-user-role", role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // Aplica a todo menos los paths excluidos arriba por early return
  matcher: ["/((?!_next|.*\\..*).*)"], // ignora archivos con extensión (png, jpg, js, css), y _next
};
