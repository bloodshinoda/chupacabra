import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Bot,
  Building2,
  Check,
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
  Info,
  Menu,
  MessageSquareText,
  Network,
  Pause,
  Play,
  Plus,
  Radio,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { BUSINESS_NICHES } from "@/lib/niches";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  cancelRun,
  engineStatus,
  exportRunReport,
  isTauriRuntime,
  listenEngineEvents,
  listProfileSettings,
  listRuns,
  loadBrazilCities,
  loadBrazilStates,
  loadWorldCities,
  loadRunLeads,
  pauseRun,
  resumeRun,
  saveProfileSettings,
  startRun,
  type EngineProfile,
  type EngineProfileSettings,
  type EngineProfileSettingsMap,
  type LeadRecord,
  type RunReportFormat,
  type TargetLocation,
  type EngineRun,
} from "@/lib/engine";

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

type View = "dashboard" | "targets" | "leads" | "outreach" | "reports" | "profiles";
type ScanState = "idle" | "running" | "paused";

const PROFILE_INFO: Record<EngineProfile, { label: string; description: string }> = {
  rapido: {
    label: "Rápido",
    description: "Snack run. Bebe o que tá na vitrine e sai correndo — sem abrir site, sem CNPJ, sem drama. Ideal pra ‘só quero ver se tem peixe nesse lago’.",
  },
  balanceado: {
    label: "Balanceado",
    description: "Fome de adulto responsável. Coleta, dá uma fuçada nos sites e não tenta beber o Maps inteiro de uma vez. O padrão de quem quer lead usable sem virar a noite.",
  },
  chupacabra: {
    label: "Chupacabra",
    description: "Modo monstro. Mais fome, mais site, mais espera entre as mordidas pra não levar bloqueio na cara. Quando o negócio é encher o balde e lamber o fundo.",
  },
};

const PROFILE_IDS: EngineProfile[] = ["rapido", "balanceado", "chupacabra"];

const PROFILE_BOUNDS: Record<keyof EngineProfileSettings, readonly [number, number]> = {
  limit: [1, 5000],
  scraper_concurrency: [1, 5],
  scrape_websites: [0, 1],
  web_concurrency: [1, 20],
  web_batch_size: [1, 500],
  web_timeout: [1, 60],
  delay_min: [0, 120],
  delay_max: [0, 120],
};

const NAV_ITEMS = [
  { id: "dashboard" as const, label: "Painel de Controle", icon: LayoutDashboard },
  { id: "targets" as const, label: "Matriz de Alvos", sub: "Cidades & Nichos", icon: Target },
  { id: "leads" as const, label: "Base de Leads", icon: Database },
  { id: "outreach" as const, label: "Automação", sub: "de Abordagem", icon: Bot },
  { id: "reports" as const, label: "Relatórios", sub: "e Exportação", icon: FileSpreadsheet },
  { id: "profiles" as const, label: "Perfis de execução", sub: "e Configurações", icon: Gauge },
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
  const [aboutOpen, setAboutOpen] = useState(false);
  const { locale, setLocale, t } = useI18n();
  const [logs, setLogs] = useState<string[]>([]);
  const [engineOnline, setEngineOnline] = useState(false);
  const [progress, setProgress] = useState(0);
  const [leadCount, setLeadCount] = useState(0);
  const [queryCount, setQueryCount] = useState(0);
  const [collectedCount, setCollectedCount] = useState(0);
  const [validCount, setValidCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [stochasticTimer, setStochasticTimer] = useState(0);
  const [profile, setProfile] = useState<EngineProfile>("balanceado");
  const [profileConfigs, setProfileConfigs] = useState<EngineProfileSettingsMap | null>(null);
  const [profileDefaults, setProfileDefaults] = useState<EngineProfileSettingsMap | null>(null);
  const [profileDrafts, setProfileDrafts] = useState<EngineProfileSettingsMap | null>(null);
  const [profileWarnings, setProfileWarnings] = useState<string[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState("");
  const [targets, setTargets] = useState<TargetLocation[]>([]);
  const [maxJobs, setMaxJobs] = useState(5000);
  const categories = BUSINESS_NICHES;
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [customCategories, setCustomCategories] = useState<Array<[string, string]>>([]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let active = true;
    setProfilesLoading(true);
    void listProfileSettings()
      .then(({ profiles: items, defaults, warnings }) => {
        if (!active) return;
        setProfileConfigs(items);
        setProfileDefaults(defaults);
        setProfileDrafts(items);
        setProfileWarnings(warnings);
        setProfilesError("");
      })
      .catch((cause) => {
        if (active) setProfilesError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (active) setProfilesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isTauriRuntime()) return;

    let active = true;
    let unlisten: (() => void) | undefined;

    void Promise.all([
      engineStatus().then((status) => setEngineOnline(status === "running")),
      listenEngineEvents((event) => {
        if (!active) return;

        const stamp = new Date(event.timestamp ?? Date.now()).toLocaleTimeString("pt-BR");
        const addLog = (message: string) => {
          setLogs((current) => [...current.slice(-7), `[${stamp}] ${message}`]);
        };

        switch (event.type) {
          case "engine_ready":
            setEngineOnline(true);
            addLog("Motor de extração pronto.");
            break;
          case "engine_stderr":
            addLog(`Engine · ${event.error ?? "erro no processo"}`);
            break;
          case "engine_status":
            setEngineOnline(true);
            break;
          case "run_started":
            setScanState("running");
            setProgress(5);
            setLeadCount(0);
            setQueryCount(0);
            setCollectedCount(0);
            setValidCount(0);
            setDuplicateCount(0);
            setStochasticTimer(0);
            addLog("Execução iniciada pelo engine.");
            break;
          case "job_started":
            setScanState("running");
            setProgress(event.run?.total_jobs ? (event.run.completed_jobs / event.run.total_jobs) * 100 : 5);
            addLog(`Job iniciado · ${event.job?.id ?? "—"}.`);
            break;
          case "crawl_progress":
            if (event.message === "Consultando página de resultados.") {
              setQueryCount((current) => current + 1);
            }
            addLog(event.message ?? "Crawler em execução.");
            break;
          case "run_delay":
            setStochasticTimer(Math.ceil(Number(event.delay ?? 0)));
            addLog(`Pausa estocástica · próximo job ${event.next_job_id ?? "—"} · ${Math.ceil(Number(event.delay ?? 0))}s.`);
            break;
          case "run_delay_tick":
            setStochasticTimer(Math.ceil(Number(event.remaining ?? 0)));
            break;
          case "report_started":
            addLog(event.message ?? "Gerando relatório XLSX.");
            break;
          case "report_completed":
            addLog("Relatório XLSX gerado com sucesso.");
            break;
          case "report_failed":
            addLog(`Falha no relatório XLSX · ${event.error ?? "erro desconhecido"}.`);
            break;
          case "enrichment_started":
            addLog(event.message ?? "Iniciando enriquecimento.");
            break;
          case "enrichment_completed":
            addLog(event.message ?? "Enriquecimento concluído.");
            break;
          case "job_completed":
            setProgress(event.run?.total_jobs ? (event.run.completed_jobs / event.run.total_jobs) * 100 : 100);
            setLeadCount((current) => current + (event.job?.results_count ?? 0));
            setCollectedCount((current) => current + (event.job?.collected_count ?? event.job?.results_count ?? 0));
            setValidCount((current) => current + (event.job?.results_count ?? 0));
            setDuplicateCount((current) => current + (event.job?.duplicates_count ?? 0));
            addLog(`Job concluído · ${event.job?.results_count ?? 0} únicos de ${event.job?.collected_count ?? event.job?.results_count ?? 0} coletados · ${event.job?.duplicates_count ?? 0} duplicados.`);
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
            setEngineOnline(false);
            addLog(`Erro do engine · ${event.error ?? "erro desconhecido"}.`);
            break;
        }
      }),
    ]).then(([, stop]) => {
      if (active) unlisten = stop;
      else stop();
    }).catch((error) => {
      setEngineOnline(false);
      addEngineLog(setLogs, `Falha ao conectar ao engine · ${error instanceof Error ? error.message : String(error)}`);
    });

    return () => {
      active = false;
      unlisten?.();
    };
  }, []);

  const startScan = async (): Promise<boolean> => {
    setLogs((current) => [...current, `[${new Date().toLocaleTimeString(locale)}] ${t("logs.starting")} · ${profile}.`]);
    setProgress(5);

    if (!isTauriRuntime()) {
      setLogs((current) => [...current, `[${new Date().toLocaleTimeString(locale)}] ${t("logs.openDesktop")}`]);
      return false;
    }

    try {
      if (!targets.length) throw new Error("Selecione ao menos uma cidade na Matriz de Alvos.");
      if (!selectedCategoryIds.length) throw new Error("Selecione ao menos um nicho na Matriz de Alvos.");
      if (!profileConfigs) throw new Error(profilesError || "Aguarde o carregamento das configurações do perfil.");
      const plannedJobs = targets.length * [...categories, ...customCategories].filter(([id]) => selectedCategoryIds.includes(id)).length;
      if (plannedJobs > maxJobs) {
        throw new Error(`A matriz possui ${plannedJobs.toLocaleString("pt-BR")} jobs e o limite atual é ${maxJobs.toLocaleString("pt-BR")}.`);
      }
      const allCategories = [...categories, ...customCategories];
      await startRun({ profile, profile_settings: profileConfigs[profile], targets, categories: allCategories.filter(([id]) => selectedCategoryIds.includes(id)), max_jobs: maxJobs });
      setScanState("running");
      return true;
    } catch (error) {
      setScanState("idle");
      addEngineLog(setLogs, `Falha ao iniciar engine · ${error instanceof Error ? error.message : String(error)}`);
      return false;
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
      <Sidebar view={view} setView={setView} open={mobileOpen} setOpen={setMobileOpen} scanState={scanState} engineOnline={engineOnline} onAbout={() => setAboutOpen(true)} />
      <main className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir navegação"><Menu /></Button>
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-primary">CHUPACABRA // CONSOLE</p>
            <h1 className="truncate text-sm font-semibold sm:text-base">{currentLabel}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><span className={cn("status-dot", engineOnline ? "" : "bg-destructive shadow-none")} /> {engineOnline ? "Engine operacional" : "Engine offline"}</div>
            <Button variant="outline" size="icon" aria-label="Sobre o Chupacabra System" onClick={() => setAboutOpen(true)}><Info /></Button>
            <div className="grid size-8 place-items-center rounded-md border border-primary/30 bg-primary/10 font-mono text-xs font-bold text-primary">RG</div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {view === "dashboard" && <DashboardView t={t} scanState={scanState} setScanState={setScanState} startScan={startScan} onPause={handlePause} onResume={handleResume} onCancel={handleCancel} profile={profile} setProfile={setProfile} profileSettings={profileConfigs?.[profile]} profileSettingsLoading={profilesLoading} progress={progress} leadCount={leadCount} queryCount={queryCount} collectedCount={collectedCount} validCount={validCount} duplicateCount={duplicateCount} stochasticTimer={stochasticTimer} logs={logs} targetCount={targets.length} categoryCount={[...categories, ...customCategories].filter(([id]) => selectedCategoryIds.includes(id)).length} plannedJobs={targets.length * [...categories, ...customCategories].filter(([id]) => selectedCategoryIds.includes(id)).length} />}
          {view === "targets" && <TargetsView targets={targets} setTargets={setTargets} categories={categories} selectedCategoryIds={selectedCategoryIds} setSelectedCategoryIds={setSelectedCategoryIds} customCategories={customCategories} setCustomCategories={setCustomCategories} maxJobs={maxJobs} setMaxJobs={setMaxJobs} startScan={async () => { const started = await startScan(); if (started) setView("dashboard"); }} goToDashboard={() => setView("dashboard")} />}
          {view === "leads" && <LeadsView />}
          {view === "outreach" && <OutreachView />}
          {view === "reports" && <ReportsView />}
          {view === "profiles" && (profileConfigs && profileDefaults && profileDrafts
            ? <ProfileSettingsView
                profileSettings={profileConfigs}
                profileDefaults={profileDefaults}
                drafts={profileDrafts}
                setDrafts={setProfileDrafts}
                selectedProfile={profile}
                setSelectedProfile={setProfile}
                warnings={profileWarnings}
                onSaved={(savedProfile, next, nextDefaults, nextWarnings) => {
                  setProfileConfigs(next);
                  setProfileDefaults(nextDefaults);
                  setProfileDrafts((current) => current ? { ...current, [savedProfile]: next[savedProfile] } : next);
                  setProfileWarnings(nextWarnings);
                  setProfilesError("");
                }}
              />
            : <section className="panel p-5">
                <p className="text-sm text-muted-foreground">{profilesLoading ? "Carregando configurações dos perfis..." : profilesError || "As configurações só estão disponíveis no aplicativo desktop."}</p>
              </section>)}
        </div>
        <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} locale={locale} setLocale={setLocale} t={t} />
      </main>
    </div>
  );
}


function addEngineLog(setLogs: React.Dispatch<React.SetStateAction<string[]>>, message: string) {
  setLogs((current) => [...current.slice(-7), `[${new Date().toLocaleTimeString("pt-BR")}] ${message}`]);
}

function Sidebar({ view, setView, open, setOpen, scanState, engineOnline, onAbout }: { view: View; setView: (v: View) => void; open: boolean; setOpen: (v: boolean) => void; scanState: ScanState; engineOnline: boolean; onAbout: () => void }) {
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
        <div className="mt-3 flex items-center gap-2"><span className={cn("status-dot", !engineOnline && "bg-destructive shadow-none", scanState === "paused" && "bg-warning")} /><span className="text-xs font-medium">{!engineOnline ? "Offline" : scanState === "running" ? "Operando" : scanState === "paused" ? "Pausado" : "Em espera"}</span></div>
        <div className="mt-3 h-1 overflow-hidden bg-muted"><div className="h-full w-full bg-primary shadow-glow" /></div>
        <div className="mt-2 flex justify-between font-mono text-[9px] text-muted-foreground"><span>Processo IPC conectado</span></div>
      </div>
      <div className="border-t border-border px-5 py-4">
        <button onClick={onAbout} className="flex w-full items-center justify-between text-left font-mono text-[9px] text-muted-foreground transition-colors hover:text-foreground">
          <span className="uppercase">Sobre</span>
          <span className="text-primary">v1.1.0</span>
        </button>
      </div>
    </aside>
  </>;
}


function AboutDialog({
  open,
  onOpenChange,
  locale,
  setLocale,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: "pt-BR" | "en-US";
  setLocale: (locale: "pt-BR" | "en-US") => void;
  t: (key: string) => string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-primary/20 bg-[#0b151b]/95 backdrop-blur-xl text-foreground">
        <DialogHeader className="text-left">
          <div className="mb-3 flex items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden border border-primary/30 bg-primary/10 p-2 shadow-glow">
              <img src="/icon.png" alt="Chupacabra" className="size-full object-contain" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl tracking-wide">Chupacabra System</DialogTitle>
              <DialogDescription className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em]">B2B Prospect Engine</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{t("about.version")}</span>
              <span className="font-mono text-sm font-semibold text-primary">1.1.0</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{t("about.engine")}</span>
              <span className="text-xs">Python + Rust/Tauri</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{t("about.language")}</span>
              <div className="flex border border-border bg-background p-1">
                {([["pt-BR", "PT-BR"], ["en-US", "EN-US"]] as const).map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setLocale(value)} className={cn("px-2 py-1 font-mono text-[9px] uppercase transition-colors", locale === value ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>{label}</button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{t("about.description")}</p>
          <div className="border-t border-border pt-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{t("about.author")}</p>
            <p className="mt-1 text-sm font-semibold">Vilson de Oliveira Junior</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("about.authorRole")}</p>
          </div>
          <div className="border-t border-border pt-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{t("about.project")}</p>
            <a href="https://github.com/bloodshinoda/chupacabra" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-xs text-primary transition-colors hover:underline">GitHub · Chupacabra System</a>
          </div>
          <p className="pt-1 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">{t("about.tagline")}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4"><div className="min-w-0"><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{eyebrow}</p><h2 className="font-display text-2xl font-bold tracking-wide sm:text-3xl">{title}</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p></div>{action && <div className="shrink-0">{action}</div>}</div>;
}

function DashboardView({ t, scanState, setScanState, startScan, onPause, onResume, onCancel, profile, setProfile, profileSettings, profileSettingsLoading, progress, leadCount, queryCount, collectedCount, validCount, duplicateCount, stochasticTimer, logs, targetCount, categoryCount, plannedJobs }: { t: (key: string) => string; scanState: ScanState; setScanState: (s: ScanState) => void; startScan: () => void; onPause: () => void; onResume: () => void; onCancel: () => void; profile: EngineProfile; setProfile: (p: EngineProfile) => void; profileSettings?: EngineProfileSettings; profileSettingsLoading: boolean; progress: number; leadCount: number; queryCount: number; collectedCount: number; validCount: number; duplicateCount: number; stochasticTimer: number; logs: string[]; targetCount: number; categoryCount: number; plannedJobs: number }) {
  const metrics = [
    { label: "Leads coletados", value: leadCount.toLocaleString("pt-BR"), delta: "na execução atual", icon: Users },
    { label: "Cidades configuradas", value: targetCount.toLocaleString("pt-BR"), delta: "na matriz atual", icon: MapPin },
    { label: "Nichos ativos", value: categoryCount.toLocaleString("pt-BR"), delta: `${plannedJobs.toLocaleString("pt-BR")} jobs`, icon: Target },
    { label: "Motor de extração", value: scanState === "running" ? "Executando" : scanState === "paused" ? "Pausado" : "Inativo", delta: scanState === "paused" ? "execução pausada" : "cadência do perfil", icon: Radio },
  ];
  return <>
    <PageIntro eyebrow="Central de inteligência" title="Painel de Controle" description="Monitore a operação, execute varreduras e acompanhe a coleta em tempo real." />
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((m, i) => <div className="metric-card" key={m.label}><div className="flex items-start justify-between"><div className="grid size-9 place-items-center border border-primary/20 bg-primary/5 text-primary"><m.icon className="size-4" /></div><span className={cn("font-mono text-[10px]", i === 0 ? "text-primary" : "text-muted-foreground")}>{m.delta}</span></div><p className="mt-5 text-xs text-muted-foreground">{m.label}</p><p className={cn("mt-1 font-display text-2xl font-bold", i === 3 && scanState === "running" && "text-primary")}>{m.value}</p></div>)}</section>

    <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
      <div className="panel overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-display text-lg font-semibold">Operação de varredura</p><p className="mt-1 text-xs text-muted-foreground">Execução real via engine · matriz atual: {targetCount} localidades × {categoryCount} nichos</p><p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">{PROFILE_INFO[profile].description}</p>{profileSettings && <p className="mt-1 font-mono text-[9px] text-primary">Teto {profileSettings.limit.toLocaleString("pt-BR")} por job · {profileSettings.scraper_concurrency} jobs simultâneos · pausa {profileSettings.delay_min}–{profileSettings.delay_max}s</p>}</div><div className="flex flex-wrap gap-2"><div className="flex items-center border border-border bg-surface p-1">{PROFILE_IDS.map((item)=><button key={item} onClick={()=>setProfile(item)} className={cn("px-2.5 py-1.5 font-mono text-[9px] uppercase transition-colors", profile===item ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>{PROFILE_INFO[item].label}</button>)}</div>{scanState === "running" && <><Button variant="outline" onClick={onPause}><Pause /> Pausar</Button><Button variant="outline" onClick={onCancel}><X /> Cancelar</Button></>}{scanState === "paused" && <><Button variant="outline" onClick={onResume}><Play /> Retomar</Button><Button variant="outline" onClick={onCancel}><X /> Cancelar</Button></>}{profileSettingsLoading && <span className="self-center text-[10px] text-muted-foreground">Carregando perfil...</span>}<Button size="lg" onClick={startScan} disabled={!profileSettings || profileSettingsLoading} className="scan-button"><Zap />{scanState === "running" ? t("actions.chuparAgain") : t("actions.chupar")}</Button></div></div>
        <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_220px]">
          <div><div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">Progresso do ciclo</span><span className="font-mono text-primary">{Math.round(progress)}%</span></div><div className="h-2 overflow-hidden bg-muted"><div className="h-full bg-primary transition-all duration-700 shadow-glow" style={{ width: `${progress}%` }} /></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{[
  ["Consultas", queryCount.toLocaleString("pt-BR")],
  ["Coletados", collectedCount.toLocaleString("pt-BR")],
  ["Únicos", validCount.toLocaleString("pt-BR")],
  ["Duplicados", duplicateCount.toLocaleString("pt-BR")],
  ["Aproveitamento", collectedCount ? `${((validCount / collectedCount) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—"],
].map(([a,b]) => <div key={a} className="border-l border-border pl-3"><p className="font-mono text-[9px] uppercase text-muted-foreground">{a}</p><p className="mt-1 text-sm font-semibold">{b}</p></div>)}</div></div>
          <div className="border border-border bg-surface p-4"><div className="flex items-center gap-2 text-xs font-medium"><Clock3 className="size-4 text-info" /> Timer estocástico</div><p className="mt-3 font-mono text-2xl font-bold">{stochasticTimer > 0 ? stochasticTimer.toLocaleString("pt-BR") : "—"}<span className="text-xs text-muted-foreground">s</span></p><p className="mt-1 text-[10px] text-muted-foreground">{stochasticTimer > 0 ? "Aguardando o próximo job." : "Ativo somente entre jobs."} · Perfil {profile}</p></div>
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
  selectedCategoryIds,
  setSelectedCategoryIds,
  customCategories,
  setCustomCategories,
  maxJobs,
  setMaxJobs,
  startScan,
  goToDashboard,
}: {
  targets: TargetLocation[];
  setTargets: (targets: TargetLocation[]) => void;
  categories: Array<[string, string]>;
  selectedCategoryIds: string[];
  setSelectedCategoryIds: (ids: string[]) => void;
  customCategories: Array<[string, string]>;
  setCustomCategories: (categories: Array<[string, string]>) => void;
  maxJobs: number;
  setMaxJobs: (value: number) => void;
  startScan: () => void;
  goToDashboard: () => void;
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
  const [categoryQuery, setCategoryQuery] = useState("");

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
  const allCategories = [...categories, ...customCategories];
  const normalizedQuery = categoryQuery.trim().toLocaleLowerCase("pt-BR");
  const selectedCategories = allCategories.filter(([id]) => selectedCategoryIds.includes(id));
  const suggestions = normalizedQuery
    ? allCategories
        .filter(([id, label]) => !selectedCategoryIds.includes(id) && label.toLocaleLowerCase("pt-BR").includes(normalizedQuery))
        .slice(0, 8)
    : [];
  const exactMatch = allCategories.find(([, label]) => label.toLocaleLowerCase("pt-BR") === normalizedQuery);
  const addCategory = (id: string) => {
    if (selectedCategoryIds.includes(id)) return;
    setSelectedCategoryIds([...selectedCategoryIds, id]);
    setCategoryQuery("");
  };
  const addCustomCategory = () => {
    const label = categoryQuery.trim();
    if (!label) return;
    const existing = allCategories.find(([, item]) => item.toLocaleLowerCase("pt-BR") === label.toLocaleLowerCase("pt-BR"));
    if (existing) {
      addCategory(existing[0]);
      return;
    }
    const id = `custom:${crypto.randomUUID()}`;
    setCustomCategories([...customCategories, [id, label]]);
    addCategory(id);
  };
  const removeCategory = (id: string) => {
    setSelectedCategoryIds(selectedCategoryIds.filter((item) => item !== id));
  };
  const activeCategories = selectedCategories;
  const plannedJobs = targets.length * activeCategories.length;
  const overLimit = plannedJobs > maxJobs;
  const selectedVisibleCount = results.filter((city) => targets.some((item) => item.id === city.id)).length;

  const toggleCity = (city: TargetLocation) => {
    const exists = targets.some((item) => item.id === city.id);
    setTargets(exists ? targets.filter((item) => item.id !== city.id) : [...targets, city]);
  };

  const addAllVisible = () => {
    const incoming = results.slice(0, Math.max(0, Math.floor(maxJobs / Math.max(activeCategories.length, 1))));
    const merged = new Map(targets.map((target) => [target.id, target]));
    incoming.forEach((target) => merged.set(target.id, target));
    const next = [...merged.values()];
    if (next.length * activeCategories.length > maxJobs) {
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
        <div>
          <p className="field-label">1 · Consultas da campanha</p>
          <p className="mt-1 text-xs text-muted-foreground">Adicione apenas os nichos que você quer pesquisar. Digite para encontrar uma sugestão ou criar uma consulta personalizada.</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={categoryQuery}
            onChange={(e) => setCategoryQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomCategory()}
            placeholder={selectedCategories.length ? "Adicionar outra consulta..." : "Digite um nicho para começar..."}
            className="pl-9"
            aria-label="Adicionar consulta de nicho"
          />
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden border border-border bg-popover shadow-lg">
              {suggestions.map(([id, label]) => (
                <button key={id} type="button" onClick={() => addCategory(id)} className="flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left text-xs transition-colors last:border-b-0 hover:bg-primary/10">
                  <Plus className="size-3.5 shrink-0 text-primary" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
          {normalizedQuery && !exactMatch && suggestions.length === 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden border border-border bg-popover shadow-lg">
              <button type="button" onClick={addCustomCategory} className="flex w-full items-center gap-3 px-4 py-3 text-left text-xs transition-colors hover:bg-primary/10">
                <Plus className="size-3.5 shrink-0 text-primary" />
                <span>Adicionar consulta personalizada: <strong>{categoryQuery.trim()}</strong></span>
              </button>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {selectedCategories.map(([id, label], index) => (
            <div key={id} className="flex items-center gap-3 border border-primary/20 bg-primary/5 px-4 py-3">
              <span className="font-mono text-[9px] text-primary">{String(index + 1).padStart(2, "0")}</span>
              <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
              <button type="button" onClick={() => removeCategory(id)} className="text-muted-foreground transition-colors hover:text-destructive" aria-label={`Remover consulta ${label}`}>
                <X className="size-4" />
              </button>
            </div>
          ))}
          {!selectedCategories.length && (
            <div className="border border-dashed border-border px-4 py-6 text-center">
              <p className="text-xs text-muted-foreground">Nenhuma consulta adicionada.</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Comece digitando um nicho acima.</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="font-mono text-[10px] text-muted-foreground">{selectedCategories.length} {selectedCategories.length === 1 ? "consulta" : "consultas"} adicionada{selectedCategories.length === 1 ? "" : "s"}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{allCategories.length} sugestões disponíveis</span>
        </div>
      </div>
    </section>

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
                <Select value={stateCode} onValueChange={setStateCode} disabled={!states.length}>
                  <SelectTrigger className="field mt-2"><SelectValue placeholder="Selecione a UF" /></SelectTrigger>
                  <SelectContent>
                    {states.map((state) => <SelectItem key={state.code} value={state.code}>{state.code} — {state.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </label>
              <label className="block">
                <span className="field-label">Buscar município</span>
                <input className="field mt-2" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void refreshBrazil()} placeholder="Ex: Blumenau" />
              </label>
              <label className="block">
                <span className="field-label">Escopo</span>
                <Select value={scope} onValueChange={(value) => setScope(value as typeof scope)}>
                  <SelectTrigger className="field mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Seleção manual</SelectItem>
                    <SelectItem value="all">Todos os municípios</SelectItem>
                    <SelectItem value="capitals">Capital da UF</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-[220px_1fr_auto]">
              <label className="block">
                <span className="field-label">População mínima · Censo 2022</span>
                <input className="field mt-2" type="number" min={0} step={1000} value={minPopulation} onChange={(e) => setMinPopulation(Math.max(0, Number(e.target.value) || 0))} />
              </label>
              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={() => void refreshBrazil()} disabled={loading}>{loading ? "Carregando..." : "Atualizar municípios"}</Button>
                <Button variant="outline" onClick={addAllVisible} disabled={!results.length || !activeCategories.length}>Adicionar filtrados</Button>
                <Button variant="outline" onClick={() => setTargets([])} disabled={!targets.length}>Limpar seleção</Button>
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

        <div className="max-h-[420px] overflow-y-auto overscroll-contain border border-border bg-background/40 p-2 pr-1">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((city) => (
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
      </div>
    </section>

    <section className="panel mt-4 p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_220px_auto] lg:items-end">
        <div>
          <h3 className="font-display font-semibold">Campanha planejada</h3>
          <p className="mt-1 text-xs text-muted-foreground">{targets.length} localidades × {activeCategories.length} nichos = {plannedJobs.toLocaleString("pt-BR")} jobs previstos</p>
        </div>
        <label className="block">
          <span className="field-label">Limite máximo de jobs</span>
          <input className="field mt-2" type="number" min={1} max={10000} step={100} value={maxJobs} onChange={(e) => setMaxJobs(Math.min(10000, Math.max(1, Number(e.target.value) || 1)))} />
        </label>
        <Button variant="outline" onClick={() => { setTargets([]); setError(""); }} disabled={!targets.length}>Limpar</Button>
      </div>

      {overLimit && <p className="mt-4 border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">A campanha ultrapassa o limite. O engine também bloqueia matrizes acima de 10.000 jobs.</p>}


      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">{targets.length} localidades × {activeCategories.length} nichos = <span className="font-mono text-primary">{plannedJobs.toLocaleString("pt-BR")} jobs</span></p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={goToDashboard}>Voltar ao painel</Button>
          <Button onClick={startScan} disabled={!targets.length || !activeCategories.length || overLimit}><Zap /> CHUPAR</Button>
        </div>
      </div>

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
  const [runs, setRuns] = useState<EngineRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("Todas");
  const [category, setCategory] = useState("Todas");
  const [scoreBand, setScoreBand] = useState("Todas");
  const [onlyCnpj, setOnlyCnpj] = useState(false);
  const [onlyWebsite, setOnlyWebsite] = useState(false);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let active = true;
    setLoadingRuns(true);
    void listRuns().then((items) => {
      if (!active) return;
      setRuns(items);
      const firstRun = items[0];
      if (firstRun) setSelectedRunId(firstRun.id);
    }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : String(reason));
    }).finally(() => {
      if (active) setLoadingRuns(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedRunId || !isTauriRuntime()) { setLeads([]); return; }
    let active = true;
    setLoadingLeads(true);
    setError("");
    void loadRunLeads(selectedRunId).then((items) => {
      if (active) setLeads(items);
    }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : String(reason));
    }).finally(() => {
      if (active) setLoadingLeads(false);
    });
    return () => { active = false; };
  }, [selectedRunId]);

  const cities = useMemo(() => ["Todas", ...Array.from(new Set(leads.map((lead) => lead.city).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"))], [leads]);
  const categories = useMemo(() => ["Todas", ...Array.from(new Set(leads.map((lead) => lead.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"))], [leads]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("pt-BR");
    return leads.filter((lead) => {
      const haystack = [lead.title, lead.category, lead.city, lead.phoneNumber, lead.domain, lead.web_cnpj, lead.cnpj_porte].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
      return (!needle || haystack.includes(needle)) && (city === "Todas" || lead.city === city) && (category === "Todas" || lead.category === category) && (scoreBand === "Todas" || scoreBandOf(lead) === scoreBand) && (!onlyCnpj || Boolean(lead.web_cnpj)) && (!onlyWebsite || Boolean(lead.domain));
    });
  }, [leads, search, city, category, scoreBand, onlyCnpj, onlyWebsite]);
  const selectedRun = runs.find((run) => run.id === selectedRunId);
  const scoreOf = (lead: LeadRecord) => { const value = Number(lead.score); return Number.isFinite(value) ? value.toFixed(1) : "—"; };
  const statusOf = (lead: LeadRecord) => { const score = Number(lead.score); if (Number.isFinite(score) && score >= 75) return "Qualificado"; if (Number.isFinite(score) && score >= 50) return "Em análise"; return "Novo"; };

  return <>
    <PageIntro eyebrow="Inteligência consolidada" title="Base de Leads" description="Leads reais das execuções do engine, com enriquecimento e score quando disponíveis." action={<SelectField value={selectedRunId || "Nenhuma execução"} setValue={setSelectedRunId} options={runs.length ? runs.map((run) => run.id) : ["Nenhuma execução"]} />} />
    {!isTauriRuntime() && <section className="panel mb-4 border-warning/30 p-5"><p className="text-sm font-medium text-warning">A Base de Leads funciona dentro do aplicativo desktop.</p><p className="mt-1 text-xs text-muted-foreground">Abra o Chupacabra pelo Tauri para carregar as execuções reais.</p></section>}
    {error && <section className="panel mb-4 border-destructive/30 p-4 text-xs text-destructive">{error}</section>}
    <section className="panel overflow-hidden">
      <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(240px,1fr)_180px_180px]"><label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="field pl-9" placeholder="Buscar empresa, nicho, cidade ou CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} /></label><SelectField value={city} setValue={setCity} options={cities} /><SelectField value={category} setValue={setCategory} options={categories} /></div>
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4"><SelectField value={scoreBand} setValue={setScoreBand} options={["Todas", "Micro", "Pequena", "Média", "Grande"]} /><Button variant={onlyCnpj ? "default" : "outline"} size="sm" onClick={() => setOnlyCnpj((value) => !value)}>CNPJ</Button><Button variant={onlyWebsite ? "default" : "outline"} size="sm" onClick={() => setOnlyWebsite((value) => !value)}>Website</Button><span className="ml-auto font-mono text-[10px] text-muted-foreground">{loadingRuns || loadingLeads ? "CARREGANDO..." : `${filtered.length.toLocaleString("pt-BR")} / ${leads.length.toLocaleString("pt-BR")} leads`}</span></div>
      {loadingRuns ? <div className="p-10 text-center text-sm text-muted-foreground">Carregando execuções...</div> : !runs.length ? <div className="p-10 text-center"><Database className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Nenhuma execução encontrada.</p><p className="mt-1 text-xs text-muted-foreground">Execute uma prospecção pela Matriz de Alvos para alimentar esta base.</p></div> : loadingLeads ? <div className="p-10 text-center text-sm text-muted-foreground">Carregando leads da execução...</div> : !filtered.length ? <div className="p-10 text-center text-sm text-muted-foreground">Nenhum lead corresponde aos filtros atuais.</div> :
      <div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-left text-sm"><thead><tr className="border-b border-border font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{["Empresa", "Categoria", "Cidade", "Telefone", "Website", "CNPJ", "Porte", "Score", "Faixa"].map((header) => <th key={header} className="px-4 py-4 font-medium">{header}</th>)}</tr></thead><tbody>{filtered.map((lead, index) => <tr key={lead.id || lead.run_id + "-" + lead.job_id + "-" + lead.title + "-" + index} className="border-b border-border/60 transition-colors hover:bg-surface"><td className="px-4 py-4 font-medium">{lead.title || "—"}</td><td className="px-4 py-4 text-muted-foreground">{lead.category || "—"}</td><td className="px-4 py-4 text-muted-foreground">{lead.city || "—"}</td><td className="px-4 py-4 font-mono text-xs">{lead.phoneNumber || "—"}</td><td className="px-4 py-4 text-info">{lead.domain || "—"}</td><td className="px-4 py-4 font-mono text-xs">{lead.web_cnpj || "—"}</td><td className="px-4 py-4">{lead.cnpj_porte || "—"}</td><td className="px-4 py-4 font-mono text-primary">{scoreOf(lead)}</td><td className="px-4 py-4"><StatusBadge status={statusOf(lead)} /></td></tr>)}</tbody></table></div>}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-4 text-xs text-muted-foreground"><span>{selectedRun ? "Execução " + selectedRun.id + " · " + selectedRun.completed_jobs + "/" + selectedRun.total_jobs + " jobs concluídos" : "Nenhuma execução selecionada"}</span><span className="font-mono text-primary">BASE REAL // ENGINE</span></div>
    </section>
  </>;
}
function SelectField({value,setValue,options}:{value:string;setValue:(v:string)=>void;options:string[]}) {
  return <Select value={value} onValueChange={setValue}>
    <SelectTrigger className="field"><SelectValue /></SelectTrigger>
    <SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
  </Select>;
}
function scoreBandOf(lead: LeadRecord) {
  const value = Number(lead["score"]);
  if (!Number.isFinite(value)) return "";
  if (value < 25) return "Micro";
  if (value < 50) return "Pequena";
  if (value < 75) return "Média";
  return "Grande";
}

type NumericProfileSetting = Exclude<keyof EngineProfileSettings, "scrape_websites">;

function profileSettingErrors(settings: EngineProfileSettings): Partial<Record<keyof EngineProfileSettings, string>> {
  const errors: Partial<Record<keyof EngineProfileSettings, string>> = {};
  for (const key of Object.keys(PROFILE_BOUNDS) as Array<keyof EngineProfileSettings>) {
    if (key === "scrape_websites") continue;
    const value = settings[key];
    const [minimum, maximum] = PROFILE_BOUNDS[key];
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
      errors[key] = `Use um valor entre ${minimum} e ${maximum}${key.includes("delay") || key === "web_timeout" ? " segundos" : ""}.`;
    }
  }
  if (settings.delay_max < settings.delay_min) {
    errors.delay_max = "O máximo deve ser maior ou igual ao mínimo.";
  }
  return errors;
}

function ProfileSettingsView({
  profileSettings,
  profileDefaults,
  drafts,
  setDrafts,
  selectedProfile,
  setSelectedProfile,
  warnings,
  onSaved,
}: {
  profileSettings: EngineProfileSettingsMap;
  profileDefaults: EngineProfileSettingsMap;
  drafts: EngineProfileSettingsMap;
  setDrafts: React.Dispatch<React.SetStateAction<EngineProfileSettingsMap | null>>;
  selectedProfile: EngineProfile;
  setSelectedProfile: (profile: EngineProfile) => void;
  warnings: string[];
  onSaved: (
    profile: EngineProfile,
    profiles: EngineProfileSettingsMap,
    defaults: EngineProfileSettingsMap,
    warnings: string[],
  ) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const draft = drafts[selectedProfile];
  const errors = profileSettingErrors(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(profileSettings[selectedProfile]);
  const invalid = Object.keys(errors).length > 0;

  const updateNumber = (field: NumericProfileSetting, value: number) => {
    setDrafts((current) => current ? {
      ...current,
      [selectedProfile]: { ...current[selectedProfile], [field]: value },
    } : current);
    setStatus("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const result = await saveProfileSettings(selectedProfile, draft);
      onSaved(selectedProfile, result.profiles, result.defaults, result.warnings);
      setStatus(`${PROFILE_INFO[selectedProfile].label}: perfil salvo.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    setDrafts((current) => current ? { ...current, [selectedProfile]: profileSettings[selectedProfile] } : current);
    setError("");
    setStatus("Alterações descartadas.");
  };

  const restoreDefaults = () => {
    if (dirty && !window.confirm("Descartar as alterações não salvas deste perfil e carregar os valores padrão?")) return;
    setDrafts((current) => current ? { ...current, [selectedProfile]: profileDefaults[selectedProfile] } : current);
    setError("");
    setStatus("Padrões carregados no rascunho. Salve o perfil para aplicá-los.");
  };

  return (
    <>
      <PageIntro
        eyebrow="Configuração real do motor"
        title="Perfis de execução"
        description="Personalize cada perfil separadamente. Os valores salvos são validados pelo engine e usados como snapshot em cada nova execução."
      />
      {error && <section className="panel mb-4 border-destructive/30 p-4 text-xs text-destructive">{error}</section>}
      {warnings.map((warning) => <section key={warning} className="panel mb-2 border-warning/30 p-4 text-xs text-warning">{warning}</section>)}
      {status && <section className="panel mb-4 border-primary/30 p-4 text-xs text-primary">{status}</section>}

      <section className="panel p-5">
        <p className="field-label">Perfil de execução</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {PROFILE_IDS.map((profileId) => (
            <button
              key={profileId}
              type="button"
              onClick={() => { setSelectedProfile(profileId); setError(""); setStatus(""); }}
              className={cn(
                "border p-4 text-left transition-colors",
                selectedProfile === profileId ? "border-primary bg-primary/10" : "border-border bg-surface hover:border-primary/40",
              )}
            >
              <span className="font-display text-sm font-semibold">{PROFILE_INFO[profileId].label}</span>
              <span className="mt-2 block text-xs leading-5 text-muted-foreground">{PROFILE_INFO[profileId].description}</span>
              {JSON.stringify(drafts[profileId]) !== JSON.stringify(profileSettings[profileId]) && (
                <span className="mt-3 block font-mono text-[9px] uppercase text-warning">Alterações não salvas</span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="panel mt-4 space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="field-label">Configurações básicas · {PROFILE_INFO[selectedProfile].label}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{PROFILE_INFO[selectedProfile].description}</p>
          </div>
          <span className={cn("font-mono text-[10px] uppercase", dirty ? "text-warning" : "text-primary")}>
            {dirty ? "Alterações não salvas" : "Perfil salvo"}
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <ProfileNumberField
            label="Tamanho do banquete"
            description="Quantos leads o bicho pode engolir nessa run. Mais alto = mais volume (e mais tempo)."
            tooltip="Não é garantia de N leads; é o teto. O Maps e o dedupe decidem o que sobra no prato."
            value={draft.limit}
            minimum={PROFILE_BOUNDS.limit[0]}
            maximum={PROFILE_BOUNDS.limit[1]}
            error={errors.limit}
            onChange={(value) => updateNumber("limit", value)}
          />
          <ProfileNumberField
            label="Bocadas ao mesmo tempo"
            description="Quantas buscas em paralelo. Sobe a velocidade; passa do ponto e o PC (ou o Maps) reclama."
            tooltip="Paralelo demais vira engasgo. Se a memória chorar, baixa isso."
            value={draft.scraper_concurrency}
            minimum={PROFILE_BOUNDS.scraper_concurrency[0]}
            maximum={PROFILE_BOUNDS.scraper_concurrency[1]}
            error={errors.scraper_concurrency}
            onChange={(value) => updateNumber("scraper_concurrency", value)}
          />
        </div>

        <label className="flex items-start justify-between gap-4 border border-border bg-surface p-4">
          <span>
            <span className="field-label" title="Aqui que nasce telefone bonito e CNPJ. Também é o que deixa a run mais longa.">Abrir o site da vítima</span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">Liga a visita aos sites pra achar telefone, CNPJ e afins. Desligado = mais rápido, lead mais ‘cru’.</span>
          </span>
          <Switch checked={draft.scrape_websites} onCheckedChange={(checked) => {
            setDrafts((current) => current ? { ...current, [selectedProfile]: { ...current[selectedProfile], scrape_websites: checked } } : current);
            setStatus("");
          }} aria-label="Abrir o site da vítima" />
        </label>

        <div className={cn("grid gap-5 md:grid-cols-2", !draft.scrape_websites && "opacity-50")}>
          <ProfileNumberField
            label="Aberturas simultâneas"
            description="Quantos sites fuçar de uma vez. Mais paralelo = mais rápido e mais chance de site lento travar a fila."
            value={draft.web_concurrency}
            minimum={PROFILE_BOUNDS.web_concurrency[0]}
            maximum={PROFILE_BOUNDS.web_concurrency[1]}
            error={errors.web_concurrency}
            disabled={!draft.scrape_websites}
            onChange={(value) => updateNumber("web_concurrency", value)}
          />
        </div>

        <details className="border border-border bg-surface">
          <summary className="cursor-pointer px-4 py-3 text-xs font-semibold">
            Configurações avançadas
            <span className="ml-2 font-mono text-[9px] uppercase text-muted-foreground">Avançado</span>
          </summary>
          <div className="grid gap-5 border-t border-border p-4 md:grid-cols-2">
            <ProfileNumberField
              label="Tamanho do bocado"
              description="Processa em grupos. Lote maior = menos idas e vindas; lote menor = mais controle fino."
              value={draft.web_batch_size}
              minimum={PROFILE_BOUNDS.web_batch_size[0]}
              maximum={PROFILE_BOUNDS.web_batch_size[1]}
              error={errors.web_batch_size}
              disabled={!draft.scrape_websites}
              onChange={(value) => updateNumber("web_batch_size", value)}
            />
            <ProfileNumberField
              label="Paciência com site lerdo"
              description="Quanto tempo esperar antes de largar um site que não responde."
              value={draft.web_timeout}
              minimum={PROFILE_BOUNDS.web_timeout[0]}
              maximum={PROFILE_BOUNDS.web_timeout[1]}
              unit="segundos"
              error={errors.web_timeout}
              disabled={!draft.scrape_websites}
              onChange={(value) => updateNumber("web_timeout", value)}
            />
            <ProfileNumberField
              label="Tempo entre mordidas · mínimo"
              description="Pausa aleatória entre o início de cada job de busca. Intervalo maior = mais ‘educado’ com o Maps; menor = mais fome, mais risco."
              tooltip="O Chupacabra respira entre as vítimas. Intervalo apertado = run rápida e cara feia do provedor."
              value={draft.delay_min}
              minimum={PROFILE_BOUNDS.delay_min[0]}
              maximum={PROFILE_BOUNDS.delay_min[1]}
              unit="segundos"
              error={errors.delay_min}
              onChange={(value) => updateNumber("delay_min", value)}
            />
            <ProfileNumberField
              label="Tempo entre mordidas · máximo"
              description="O tempo máximo da pausa aleatória entre o início de cada job."
              value={draft.delay_max}
              minimum={PROFILE_BOUNDS.delay_max[0]}
              maximum={PROFILE_BOUNDS.delay_max[1]}
              unit="segundos"
              error={errors.delay_max}
              onChange={(value) => updateNumber("delay_max", value)}
            />
          </div>
        </details>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={restoreDefaults}>Restaurar padrão</Button>
          <Button variant="outline" onClick={discardChanges} disabled={!dirty || saving}>Descartar alterações</Button>
          <Button onClick={() => void handleSave()} disabled={!dirty || invalid || saving}>
            {saving ? "Salvando..." : "Salvar perfil"}
          </Button>
        </div>
      </section>
    </>
  );
}

function ProfileNumberField({
  label,
  description,
  tooltip,
  value,
  minimum,
  maximum,
  unit,
  error,
  disabled = false,
  onChange,
}: {
  label: string;
  description: string;
  tooltip?: string;
  value: number;
  minimum: number;
  maximum: number;
  unit?: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="field-label" title={tooltip}>{label}{unit ? ` · ${unit}` : ""}</span>
      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
      <input
        className={cn("field mt-2", error && "border-destructive")}
        type="number"
        min={minimum}
        max={maximum}
        step={1}
        value={value}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
      <span className="mt-1 block font-mono text-[9px] text-muted-foreground">Faixa técnica: {minimum}–{maximum}{unit ? ` ${unit}` : ""}</span>
    </label>
  );
}

function StatusBadge({status}:{status:string}) { return <span className={cn("status-badge", status==="Qualificado"&&"status-success", status==="Em análise"&&"status-info", status==="Descartado"&&"status-muted")}>{status}</span>; }

function OutreachView() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <PageIntro
        eyebrow="Inteligência artificial"
        title="Automação de Abordagem"
        description="Geração de mensagens comerciais contextualizadas e automação inteligente de abordagem."
      />

      <section className="panel relative overflow-hidden p-8 sm:p-10">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mx-auto grid size-16 place-items-center border border-primary/30 bg-primary/10 text-primary shadow-glow">
            <Sparkles className="size-7" />
          </div>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            Módulo de IA
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold tracking-wide sm:text-3xl">
            Inteligência artificial está a caminho
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Estamos preparando a camada de IA do Chupacabra para gerar abordagens
            comerciais contextualizadas a partir dos leads coletados.
          </p>
          <Button className="mt-6" onClick={() => setOpen(true)}>
            <Sparkles /> Em breve
          </Button>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-primary/20 bg-[#0b151b] text-foreground">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto grid size-14 place-items-center border border-primary/30 bg-primary/10 text-primary shadow-glow">
              <Sparkles className="size-6" />
            </div>
            <DialogTitle className="mt-2 font-display text-2xl tracking-wide">
              IA · Em breve
            </DialogTitle>
            <DialogDescription className="mx-auto max-w-sm leading-6">
              Este módulo está reservado para a próxima fase do Chupacabra System.
              A base de prospecção e os dados dos leads já estão prontos para receber
              a camada de inteligência.
            </DialogDescription>
          </DialogHeader>
          <div className="border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <Bot className="size-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Geração e automação comercial</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Em desenvolvimento · aguarde a próxima atualização.
                </p>
              </div>
            </div>
          </div>
          <Button onClick={() => setOpen(false)}>Entendido</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
function ReportsView() {
  const [runs, setRuns] = useState<EngineRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [onlyCnpj, setOnlyCnpj] = useState(false);
  const [onlyWebsite, setOnlyWebsite] = useState(false);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [exporting, setExporting] = useState<RunReportFormat | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let active = true;
    setLoadingRuns(true);
    void listRuns()
      .then((items) => {
        if (!active) return;
        setRuns(items);
        const firstRun = items[0];
        if (firstRun) setSelectedRunId(firstRun.id);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (active) setLoadingRuns(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedRunId || !isTauriRuntime()) {
      setLeads([]);
      setLoadingLeads(false);
      return;
    }
    let active = true;
    setLeads([]);
    setLoadingLeads(true);
    setError("");
    void loadRunLeads(selectedRunId)
      .then((items) => {
        if (active) setLeads(items);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (active) setLoadingLeads(false);
      });
    return () => {
      active = false;
    };
  }, [selectedRunId]);

  const filteredLeads = useMemo(
    () =>
      leads.filter(
        (lead) =>
          (!onlyCnpj || Boolean(lead["web_cnpj"])) && (!onlyWebsite || Boolean(lead["domain"])),
      ),
    [leads, onlyCnpj, onlyWebsite],
  );
  const selectedRun = runs.find((run) => run.id === selectedRunId);
  const countBand = (band: string) =>
    filteredLeads.filter((lead) => scoreBandOf(lead) === band).length;
  const qualifiedCount = countBand("Grande");
  const analysisCount = filteredLeads.filter((lead) => {
    const score = Number(lead["score"]);
    return Number.isFinite(score) && score >= 50 && score < 75;
  }).length;
  const newCount = filteredLeads.length - qualifiedCount - analysisCount;
  const websiteCount = filteredLeads.filter((lead) => Boolean(lead["domain"])).length;
  const percentOfBase = (count: number) =>
    filteredLeads.length ? `${Math.round((count / filteredLeads.length) * 100)}%` : "0%";

  const handleExport = async (format: RunReportFormat) => {
    if (!selectedRunId) return;
    setExporting(format);
    setError("");
    setMessage("");
    try {
      const paths = await exportRunReport(selectedRunId, format);
      setMessage(
        Object.entries(paths)
          .map(([kind, path]) => `${kind.toUpperCase()}: ${path}`)
          .join(" · "),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setExporting(null);
    }
  };

  const exportDisabled = !selectedRunId || loadingRuns || loadingLeads || exporting !== null;
  const reports = [
    {
      title: "Base completa",
      desc: "Todos os leads, contatos e metadados",
      count: `${filteredLeads.length.toLocaleString("pt-BR")} registros`,
      icon: Database,
    },
    {
      title: "Leads qualificados",
      desc: "Leads na faixa de score Grande (75–100)",
      count: `${qualifiedCount.toLocaleString("pt-BR")} registros`,
      icon: Check,
    },
    {
      title: "Relatório operacional",
      desc: "Desempenho e eficiência da execução selecionada",
      count: selectedRun
        ? `${selectedRun.completed_jobs}/${selectedRun.total_jobs} jobs concluídos`
        : "Nenhuma execução selecionada",
      icon: Gauge,
    },
  ];

  return (
    <>
      <PageIntro
        eyebrow="Dados portáveis"
        title="Relatórios e Exportação"
        description="Consolide resultados da execução selecionada e exporte bases prontas para sua equipe."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <SelectField
              value={selectedRunId || "Nenhuma execução"}
              setValue={setSelectedRunId}
              options={runs.length ? runs.map((run) => run.id) : ["Nenhuma execução"]}
            />
            <Button onClick={() => void handleExport("all")} disabled={exportDisabled}>
              <Download /> {exporting === "all" ? "Exportando..." : "Exportar tudo"}
            </Button>
          </div>
        }
      />
      {!isTauriRuntime() && (
        <section className="panel mb-4 border-warning/30 p-5">
          <p className="text-sm font-medium text-warning">
            Relatórios funcionam dentro do aplicativo desktop.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Abra o Chupacabra pelo Tauri para carregar execuções reais.
          </p>
        </section>
      )}
      {error && (
        <section className="panel mb-4 border-destructive/30 p-4 text-xs text-destructive">
          {error}
        </section>
      )}
      {message && (
        <section className="panel mb-4 border-primary/30 p-4 text-xs text-primary">
          {message}
        </section>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          variant={onlyCnpj ? "default" : "outline"}
          size="sm"
          onClick={() => setOnlyCnpj((value) => !value)}
        >
          CNPJ
        </Button>
        <Button
          variant={onlyWebsite ? "default" : "outline"}
          size="sm"
          onClick={() => setOnlyWebsite((value) => !value)}
        >
          Website
        </Button>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {loadingRuns || loadingLeads
            ? "CARREGANDO..."
            : `${filteredLeads.length.toLocaleString("pt-BR")} / ${leads.length.toLocaleString("pt-BR")} leads`}
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {reports.map((report) => (
          <section key={report.title} className="panel p-5">
            <div className="grid size-10 place-items-center bg-primary/10 text-primary">
              <report.icon className="size-5" />
            </div>
            <h3 className="mt-5 font-display font-semibold">{report.title}</h3>
            <p className="mt-2 min-h-10 text-xs text-muted-foreground">{report.desc}</p>
            <p className="mt-5 font-mono text-[10px] text-info">{report.count}</p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => void handleExport("csv")}
                disabled={exportDisabled}
              >
                <FileText /> CSV
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => void handleExport("xlsx")}
                disabled={exportDisabled}
              >
                <FileSpreadsheet /> XLSX
              </Button>
            </div>
          </section>
        ))}
      </div>
      <section className="panel mt-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold">Resumo da operação</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Distribuição dos leads filtrados por estágio
            </p>
          </div>
          <FileSpreadsheet className="size-5 text-primary" />
        </div>
        {loadingRuns ? (
          <p className="mt-8 text-sm text-muted-foreground">Carregando execuções...</p>
        ) : loadingLeads ? (
          <p className="mt-8 text-sm text-muted-foreground">Carregando leads da execução...</p>
        ) : !selectedRun ? (
          <p className="mt-8 text-sm text-muted-foreground">Nenhuma execução encontrada.</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Novos", newCount, percentOfBase(newCount)],
              ["Em análise", analysisCount, percentOfBase(analysisCount)],
              ["Qualificados", qualifiedCount, percentOfBase(qualifiedCount)],
              ["Com website", websiteCount, percentOfBase(websiteCount)],
            ].map(([label, value, percent]) => (
              <div key={String(label)} className="border-l border-border pl-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-2 font-display text-2xl font-bold">
                  {Number(value).toLocaleString("pt-BR")}
                </p>
                <p className="mt-1 font-mono text-[10px] text-primary">{percent} da base</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
