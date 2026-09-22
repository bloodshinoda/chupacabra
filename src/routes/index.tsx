import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Bot,
  Building2,
  Check,
  ChevronDown,
  CirclePause,
  Clock3,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Gauge,
  Globe2,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageSquareText,
  Network,
  Pause,
  Play,
  Plus,
  Radio,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { cancelRun, engineStatus, isTauriRuntime, listenEngineEvents, loadBrazilCities, loadBrazilStates, loadWorldCities, pauseRun, resumeRun, startRun, type EngineProfile, type TargetLocation } from "@/lib/engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chupacabra System — B2B Prospect Engine" },
      { name: "description", content: "Central de inteligência de mercado, prospecção B2B e automação comercial." },
      { property: "og:title", content: "Chupacabra System — B2B Prospect Engine" },
      { property: "og:description", content: "Central autônoma de inteligência de mercado e prospecção B2B." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChupacabraDashboard,
});

type View = "dashboard" | "targets" | "leads" | "outreach" | "reports";
type ScanState = "idle" | "running" | "paused";

const NAV_ITEMS = [
  { id: "dashboard" as const, label: "Painel de Controle", icon: LayoutDashboard },
  { id: "targets" as const, label: "Matriz de Alvos", sub: "Cidades & Nichos", icon: Target },
  { id: "leads" as const, label: "Base de Leads", icon: Database },
  { id: "outreach" as const, label: "Automação", sub: "de Abordagem", icon: Bot },
  { id: "reports" as const, label: "Relatórios", sub: "e Exportação", icon: FileSpreadsheet },
];

const LEADS = [
  { name: "Nexus Tecnologia", niche: "Software B2B", city: "São Paulo", phone: "+55 11 98412-3001", site: "nexustech.com.br", status: "Qualificado" },
  { name: "Aurum Contabilidade", niche: "Contabilidade", city: "Curitiba", phone: "+55 41 99873-1190", site: "aurumcontabil.com", status: "Novo" },
  { name: "Clínica Horizonte", niche: "Saúde", city: "Belo Horizonte", phone: "+55 31 98823-5721", site: "clinicahorizonte.com", status: "Em análise" },
  { name: "Prisma Engenharia", niche: "Construção", city: "Campinas", phone: "+55 19 99144-8830", site: "prismaeng.com.br", status: "Qualificado" },
  { name: "Atlas Logística", niche: "Logística", city: "São Paulo", phone: "+55 11 97752-6204", site: "atlaslog.com.br", status: "Descartado" },
  { name: "Vértice Legal", niche: "Advocacia", city: "Curitiba", phone: "+55 41 98410-7744", site: "verticelegal.com", status: "Novo" },
];

const INITIAL_LOGS = [
  "[18:32:04] Motor de extração pronto.",
  "[18:32:05] 12 cidades carregadas na matriz.",
  "[18:32:05] Proxy rotativo verificado · latência 84ms.",
  "[18:32:06] Aguardando comando de varredura...",
];

function ChupacabraDashboard() {
  const [view, setView] = useState<View>("dashboard");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [progress, setProgress] = useState(0);
  const [leadCount, setLeadCount] = useState(0);
  const [profile, setProfile] = useState<EngineProfile>("balanced");
  const [targets, setTargets] = useState<TargetLocation[]>([]);
  const [maxJobs, setMaxJobs] = useState(5000);
  const [categories] = useState<Array<[string, string]>>([["agencias_publicidade", "Agencias de publicidade"], ["graficas", "Graficas"], ["graficas_rapidas", "Grafica rapida"], ["comunicacao_visual", "Comunicacao visual"], ["marketing_digital", "Agencias de marketing digital"], ["brindes_corporativos", "Brindes corporativos"], ["eventos_corporativos", "Organizacao de eventos corporativos"], ["serigrafia_estamparia", "Serigrafia e estamparia"], ["imobiliarias", "Imobiliarias"], ["concessionarias", "Concessionarias de veiculos"], ["construtoras", "Construtoras"], ["clinicas_odontologicas", "Clinicas odontologicas"]]);

  useEffect(() => {
    if (!isTauriRuntime()) return;

    let active = true;
    let unlisten: (() => void) | undefined;

    void Promise.all([
      engineStatus(),
      listenEngineEvents((event) => {
        if (!active) return;

        const stamp = new Date(event.timestamp ?? Date.now()).toLocaleTimeString("pt-BR");
        const addLog = (message: string) => {
          setLogs((current) => [...current.slice(-7), `[${stamp}] ${message}`]);
        };

        switch (event.type) {
          case "run_started":
            setScanState("running");
            setProgress(5);
            setLeadCount(0);
            addLog("Execução iniciada pelo engine.");
            break;
          case "job_started":
            setScanState("running");
            addLog(`Job iniciado · ${event.job?.id ?? "—"}.`);
            break;
          case "job_completed":
            setProgress(event.run?.total_jobs ? (event.run.completed_jobs / event.run.total_jobs) * 100 : 100);
            setLeadCount((current) => current + (event.job?.results_count ?? 0));
            addLog(`Job concluído · ${event.job?.results_count ?? 0} resultados coletados.`);
            break;
          case "job_failed":
            addLog(`Job falhou · ${event.error ?? event.job?.error ?? "erro desconhecido"}.`);
            break;
          case "run_paused":
            setScanState("paused");
            addLog("Execução pausada.");
            break;
          case "run_resumed":
            setScanState("running");
            addLog("Execução retomada.");
            break;
          case "run_cancelled":
            setScanState("idle");
            addLog("Execução cancelada.");
            break;
          case "run_failed":
            setScanState("idle");
            addLog(`Execução falhou · ${event.error ?? "consulte o log do engine"}.`);
            break;
          case "run_completed":
            setScanState("idle");
            setProgress(100);
            addLog("Execução concluída.");
            break;
          case "engine_error":
            addLog(`Erro do engine · ${event.error ?? "erro desconhecido"}.`);
            break;
        }
      }),
    ]).then(([, stop]) => {
      if (active) unlisten = stop;
      else stop();
    }).catch((error) => {
      addEngineLog(setLogs, `Falha ao conectar ao engine · ${error instanceof Error ? error.message : String(error)}`);
    });

    return () => {
      active = false;
      unlisten?.();
    };
  }, []);

  const startScan = async () => {
    setLogs((current) => [...current, `[${new Date().toLocaleTimeString("pt-BR")}] Iniciando varredura com perfil ${profile}.`]);
    setProgress(5);

    if (!isTauriRuntime()) {
      setLogs((current) => [...current, `[${new Date().toLocaleTimeString("pt-BR")}] Abra o aplicativo Tauri para executar o engine.`]);
      return;
    }

    try {
      if (!targets.length) throw new Error("Selecione ao menos uma cidade na Matriz de Alvos.");
      const plannedJobs = targets.length * categories.length;
      if (plannedJobs > maxJobs) {
        throw new Error(`A matriz possui ${plannedJobs.toLocaleString("pt-BR")} jobs e o limite atual é ${maxJobs.toLocaleString("pt-BR")}.`);
      }
      await startRun({ profile, targets, categories, max_jobs: maxJobs });
      setScanState("running");
    } catch (error) {
      setScanState("idle");
      addEngineLog(setLogs, `Falha ao iniciar engine · ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handlePause = async () => {
    try {
      await pauseRun();
    } catch (error) {
      addEngineLog(setLogs, `Falha ao pausar engine · ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleResume = async () => {
    try {
      await resumeRun();
    } catch (error) {
      addEngineLog(setLogs, `Falha ao retomar engine · ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelRun();
    } catch (error) {
      addEngineLog(setLogs, `Falha ao cancelar engine · ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const currentLabel = NAV_ITEMS.find((item) => item.id === view)?.label ?? "Painel";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="noise-overlay" />
      <Sidebar view={view} setView={setView} open={mobileOpen} setOpen={setMobileOpen} scanState={scanState} />
      <main className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir navegação"><Menu /></Button>
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-primary">CHUPACABRA // CONSOLE</p>
            <h1 className="truncate text-sm font-semibold sm:text-base">{currentLabel}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><span className="status-dot" /> Sistema operacional</div>
            <Button variant="outline" size="icon" aria-label="Configurações"><Settings2 /></Button>
            <div className="grid size-8 place-items-center rounded-md border border-primary/30 bg-primary/10 font-mono text-xs font-bold text-primary">RG</div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {view === "dashboard" && <DashboardView scanState={scanState} setScanState={setScanState} startScan={startScan} onPause={handlePause} onResume={handleResume} onCancel={handleCancel} profile={profile} setProfile={setProfile} progress={progress} leadCount={leadCount} logs={logs} />}
          {view === "targets" && <TargetsView targets={targets} setTargets={setTargets} categories={categories} maxJobs={maxJobs} setMaxJobs={setMaxJobs} />}
          {view === "leads" && <LeadsView />}
          {view === "outreach" && <OutreachView />}
          {view === "reports" && <ReportsView />}
        </div>
      </main>
    </div>
  );
}


function addEngineLog(setLogs: React.Dispatch<React.SetStateAction<string[]>>, message: string) {
  setLogs((current) => [...current.slice(-7), `[${new Date().toLocaleTimeString("pt-BR")}] ${message}`]);
}

function Sidebar({ view, setView, open, setOpen, scanState }: { view: View; setView: (v: View) => void; open: boolean; setOpen: (v: boolean) => void; scanState: ScanState }) {
  return <>
    {open && <button aria-label="Fechar navegação" className="fixed inset-0 z-40 bg-overlay lg:hidden" onClick={() => setOpen(false)} />}
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-300 lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex h-20 items-center justify-between border-b border-border px-5">
        <div className="min-w-0"><div className="flex items-center gap-2"><span className="text-xl">🦇</span><span className="font-display text-sm font-bold uppercase tracking-wide">Chupacabra</span></div><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-primary">B2B Prospect Engine</p></div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar navegação"><X /></Button>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-5">
        <p className="px-3 pb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Núcleo de operação</p>
        {NAV_ITEMS.map((item) => <button key={item.id} onClick={() => { setView(item.id); setOpen(false); }} className={cn("nav-item", view === item.id && "nav-item-active")}><item.icon className="size-[18px] shrink-0" /><span className="min-w-0 text-left"><span className="block truncate">{item.label}</span>{item.sub && <span className="block truncate text-[10px] opacity-55">{item.sub}</span>}</span>{view === item.id && <span className="ml-auto h-5 w-0.5 bg-primary shadow-glow" />}</button>)}
      </nav>
      <div className="m-3 border border-border bg-surface p-3">
        <div className="flex items-center justify-between"><span className="font-mono text-[9px] uppercase text-muted-foreground">Engine status</span><Activity className="size-4 text-primary" /></div>
        <div className="mt-3 flex items-center gap-2"><span className={cn("status-dot", scanState === "paused" && "bg-warning", scanState === "idle" && "bg-muted-foreground shadow-none")} /><span className="text-xs font-medium">{scanState === "running" ? "Operando" : scanState === "paused" ? "Pausado" : "Em espera"}</span></div>
        <div className="mt-3 h-1 overflow-hidden bg-muted"><div className="h-full w-3/4 bg-primary shadow-glow" /></div>
        <div className="mt-2 flex justify-between font-mono text-[9px] text-muted-foreground"><span>CPU 24%</span><span>MEM 1.8 GB</span></div>
      </div>
      <div className="border-t border-border px-5 py-4 font-mono text-[9px] text-muted-foreground"><div className="flex justify-between"><span>BUILD</span><span className="text-primary">v2.4.0 STABLE</span></div></div>
    </aside>
  </>;
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4"><div className="min-w-0"><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{eyebrow}</p><h2 className="font-display text-2xl font-bold tracking-wide sm:text-3xl">{title}</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p></div>{action && <div className="shrink-0">{action}</div>}</div>;
}

function DashboardView({ scanState, setScanState, startScan, onPause, onResume, onCancel, profile, setProfile, progress, leadCount, logs }: { scanState: ScanState; setScanState: (s: ScanState) => void; startScan: () => void; onPause: () => void; onResume: () => void; onCancel: () => void; profile: EngineProfile; setProfile: (p: EngineProfile) => void; progress: number; leadCount: number; logs: string[] }) {
  const metrics = [
    { label: "Leads coletados", value: leadCount.toLocaleString("pt-BR"), delta: "+12.4%", icon: Users },
    { label: "Cidades configuradas", value: "12", delta: "4 estados", icon: MapPin },
    { label: "Nichos ativos", value: "08", delta: "de 12 totais", icon: Target },
    { label: "Motor de extração", value: scanState === "running" ? "Executando" : scanState === "paused" ? "Pausado" : "Inativo", delta: scanState === "paused" ? "retoma em 02:14" : "timer estocástico", icon: Radio },
  ];
  return <>
    <PageIntro eyebrow="Central de inteligência" title="Painel de Controle" description="Monitore a operação, execute varreduras e acompanhe a coleta em tempo real." />
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((m, i) => <div className="metric-card" key={m.label}><div className="flex items-start justify-between"><div className="grid size-9 place-items-center border border-primary/20 bg-primary/5 text-primary"><m.icon className="size-4" /></div><span className={cn("font-mono text-[10px]", i === 0 ? "text-primary" : "text-muted-foreground")}>{m.delta}</span></div><p className="mt-5 text-xs text-muted-foreground">{m.label}</p><p className={cn("mt-1 font-display text-2xl font-bold", i === 3 && scanState === "running" && "text-primary")}>{m.value}</p></div>)}</section>

    <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
      <div className="panel overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-display text-lg font-semibold">Operação de varredura</p><p className="mt-1 text-xs text-muted-foreground">Execução real via engine · alvo atual: Chapeco / Agências de publicidade</p></div><div className="flex flex-wrap gap-2"><div className="flex items-center border border-border bg-surface p-1">{(["fast","balanced","aggressive"] as EngineProfile[]).map((item)=><button key={item} onClick={()=>setProfile(item)} className={cn("px-2.5 py-1.5 font-mono text-[9px] uppercase transition-colors", profile===item ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>{item}</button>)}</div>{scanState === "running" && <><Button variant="outline" onClick={onPause}><Pause /> Pausar</Button><Button variant="outline" onClick={onCancel}><X /> Cancelar</Button></>}{scanState === "paused" && <><Button variant="outline" onClick={onResume}><Play /> Retomar</Button><Button variant="outline" onClick={onCancel}><X /> Cancelar</Button></>}<Button size="lg" onClick={startScan} className="scan-button"><Zap />{scanState === "running" ? "Nova varredura" : "Iniciar varredura"}</Button></div></div>
        <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_220px]">
          <div><div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">Progresso do ciclo</span><span className="font-mono text-primary">{Math.round(progress)}%</span></div><div className="h-2 overflow-hidden bg-muted"><div className="h-full bg-primary transition-all duration-700 shadow-glow" style={{ width: `${progress}%` }} /></div><div className="mt-5 grid grid-cols-3 gap-3">{[["Consultas", "1.248"], ["Válidos", "386"], ["Taxa", "30,9%"]].map(([a,b]) => <div key={a} className="border-l border-border pl-3"><p className="font-mono text-[9px] uppercase text-muted-foreground">{a}</p><p className="mt-1 text-sm font-semibold">{b}</p></div>)}</div></div>
          <div className="border border-border bg-surface p-4"><div className="flex items-center gap-2 text-xs font-medium"><Clock3 className="size-4 text-info" /> Timer estocástico</div><p className="mt-3 font-mono text-2xl font-bold">04.8<span className="text-xs text-muted-foreground">s</span></p><p className="mt-1 text-[10px] text-muted-foreground">Perfil {profile} · cadência controlada pelo engine</p></div>
        </div>
      </div>
      <div className="panel p-5"><div className="flex items-center justify-between"><div><p className="font-display font-semibold">Saúde do sistema</p><p className="mt-1 text-xs text-muted-foreground">Últimos 15 minutos</p></div><ShieldCheck className="size-5 text-primary" /></div><div className="mt-6 space-y-5">{[["Disponibilidade", 99], ["Qualidade dos proxies", 87], ["Integridade dos dados", 94]].map(([label, val]) => <div key={String(label)}><div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-mono">{val}%</span></div><div className="h-1 bg-muted"><div className="h-full bg-info" style={{ width: `${val}%` }} /></div></div>)}</div></div>
    </section>

    <section className="terminal mt-4"><div className="flex items-center justify-between border-b border-terminal-border px-4 py-3"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-destructive"/><span className="size-2 rounded-full bg-warning"/><span className="size-2 rounded-full bg-primary"/><span className="ml-2 font-mono text-[10px] uppercase text-muted-foreground">chupacabra_core.log</span></div><span className="flex items-center gap-2 font-mono text-[9px] text-primary"><span className="status-dot"/> LIVE STREAM</span></div><div className="h-52 overflow-y-auto p-4 font-mono text-[11px] leading-7">{logs.map((log, i) => <div key={`${log}-${i}`} className={i === logs.length - 1 ? "text-primary" : "text-terminal-muted"}>{log}</div>)}<span className="terminal-cursor">▋</span></div></section>
  </>;
}

function TargetsView({
  targets,
  setTargets,
  categories,
  maxJobs,
  setMaxJobs,
}: {
  targets: TargetLocation[];
  setTargets: (targets: TargetLocation[]) => void;
  categories: Array<[string, string]>;
  maxJobs: number;
  setMaxJobs: (value: number) => void;
}) {
  const [mode, setMode] = useState<"br" | "world">("br");
  const [stateCode, setStateCode] = useState("");
  const [states, setStates] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [cities, setCities] = useState<TargetLocation[]>([]);
  const [worldCities, setWorldCities] = useState<TargetLocation[]>([]);
  const [search, setSearch] = useState("");
  const [worldCountry, setWorldCountry] = useState("");
  const [scope, setScope] = useState<"manual" | "all" | "capitals">("manual");
  const [minPopulation, setMinPopulation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshBrazil = async () => {
    if (!isTauriRuntime()) {
      setError("Abra o aplicativo Tauri para carregar o catálogo geográfico.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      setCities(await loadBrazilCities(stateCode, search, minPopulation > 0));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  };

  const refreshWorld = async () => {
    if (!isTauriRuntime()) {
      setError("Abra o aplicativo Tauri para pesquisar cidades internacionais.");
      return;
    }
    if (search.trim().length < 2) return;
    setLoading(true);
    setError("");
    try {
      setWorldCities(await loadWorldCities(search, worldCountry || undefined));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "br") {
      void loadBrazilStates()
        .then((items) => {
          setStates(items);
          setStateCode((current) => current || (items.some((item) => item.code === "SC") ? "SC" : items[0]?.code || ""));
        })
        .catch((cause) => {
          setStates([]);
          setError(cause instanceof Error ? cause.message : String(cause));
        });
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "br" && stateCode) void refreshBrazil();
  }, [stateCode, mode]);

  const brazilResults = cities.filter((city) => {
    if (scope === "capitals" && !city.is_capital) return false;
    if (minPopulation > 0 && (city.population_2022 ?? 0) < minPopulation) return false;
    return true;
  });

  const results = mode === "br" ? brazilResults : worldCities;
  const plannedJobs = targets.length * categories.length;
  const overLimit = plannedJobs > maxJobs;

  const toggleCity = (city: TargetLocation) => {
    const exists = targets.some((item) => item.id === city.id);
    setTargets(exists ? targets.filter((item) => item.id !== city.id) : [...targets, city]);
  };

  const addAllVisible = () => {
    const incoming = results.slice(0, Math.max(0, Math.floor(maxJobs / Math.max(categories.length, 1))));
    const merged = new Map(targets.map((target) => [target.id, target]));
    incoming.forEach((target) => merged.set(target.id, target));
    const next = [...merged.values()];
    if (next.length * categories.length > maxJobs) {
      setError("A seleção excede o limite de jobs. Reduza o número de categorias ou aumente o limite.");
      return;
    }
    setTargets(next);
    setError("");
  };

  return <>
    <PageIntro
      eyebrow="Definição de território"
      title="Matriz de Alvos"
      description="Combine cidades, filtros demográficos e nichos antes de gerar a campanha."
      action={
        <div className={cn(
          "border px-3 py-2 font-mono text-xs",
          overLimit ? "border-destructive/40 bg-destructive/5 text-destructive" : "border-primary/20 bg-primary/5 text-primary"
        )}>
          {plannedJobs.toLocaleString("pt-BR")} jobs
        </div>
      }
    />

    <section className="panel p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button variant={mode === "br" ? "default" : "outline"} onClick={() => setMode("br")}>Brasil · IBGE</Button>
          <Button variant={mode === "world" ? "default" : "outline"} onClick={() => setMode("world")}>Internacional</Button>
        </div>

        {mode === "br" ? (
          <>
            <div className="grid gap-4 lg:grid-cols-[220px_1fr_220px]">
              <label className="block">
                <span className="field-label">UF</span>
                <select className="field mt-2" value={stateCode} onChange={(e) => setStateCode(e.target.value)}>
                  {states.length ? states.map((state) => <option key={state.code} value={state.code}>{state.code} — {state.name}</option>) : <option value="" disabled>{error ? "Falha ao carregar UFs" : "Carregando UFs..."}</option>}
                </select>
              </label>
              <label className="block">
                <span className="field-label">Buscar município</span>
                <input className="field mt-2" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void refreshBrazil()} placeholder="Ex: Blumenau" />
              </label>
              <label className="block">
                <span className="field-label">Escopo</span>
                <select className="field mt-2" value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}>
                  <option value="manual">Seleção manual</option>
                  <option value="all">Todos os municípios</option>
                  <option value="capitals">Capital da UF</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-[220px_1fr_auto]">
              <label className="block">
                <span className="field-label">População mínima · Censo 2022</span>
                <input className="field mt-2" type="number" min={0} step={1000} value={minPopulation} onChange={(e) => setMinPopulation(Math.max(0, Number(e.target.value) || 0))} />
              </label>
              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={() => void refreshBrazil()} disabled={loading}>{loading ? "Carregando..." : "Atualizar municípios"}</Button>
                <Button variant="outline" onClick={addAllVisible} disabled={!brazilResults.length}>Adicionar filtrados</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_auto]">
            <label className="block">
              <span className="field-label">Buscar cidade no mundo</span>
              <input className="field mt-2" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void refreshWorld()} placeholder="Ex: Berlin, Miami, Tokyo" />
            </label>
            <label className="block">
              <span className="field-label">País · ISO 3166</span>
              <input className="field mt-2 uppercase" maxLength={2} value={worldCountry} onChange={(e) => setWorldCountry(e.target.value.toUpperCase())} placeholder="Opcional" />
            </label>
            <Button onClick={() => void refreshWorld()} disabled={loading}>{loading ? "Buscando..." : "Buscar cidades"}</Button>
          </div>
        )}

        {error && <p className="border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{error}</p>}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {results.slice(0, 60).map((city) => (
            <button key={city.id} onClick={() => toggleCity(city)} className={cn(
              "border p-3 text-left transition-colors",
              targets.some((item) => item.id === city.id) ? "border-primary bg-primary/10" : "border-border bg-surface hover:border-primary/40"
            )}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{city.city}</span>
                {targets.some((item) => item.id === city.id) && <Check className="size-4 text-primary" />}
              </div>
              <span className="mt-1 block font-mono text-[9px] uppercase text-muted-foreground">
                {city.state_code || city.country} · {city.state_name || "Internacional"}
              </span>
              {city.population_2022 != null && <span className="mt-1 block font-mono text-[9px] text-info">{city.population_2022.toLocaleString("pt-BR")} hab. · {city.is_capital ? "capital" : "município"}</span>}
            </button>
          ))}
        </div>
      </div>
    </section>

    <section className="panel mt-4 p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_220px_auto] lg:items-end">
        <div>
          <h3 className="font-display font-semibold">Campanha planejada</h3>
          <p className="mt-1 text-xs text-muted-foreground">{targets.length} localidades · {plannedJobs.toLocaleString("pt-BR")} jobs previstos</p>
        </div>
        <label className="block">
          <span className="field-label">Limite máximo de jobs</span>
          <input className="field mt-2" type="number" min={1} max={10000} step={100} value={maxJobs} onChange={(e) => setMaxJobs(Math.min(10000, Math.max(1, Number(e.target.value) || 1)))} />
        </label>
        <Button variant="outline" onClick={() => { setTargets([]); setError(""); }} disabled={!targets.length}>Limpar</Button>
      </div>

      {overLimit && <p className="mt-4 border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">A campanha ultrapassa o limite. O engine também bloqueia matrizes acima de 10.000 jobs.</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {targets.map((target) => (
          <button key={target.id} onClick={() => toggleCity(target)} className="border border-primary/20 bg-primary/5 px-3 py-2 text-xs hover:border-primary/50">
            {target.city} / {target.state_code || target.country}
          </button>
        ))}
      </div>
    </section>
  </>;
}

function TagManager({ title, icon: Icon, items, input, setInput, onAdd, onRemove, placeholder }: { title:string; icon: typeof MapPin; items:string[]; input:string; setInput:(v:string)=>void; onAdd:()=>void; onRemove:(v:string)=>void; placeholder:string }) {
  return <section className="panel p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Icon className="size-4 text-primary"/><h3 className="font-display font-semibold">{title}</h3></div><span className="font-mono text-[10px] text-muted-foreground">{items.length} ativos</span></div><div className="mt-5 flex gap-2"><input value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&onAdd()} placeholder={placeholder} className="field"/><Button size="icon" onClick={onAdd} aria-label={`Adicionar ${title}`}><Plus/></Button></div><div className="mt-4 space-y-2">{items.map((item,i)=><div key={item} className="flex items-center gap-3 border border-border bg-surface px-3 py-2.5"><span className="font-mono text-[10px] text-primary">{String(i+1).padStart(2,"0")}</span><span className="flex-1 text-sm">{item}</span><Button variant="ghost" size="icon" onClick={()=>onRemove(item)} aria-label={`Remover ${item}`}><Trash2/></Button></div>)}</div></section>;
}

function RangeSetting({label,value,min,max,values,onChange}:{label:string;value:string;min:number;max:number;values:number[];onChange:(v:number[])=>void}) { return <div><div className="mb-4 flex items-center justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-mono text-primary">{value}</span></div><Slider min={min} max={max} value={values} onValueChange={onChange}/><div className="mt-2 flex justify-between font-mono text-[9px] text-muted-foreground"><span>{min}</span><span>{max}</span></div></div>; }

function LeadsView() {
  const [search, setSearch] = useState(""); const [city, setCity] = useState("Todas"); const [status, setStatus] = useState("Todos");
  const rows = useMemo(()=>LEADS.filter(l => (l.name+l.niche+l.city).toLowerCase().includes(search.toLowerCase()) && (city==="Todas"||l.city===city) && (status==="Todos"||l.status===status)),[search,city,status]);
  return <><PageIntro eyebrow="Inteligência consolidada" title="Base de Leads" description="Revise, filtre e prepare os contatos encontrados para qualificação." action={<div className="flex gap-2"><Button variant="outline"><FileText/> CSV</Button><Button><FileSpreadsheet/> XLSX</Button></div>} />
    <section className="panel overflow-hidden"><div className="grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(240px,1fr)_200px_180px]"><label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input className="field pl-9" placeholder="Buscar empresa, nicho ou cidade..." value={search} onChange={e=>setSearch(e.target.value)}/></label><SelectField value={city} setValue={setCity} options={["Todas","São Paulo","Curitiba","Belo Horizonte","Campinas"]}/><SelectField value={status} setValue={setStatus} options={["Todos","Novo","Em análise","Qualificado","Descartado"]}/></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b border-border font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{["Empresa","Nicho","Cidade","Telefone","Website","Qualificação"].map(h=><th key={h} className="px-5 py-4 font-medium">{h}</th>)}</tr></thead><tbody>{rows.map(lead=><tr key={lead.name} className="border-b border-border/60 transition-colors hover:bg-surface"><td className="px-5 py-4 font-medium">{lead.name}</td><td className="px-5 py-4 text-muted-foreground">{lead.niche}</td><td className="px-5 py-4 text-muted-foreground">{lead.city}</td><td className="px-5 py-4 font-mono text-xs">{lead.phone}</td><td className="px-5 py-4 text-info">{lead.site}</td><td className="px-5 py-4"><StatusBadge status={lead.status}/></td></tr>)}</tbody></table></div><div className="flex items-center justify-between px-5 py-4 text-xs text-muted-foreground"><span>Exibindo {rows.length} de {LEADS.length} leads</span><span className="font-mono text-primary">BASE LOCAL // SINCRONIZADA</span></div></section>
  </>;
}

function SelectField({value,setValue,options}:{value:string;setValue:(v:string)=>void;options:string[]}) { return <label className="relative"><select className="field appearance-none pr-8" value={value} onChange={e=>setValue(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/></label>; }
function StatusBadge({status}:{status:string}) { return <span className={cn("status-badge", status==="Qualificado"&&"status-success", status==="Em análise"&&"status-info", status==="Descartado"&&"status-muted")}>{status}</span>; }

function OutreachView() {
 const [provider,setProvider]=useState("Ollama"); const [tone,setTone]=useState("Consultivo"); const [generated,setGenerated]=useState(false);
 return <><PageIntro eyebrow="Engine agnóstica" title="Automação de Abordagem" description="Conecte seu modelo preferido e gere mensagens comerciais contextualizadas." />
  <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]"><section className="panel p-5"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center bg-primary/10 text-primary"><Network className="size-4"/></div><div><h3 className="font-display font-semibold">Modelo de linguagem</h3><p className="text-xs text-muted-foreground">Selecione o motor de geração</p></div></div><div className="mt-5 grid grid-cols-3 gap-2">{["Ollama","Qwen","OpenAI"].map(p=><button key={p} onClick={()=>setProvider(p)} className={cn("provider-button",provider===p&&"provider-active")}><span className="font-display text-sm font-semibold">{p}</span><span className="text-[9px] text-muted-foreground">{p==="OpenAI"?"API":"Local"}</span></button>)}</div><div className="mt-5 space-y-4"><label className="block"><span className="field-label">Endpoint do modelo</span><input className="field mt-2 font-mono text-xs" value={provider==="OpenAI"?"https://api.openai.com/v1":"http://localhost:11434"} readOnly/></label><label className="block"><span className="field-label">Tom da mensagem</span><SelectField value={tone} setValue={setTone} options={["Consultivo","Direto","Executivo","Amigável"]}/></label><label className="block"><span className="field-label">Contexto da oferta</span><textarea className="field mt-2 min-h-28 resize-none" defaultValue="Auditoria gratuita de presença digital e oportunidades comerciais para empresas B2B."/></label><div className="flex items-center justify-between border-t border-border pt-4"><span className="text-xs">Personalização por lead</span><Switch defaultChecked/></div></div></section>
  <section className="panel overflow-hidden"><div className="flex items-center justify-between border-b border-border p-5"><div><h3 className="font-display font-semibold">Pré-visualização</h3><p className="text-xs text-muted-foreground">Lead 01 de 386 · Nexus Tecnologia</p></div><Sparkles className="size-5 text-info"/></div><div className="p-5"><div className="flex items-center gap-3 border border-border bg-surface p-4"><div className="grid size-9 place-items-center bg-info/10 text-info"><Building2 className="size-4"/></div><div><p className="text-sm font-medium">Marina · Nexus Tecnologia</p><p className="text-[10px] text-muted-foreground">Diretora Comercial · São Paulo</p></div><span className="ml-auto status-badge status-success">82% fit</span></div><div className="relative mt-4 min-h-64 border border-border bg-terminal p-5 font-mono text-sm leading-7 text-terminal-text">{generated ? <p>Olá Marina, tudo bem?<br/><br/>Analisei a presença digital da Nexus Tecnologia e identifiquei algumas oportunidades para ampliar a geração de demanda B2B em São Paulo. Preparamos uma auditoria objetiva, sem custo, com os principais pontos de crescimento.<br/><br/>Faz sentido reservar 15 minutos esta semana para eu compartilhar os achados?</p> : <div className="absolute inset-0 grid place-items-center text-center"><div><Bot className="mx-auto size-8 text-muted-foreground"/><p className="mt-3 text-xs text-muted-foreground">Configure o modelo e gere uma amostra</p></div></div>}</div><div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end"><Button variant="outline" onClick={()=>setGenerated(false)}>Limpar</Button><Button onClick={()=>setGenerated(true)}><Sparkles/> Gerar pitch com {provider}</Button>{generated&&<Button><Send/> Aprovar</Button>}</div></div></section></div>
 </>;
}

function ReportsView() {
 return <><PageIntro eyebrow="Dados portáveis" title="Relatórios e Exportação" description="Consolide resultados da operação e exporte bases prontas para sua equipe." action={<Button><Download/> Exportar tudo</Button>} />
 <div className="grid gap-4 md:grid-cols-3">{[{title:"Base completa",desc:"Todos os leads, contatos e metadados",count:"2.847 registros",icon:Database},{title:"Leads qualificados",desc:"Contatos com score comercial acima de 70%",count:"936 registros",icon:Check},{title:"Relatório operacional",desc:"Desempenho, fontes e eficiência da coleta",count:"Últimos 30 dias",icon:Gauge}].map(r=><section key={r.title} className="panel p-5"><div className="grid size-10 place-items-center bg-primary/10 text-primary"><r.icon className="size-5"/></div><h3 className="mt-5 font-display font-semibold">{r.title}</h3><p className="mt-2 min-h-10 text-xs text-muted-foreground">{r.desc}</p><p className="mt-5 font-mono text-[10px] text-info">{r.count}</p><div className="mt-4 flex gap-2"><Button variant="outline" className="flex-1"><FileText/> CSV</Button><Button variant="outline" className="flex-1"><FileSpreadsheet/> XLSX</Button></div></section>)}</div>
 <section className="panel mt-4 p-5"><div className="flex items-center justify-between"><div><h3 className="font-display font-semibold">Resumo da operação</h3><p className="mt-1 text-xs text-muted-foreground">Distribuição dos leads por estágio</p></div><FileSpreadsheet className="size-5 text-primary"/></div><div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{[["Novos","1.492","52%"],["Em análise","419","15%"],["Qualificados","936","33%"],["Com website","2.274","80%"]].map(([l,v,p])=><div key={l} className="border-l border-border pl-4"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-2 font-display text-2xl font-bold">{v}</p><p className="mt-1 font-mono text-[10px] text-primary">{p} da base</p></div>)}</div></section>
 </>;
}
