"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Topbar.module.css";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Cookies from "js-cookie";
import Link from "next/link";
import { useAuth } from "@/app/providers/auth-provider";
import { Search, ChevronDown, LogOut } from "lucide-react";

export default function Topbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const crumbs = useMemo(() => makeBreadcrumbs(pathname), [pathname]);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const router = useRouter();

  const logout = async () => {
    try { await api.post("/auth/logout", {}, { silent: true }); } catch {}
    Cookies.remove("tutaller_token");
    router.push("/login");
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={c.href} className={styles.crumb}>
              {i < crumbs.length - 1 ? <Link href={c.href}>{c.label}</Link> : <span className={styles.crumbCurrent}>{c.label}</span>}
              {i < crumbs.length - 1 && <span className={styles.sep}>/</span>}
            </span>
          ))}
        </nav>
      </div>

      <div className={styles.right}>
        <form
          className={styles.search}
          onSubmit={(e) => { e.preventDefault(); /* implementa búsqueda global si quieres */ }}
        >
          <Search size={16} />
          <input placeholder="Buscar..." aria-label="Buscar" />
        </form>

        <div className={styles.user} ref={ref}>
          <button className={styles.userBtn} onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
            <div className={styles.avatar}>{getInitials(user?.name)}</div>
            <span className={styles.userName}>{user?.name ?? "Usuario"}</span>
            <ChevronDown size={16} />
          </button>
          {open && (
            <div className={styles.menu} role="menu">
              <Link href="/profile" className={styles.menuItem} role="menuitem">Mi perfil</Link>
              <button className={styles.menuItem} role="menuitem" onClick={logout}>
                <LogOut size={16} /> <span>Salir</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function makeBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [{ label: "Inicio", href: "/" }];
  let acc = "";
  for (const p of parts) {
    acc += "/" + p;
    if (p === "(dashboard)" || p === "(auth)") continue;
    crumbs.push({ label: prettify(p), href: acc });
  }
  return crumbs;
}

function prettify(seg: string) {
  if (!seg) return "";
  if (seg.startsWith("[") && seg.endsWith("]")) return "Detalle";
  return seg.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function getInitials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}
