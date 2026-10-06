import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export type EngineProfile = "rapido" | "balanceado" | "chupacabra";

export type TargetLocation = {
  id: string;
  country: string;
  state_code: string;
  state_name: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  population_2022?: number | null;
  is_capital?: boolean;
};

export type EngineRun = {
  id: string;
  profile: EngineProfile;
  status: string;
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  started_at?: string | null;
  finished_at?: string | null;
  report_file?: string | null;
};

export type LeadRecord = Record<string, string> & {
  run_id: string;
  job_id: string;
  city: string;
  category: string;
  category_slug: string;
};

export type EngineEvent = {
  type: string;
  timestamp?: string;
  states?: Array<{ id: string; code: string; name: string }>;
  cities?: TargetLocation[];
  run?: {
    id: string;
    profile: EngineProfile;
    status: string;
    total_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    report_file?: string | null;
  };
  job?: {
    id: string;
    status: string;
    category_slug?: string;
    results_count: number;
    collected_count?: number;
    duplicates_count?: number;
    raw_file?: string | null;
    enriched_file?: string | null;
    log_file?: string | null;
    error?: string | null;
  };
  error?: string;
  message?: string;
  query?: string;
  query_count?: number;
  concurrency?: number;
  limit?: number;
  results?: number;
  correlation_id?: string;
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
  await invoke("engine_command", {
    command: {
      command,
      ...payload,
    },
  });
}

export async function startRun(options: {
  query?: string;
  profile: EngineProfile;
  city?: string;
  category?: string;
  targets?: TargetLocation[];
  categories?: Array<[string, string]>;
  max_jobs?: number;
  lang?: string;
  country?: string;
}): Promise<void> {
  await sendEngineCommand("start_run", options);
}

export async function loadBrazilStates(): Promise<Array<{ id: string; code: string; name: string }>> {
  const response = await requestEngineCatalog("catalog_states");
  return response.states ?? [];
}

export async function loadWorldCities(query: string, countryCode?: string): Promise<TargetLocation[]> {
  const response = await requestEngineCatalog("catalog_world_cities", {
    query,
    country_code: countryCode,
  });
  return response.cities ?? [];
}

export async function loadBrazilCities(
  stateCode: string,
  search = "",
  includePopulation = false,
): Promise<TargetLocation[]> {
  const response = await requestEngineCatalog("catalog_cities", {
    state_code: stateCode,
    search,
    include_population: includePopulation,
  });
  return response.cities ?? [];
}
async function requestEngineCatalog(
  command: string,
  payload: Record<string, unknown> = {},
): Promise<EngineEvent> {
  if (!isTauriRuntime()) {
    throw new Error("O catálogo geográfico está disponível apenas no aplicativo desktop Tauri.");
  }

  return new Promise((resolve, reject) => {
    const correlationId = crypto.randomUUID();
    let stop: UnlistenFn | undefined;
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      stop?.();
      callback();
    };

    void listen<EngineEvent>("engine-event", (event) => {
      if (event.payload.correlation_id !== correlationId) return;

      if (event.payload.type === command) {
        finish(() => resolve(event.payload));
      } else if (event.payload.type === "engine_error") {
        finish(() => reject(new Error(event.payload.error ?? "Falha no catálogo geográfico")));
      }
    })
      .then((unlisten) => {
        stop = unlisten;
        if (settled) unlisten();
        void invoke("engine_command", {
          command: {
            command,
            correlation_id: correlationId,
            ...payload,
          },
        }).catch((error) => {
          finish(() => reject(error));
        });
      })
      .catch(reject);
  });
}

export async function listRuns(): Promise<EngineRun[]> {
  const response = await requestEngineData("list_runs");
  return Array.isArray(response.runs) ? (response.runs as EngineRun[]) : [];
}

export async function loadRunLeads(runId: string): Promise<LeadRecord[]> {
  const response = await requestEngineData("load_run_leads", { run_id: runId });
  return Array.isArray(response.leads) ? (response.leads as LeadRecord[]) : [];
}

async function requestEngineData(
  command: string,
  payload: Record<string, unknown> = {},
): Promise<EngineEvent & { runs?: EngineRun[]; leads?: LeadRecord[] }> {
  if (!isTauriRuntime()) {
    throw new Error("A base de leads está disponível apenas no aplicativo desktop Tauri.");
  }

  return new Promise((resolve, reject) => {
    const correlationId = crypto.randomUUID();
    let stop: UnlistenFn | undefined;
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      stop?.();
      callback();
    };

    void listen<EngineEvent & { runs?: EngineRun[]; leads?: LeadRecord[] }>("engine-event", (event) => {
      if (event.payload.correlation_id !== correlationId) return;
      if (event.payload.type === command === false) return;
      if (event.payload.type === "engine_error") {
        finish(() => reject(new Error(event.payload.error ?? "Falha ao consultar o engine.")));
      } else if (event.payload.type === "runs_list" || event.payload.type === "run_leads") {
        finish(() => resolve(event.payload));
      }
    }).then((unlisten) => {
      stop = unlisten;
      if (settled) unlisten();
      void invoke("engine_command", {
        command: {
          command,
          correlation_id: correlationId,
          ...payload,
        },
      }).catch((error) => finish(() => reject(error)));
    }).catch(reject);
  });
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

export async function stopEngine(): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("engine_stop");
}
