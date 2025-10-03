"use client";
import { useEffect, useState } from "react";
import { onApiError } from "@/lib/error-bus";
import type { ApiError } from "@/lib/api";
import styles from "./error-toast-provider.module.css";

type Toast = ApiError & { id: string };

export default function ErrorToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return onApiError((e) => {
      const id = Math.random().toString(36).slice(2);
      const toast: Toast = { id, ...e.detail };
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    });
  }, []);

  return (
    <>
      {children}
      <div className={styles.container}>
        {toasts.map((t) => (
          <div key={t.id} className={styles.toast} role="status" aria-live="polite">
            <div className={styles.title}>
              {t.status ? `Error ${t.status}` : "Error"} {t.code ? `• ${t.code}` : ""}
            </div>
            <div className={styles.message}>{t.message}</div>
            {t.details && (
              <details className={styles.details}>
                <summary>Detalles</summary>
                <pre>{JSON.stringify(t.details, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
