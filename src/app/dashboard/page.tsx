/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import styles from "./dashboard.module.css";
import Link from "next/link";
import { useAuth } from "../providers/auth-provider";

type Metrics = {
  openOrders: number;
  inProgress: number;
  finishedToday: number;
  pendingEstimates: number;
};

type Order = {
  id: string;
  code: string;
  plate?: string;
  customer?: string;
  status: "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  createdAt: string;
};

export default function WorkshopOverview() {
  const { user } = useAuth();

  // Guard básico: solo admin/superadmin
  if (user && !["SUPER_ADMIN", "WORKSHOP_ADMIN"].includes(user.role)) {
    return <div className={styles.blocked}>No autorizado</div>;
  }

  // const { data: metrics, isLoading: mLoading } = useQuery<Metrics>({
  //   queryKey: ["workshop:metrics"],
  //   queryFn: async () => (await api.get("/workshop/metrics")).data,
  // });

  // const { data: orders, isLoading: oLoading } = useQuery<{ items: Order[] }>({
  //   queryKey: ["workshop:orders", { limit: 8 }],
  //   queryFn: async () => (await api.get("/orders", { params: { limit: 8, sort: "-createdAt" } })).data,
  // });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Panel del Taller</h1>
          <p className={styles.subtitle}>Resumen general y últimas órdenes</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/workshop/orders/new" className={styles.btnPrimary}>Nueva Orden</Link>
          <Link href="/workshop/mechanics" className={styles.btnGhost}>Mecánicos</Link>
        </div>
      </header>

      <section className={styles.grid}>
        {/* <MetricCard
          loading={mLoading}
          label="Órdenes Abiertas"
          value={metrics?.openOrders ?? 0}
        />
        <MetricCard
          loading={mLoading}
          label="En Proceso"
          value={metrics?.inProgress ?? 0}
        />
        <MetricCard
          loading={mLoading}
          label="Finalizadas Hoy"
          value={metrics?.finishedToday ?? 0}
        />
        <MetricCard
          loading={mLoading}
          label="Presupuestos Pendientes"
          value={metrics?.pendingEstimates ?? 0}
        /> */}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Órdenes recientes</h2>
          <Link href="/workshop/orders" className={styles.link}>Ver todas</Link>
        </div>

        {/* {oLoading ? (
          <div className={styles.skeletonTable}>Cargando órdenes…</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Placa</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Creada</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(orders?.items ?? []).map((o) => (
                  <tr key={o.id}>
                    <td>{o.code}</td>
                    <td>{o.plate ?? "—"}</td>
                    <td>{o.customer ?? "—"}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>{new Date(o.createdAt).toLocaleString()}</td>
                    <td className={styles.rowActions}>
                      <Link href={`/workshop/orders/${o.id}`} className={styles.linkSmall}>Abrir</Link>
                    </td>
                  </tr>
                ))}
                {!orders?.items?.length && (
                  <tr><td colSpan={6} className={styles.empty}>Sin órdenes recientes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )} */}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Acciones rápidas</h2>
        </div>
        <div className={styles.quickGrid}>
          <QuickAction label="Crear Orden" href="/workshop/orders/new" />
          <QuickAction label="Registrar Cliente" href="/workshop/customers/new" />
          <QuickAction label="Asignar Mecánico" href="/workshop/mechanics" />
          <QuickAction label="Ver Agenda" href="/workshop/schedule" />
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, loading }: { label: string; value: number; loading?: boolean }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardLabel}>{label}</div>
      <div className={styles.cardValue}>{loading ? "—" : value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const map: Record<Order["status"], string> = {
    OPEN: "Abierta",
    IN_PROGRESS: "En Proceso",
    DONE: "Cerrada",
    CANCELLED: "Cancelada",
  };
  return <span className={`${styles.badge} ${styles[`badge--${status.toLowerCase()}`]}`}>{map[status]}</span>;
}

function QuickAction({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className={styles.quick}>
      <span className={styles.quickLabel}>{label}</span>
      <span className={styles.quickArrow}>→</span>
    </Link>
  );
}
