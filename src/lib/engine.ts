import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export type EngineProfile = "fast" | "balanced" | "aggressive";

export type EngineEvent = {
  type: string;
  timestamp?: string;
  run?: {
    id: string;
    profile: EngineProfile;
    status: string;
    total_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
  };
  job?: {
    id: string;
    status: string;
    results_count: number;
    raw_file?: string | null;
    enriched_file?: string | null;
    log_file?: string | null;
    error?: string | null;
  };
  error?: string;
};

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function sendEngineCommand(
  command: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  if (!isTauriRuntime()) {
    throw new Error("O engine está disponível apenas no aplicativo desktop Tauri.");
  }
  await invoke("engine_command", { command, ...payload });
}

export async function startRun(options: {
  query: string;
  profile: EngineProfile;
  city?: string;
  category?: string;
}): Promise<void> {
  await sendEngineCommand("start_run", options);
}

export function listenEngineEvents(handler: (event: EngineEvent) => void): Promise<UnlistenFn> {
  return listen<EngineEvent>("engine-event", (event) => handler(event.payload));
}

export async function pauseRun(): Promise<void> {
  await sendEngineCommand("pause_run");
}

export async function resumeRun(): Promise<void> {
  await sendEngineCommand("resume_run");
}

export async function cancelRun(): Promise<void> {
  await sendEngineCommand("cancel_run");
}

export async function engineStatus(): Promise<string> {
  return invoke<string>("engine_status");
}
