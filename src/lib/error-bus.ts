import type { ApiError } from "@/lib/api";

const BUS_EVENT = "api:error";
const bus = typeof window !== "undefined" ? window : ({} as Window);

export function emitApiError(error: ApiError) {
  if (!("dispatchEvent" in bus)) return;
  const ev = new CustomEvent<ApiError>(BUS_EVENT, { detail: error });
  bus.dispatchEvent(ev);
}

export function onApiError(listener: (e: CustomEvent<ApiError>) => void) {
  if (!("addEventListener" in bus)) return () => {};
  bus.addEventListener(BUS_EVENT, listener as EventListener);
  return () => {
    bus.removeEventListener(BUS_EVENT, listener as EventListener);
  };
}
