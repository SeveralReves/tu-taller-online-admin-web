"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./Sidebar.module.css";
import { useAuth } from "@/app/providers/auth-provider";
import {
  Home, Wrench, Users, ClipboardList, Building2, Settings, LogOut,
} from "lucide-react"; 

type Role = "SUPER_ADMIN" | "WORKSHOP_ADMIN" | "MECHANIC";

type NavItem = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  roles: Role[];
  startsWith?: boolean; // marcar activo si pathname inicia por href
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: <Home size={18} />, roles: ["SUPER_ADMIN","WORKSHOP_ADMIN","MECHANIC"], startsWith: false },
  { label: "Super Admin", href: "/superadmin", icon: <Building2 size={18} />, roles: ["SUPER_ADMIN"], startsWith: true },
  { label: "Taller", href: "/workshop", icon: <Wrench size={18} />, roles: ["SUPER_ADMIN","WORKSHOP_ADMIN"], startsWith: true },
  { label: "Órdenes", href: "/workshop/orders", icon: <ClipboardList size={18} />, roles: ["SUPER_ADMIN","WORKSHOP_ADMIN","MECHANIC"], startsWith: true },
  { label: "Mecánicos", href: "/workshop/mechanics", icon: <Users size={18} />, roles: ["SUPER_ADMIN","WORKSHOP_ADMIN"], startsWith: true },
  { label: "Ajustes", href: "/settings", icon: <Settings size={18} />, roles: ["SUPER_ADMIN","WORKSHOP_ADMIN"], startsWith: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = (user?.role ?? "WORKSHOP_ADMIN") as Role;

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar_collapsed", next ? "1" : "0");
  };

  const items = useMemo(
    () => NAV_ITEMS.filter((n) => n.roles.includes(role)),
    [role]
  );

  const isActive = (href: string, startsWith?: boolean) => {
    if (pathname === href) return true;
    if (startsWith && pathname.startsWith(href + "/")) return true;
    return false;
  };

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles["is-collapsed"] + ' is-collapsed-aside' : ""}`}>
      <div className={styles.head}>
        <div className={styles.brand}>
          {/* Si tienes logo en /public/images/logo.svg */}
          <Link href="/" className={styles.brandLink} aria-label="Inicio">
            <span className={styles.brandMark} />
            {!collapsed && <span className={styles.brandText}>Tu Taller</span>}
          </Link>
        </div>
        <button onClick={toggle} className={styles.collapseBtn} aria-label="Colapsar">
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className={styles.nav}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive(item.href, item.startsWith) ? styles["navItem--active"] : ""} ${collapsed ? styles["brandlink-collapsed"] : ""}`}
          >
            <span className={styles.iconWrap}>{item.icon}</span>
            {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className={styles.footer}>
        {!collapsed && user && (
          <div className={styles.userBox} title={user.name}>
            <div className={styles.avatar}>{getInitials(user.name)}</div>
            <div className={styles.userMeta}>
              <div className={styles.userName}>{user.name}</div>
              <div className={styles.userRole}>{roleLabel(role)}</div>
            </div>
          </div>
        )}
        {collapsed && user && <div className={styles.avatarSmall} title={user.name}>{getInitials(user.name)}</div>}
        {/* <Link href="/login" className={styles.logoutLink} title="Salir">
          <LogOut size={18} />
          {!collapsed && <span>Salir</span>}
        </Link> */}
      </div>
    </div>
  );
}

function roleLabel(r: Role) {
  if (r === "SUPER_ADMIN") return "Super Admin";
  if (r === "WORKSHOP_ADMIN") return "Admin de Taller";
  return "Mecánico";
}

function getInitials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}
