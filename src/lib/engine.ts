import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export type EngineProfile = "rapido" | "balanceado" | "chupacabra";

const BRAZIL_STATES = [
  ["12", "AC", "Acre"], ["27", "AL", "Alagoas"], ["16", "AP", "Amapá"],
  ["13", "AM", "Amazonas"], ["29", "BA", "Bahia"], ["23", "CE", "Ceará"],
  ["53", "DF", "Distrito Federal"], ["32", "ES", "Espírito Santo"], ["52", "GO", "Goiás"],
  ["21", "MA", "Maranhão"], ["51", "MT", "Mato Grosso"], ["50", "MS", "Mato Grosso do Sul"],
  ["31", "MG", "Minas Gerais"], ["15", "PA", "Pará"], ["25", "PB", "Paraíba"],
  ["41", "PR", "Paraná"], ["26", "PE", "Pernambuco"], ["22", "PI", "Piauí"],
  ["33", "RJ", "Rio de Janeiro"], ["24", "RN", "Rio Grande do Norte"], ["43", "RS", "Rio Grande do Sul"],
  ["11", "RO", "Rondônia"], ["14", "RR", "Roraima"], ["42", "SC", "Santa Catarina"],
  ["35", "SP", "São Paulo"], ["28", "SE", "Sergipe"], ["17", "TO", "Tocantins"],
] as const;

const IBGE_LOCALIDADES = "https://servicodados.ibge.gov.br/api/v1/localidades";
const IBGE_POPULATION = "https://apisidra.ibge.gov.br/values/t/4714/n6/all/v/93/p/2022";

const STATE_CAPITALS: Record<string, string> = {
  AC: "Rio Branco", AL: "Maceió", AP: "Macapá", AM: "Manaus",
  BA: "Salvador", CE: "Fortaleza", DF: "Brasília", ES: "Vitória",
  GO: "Goiânia", MA: "São Luís", MT: "Cuiabá", MS: "Campo Grande",
  MG: "Belo Horizonte", PA: "Belém", PB: "João Pessoa", PR: "Curitiba",
  PE: "Recife", PI: "Teresina", RJ: "Rio de Janeiro", RN: "Natal",
  RS: "Porto Alegre", RO: "Porto Velho", RR: "Boa Vista", SC: "Florianópolis",
  SP: "São Paulo", SE: "Aracaju", TO: "Palmas",
};


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
  message?: string;
  query?: string;
  query_count?: number;
  concurrency?: number;
  limit?: number;
  results?: number;
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
}): Promise<void> {
  await sendEngineCommand("start_run", options);
}

export async function loadBrazilStates(): Promise<Array<{ id: string; code: string; name: string }>> {
  return BRAZIL_STATES
    .map(([id, code, name]) => ({ id, code, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
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
  const state = BRAZIL_STATES.find((item) => item[1] === stateCode.toUpperCase());
  if (!state) throw new Error(`UF brasileira inválida: ${stateCode}`);

  const response = await fetchWithTimeout(
    `${IBGE_LOCALIDADES}/estados/${state[0]}/municipios`,
    15000,
  );
  if (!response.ok) throw new Error(`IBGE respondeu HTTP ${response.status} ao carregar municípios.`);
  const payload = await response.json() as Array<{ id: number; nome: string }>;

  let populations = new Map<string, number>();
  if (includePopulation) {
    const populationResponse = await fetchWithTimeout(IBGE_POPULATION, 30000);
    if (!populationResponse.ok) {
      throw new Error(`IBGE/SIDRA respondeu HTTP ${populationResponse.status} ao carregar população.`);
    }
    const populationPayload = await populationResponse.json() as Array<Record<string, string>>;
    populations = new Map(
      populationPayload.slice(1).flatMap((row) => {
        const code = String(row.D1C ?? "").trim();
        const value = String(row.V ?? "").replace(/\\./g, "");
        return code && /^\\d+$/.test(value) ? [[code, Number(value)] as const] : [];
      }),
    );
  }

  const needle = search.trim().toLocaleLowerCase("pt-BR");
  return payload
    .filter((city) => !needle || city.nome.toLocaleLowerCase("pt-BR").includes(needle))
    .map((city) => ({
      id: `br:${city.id}`,
      country: "BR",
      state_code: state[1],
      state_name: state[2],
      city: city.nome,
      population_2022: populations.get(String(city.id)) ?? null,
      is_capital: STATE_CAPITALS[state[1]] === city.nome,
    }))
    .sort((a, b) => a.city.localeCompare(b.city, "pt-BR"));
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Tempo esgotado ao consultar o catálogo geográfico (${timeoutMs / 1000}s).`);
    }
    throw new Error(`Falha ao consultar o catálogo geográfico: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    window.clearTimeout(timer);
  }
}

async function requestEngineCatalog(
  command: string,
  payload: Record<string, unknown> = {},
): Promise<EngineEvent> {
  if (!isTauriRuntime()) {
    throw new Error("O catálogo geográfico está disponível apenas no aplicativo desktop Tauri.");
  }

  return new Promise((resolve, reject) => {
    let stop: UnlistenFn | undefined;
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      stop?.();
      callback();
    };

    void listen<EngineEvent>("engine-event", (event) => {
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
            ...payload,
          },
        }).catch((error) => {
          finish(() => reject(error));
        });
      })
      .catch(reject);
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
