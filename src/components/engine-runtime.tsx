import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { isTauriRuntime, type EngineEvent } from "@/lib/engine";

/** Keeps the native engine event stream available to the React application. */
export function EngineRuntime() {
  useEffect(() => {
    if (!isTauriRuntime()) return;

    let disposed = false;
    let unlisten: (() => void) | undefined;

    void listen<EngineEvent>("engine-event", (event) => {
      window.dispatchEvent(new CustomEvent("chupacabra:engine-event", { detail: event.payload }));
    }).then((cleanup) => {
      if (disposed) cleanup();
      else unlisten = cleanup;
    });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  return null;
}
