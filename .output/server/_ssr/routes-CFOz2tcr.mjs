import { n as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, r as Slot, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { C as Database, D as Building2, E as Check, O as Bot, S as Download, T as ChevronDown, _ as MapPin, a as Target, b as FileText, c as Settings2, d as Radio, f as Plus, g as Menu, h as Network, i as Trash2, k as Activity, l as Send, m as Pause, n as X, o as Sparkles, p as Play, r as Users, s as ShieldCheck, t as Zap, u as Search, v as LayoutDashboard, w as Clock3, x as FileSpreadsheet, y as Gauge } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/@radix-ui/react-slider+[...].mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/radix-ui__react-switch.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CFOz2tcr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-9 px-4 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-10 rounded-md px-8",
			icon: "h-9 w-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var Slider = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
	ref,
	className: cn("relative flex w-full touch-none select-none items-center", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
		className: "relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full bg-primary" })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" })]
}));
Slider.displayName = Slider$1.displayName;
var Switch = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
	className: cn("peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input", className),
	...props,
	ref,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: cn("pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0") })
}));
Switch.displayName = Switch$1.displayName;
var NAV_ITEMS = [
	{
		id: "dashboard",
		label: "Painel de Controle",
		icon: LayoutDashboard
	},
	{
		id: "targets",
		label: "Matriz de Alvos",
		sub: "Cidades & Nichos",
		icon: Target
	},
	{
		id: "leads",
		label: "Base de Leads",
		icon: Database
	},
	{
		id: "outreach",
		label: "Automação",
		sub: "de Abordagem",
		icon: Bot
	},
	{
		id: "reports",
		label: "Relatórios",
		sub: "e Exportação",
		icon: FileSpreadsheet
	}
];
var LEADS = [
	{
		name: "Nexus Tecnologia",
		niche: "Software B2B",
		city: "São Paulo",
		phone: "+55 11 98412-3001",
		site: "nexustech.com.br",
		status: "Qualificado"
	},
	{
		name: "Aurum Contabilidade",
		niche: "Contabilidade",
		city: "Curitiba",
		phone: "+55 41 99873-1190",
		site: "aurumcontabil.com",
		status: "Novo"
	},
	{
		name: "Clínica Horizonte",
		niche: "Saúde",
		city: "Belo Horizonte",
		phone: "+55 31 98823-5721",
		site: "clinicahorizonte.com",
		status: "Em análise"
	},
	{
		name: "Prisma Engenharia",
		niche: "Construção",
		city: "Campinas",
		phone: "+55 19 99144-8830",
		site: "prismaeng.com.br",
		status: "Qualificado"
	},
	{
		name: "Atlas Logística",
		niche: "Logística",
		city: "São Paulo",
		phone: "+55 11 97752-6204",
		site: "atlaslog.com.br",
		status: "Descartado"
	},
	{
		name: "Vértice Legal",
		niche: "Advocacia",
		city: "Curitiba",
		phone: "+55 41 98410-7744",
		site: "verticelegal.com",
		status: "Novo"
	}
];
var INITIAL_LOGS = [
	"[18:32:04] Motor de extração pronto.",
	"[18:32:05] 12 cidades carregadas na matriz.",
	"[18:32:05] Proxy rotativo verificado · latência 84ms.",
	"[18:32:06] Aguardando comando de varredura..."
];
function ChupacabraDashboard() {
	const [view, setView] = (0, import_react.useState)("dashboard");
	const [scanState, setScanState] = (0, import_react.useState)("idle");
	const [mobileOpen, setMobileOpen] = (0, import_react.useState)(false);
	const [logs, setLogs] = (0, import_react.useState)(INITIAL_LOGS);
	const [progress, setProgress] = (0, import_react.useState)(0);
	const [leadCount, setLeadCount] = (0, import_react.useState)(2847);
	(0, import_react.useEffect)(() => {
		if (scanState !== "running") return;
		const timer = window.setInterval(() => {
			setProgress((current) => current >= 100 ? 3 : Math.min(current + 1.2, 100));
			setLeadCount((current) => current + Math.floor(Math.random() * 4));
			if (Math.random() > .55) {
				const events = [
					"Lead validado · domínio e telefone encontrados.",
					"Consultando diretório local · Curitiba/PR.",
					"Fingerprint rotacionado com sucesso.",
					"Empresa adicionada à fila de qualificação."
				];
				const next = events[Math.floor(Math.random() * events.length)];
				setLogs((current) => [...current.slice(-6), `[${(/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR")}] ${next}`]);
			}
		}, 1500);
		return () => window.clearInterval(timer);
	}, [scanState]);
	const startScan = () => {
		setScanState("running");
		setProgress((current) => current === 0 ? 7 : current);
		setLogs((current) => [...current, `[${(/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR")}] Varredura em massa iniciada.`]);
	};
	const currentLabel = NAV_ITEMS.find((item) => item.id === view)?.label ?? "Painel";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "noise-overlay" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sidebar, {
				view,
				setView,
				open: mobileOpen,
				setOpen: setMobileOpen,
				scanState
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "min-h-screen lg:pl-64",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "sticky top-0 z-30 grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							className: "lg:hidden",
							onClick: () => setMobileOpen(true),
							"aria-label": "Abrir navegação",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate font-mono text-[10px] uppercase tracking-[0.2em] text-primary",
								children: "CHUPACABRA // CONSOLE"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "truncate text-sm font-semibold sm:text-base",
								children: currentLabel
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0 items-center gap-2 sm:gap-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "hidden items-center gap-2 text-xs text-muted-foreground sm:flex",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "status-dot" }), " Sistema operacional"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "icon",
									"aria-label": "Configurações",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, {})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid size-8 place-items-center rounded-md border border-primary/30 bg-primary/10 font-mono text-xs font-bold text-primary",
									children: "RG"
								})
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8",
					children: [
						view === "dashboard" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardView, {
							scanState,
							setScanState,
							startScan,
							progress,
							leadCount,
							logs
						}),
						view === "targets" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TargetsView, {}),
						view === "leads" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeadsView, {}),
						view === "outreach" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OutreachView, {}),
						view === "reports" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportsView, {})
					]
				})]
			})
		]
	});
}
function Sidebar({ view, setView, open, setOpen, scanState }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		"aria-label": "Fechar navegação",
		className: "fixed inset-0 z-40 bg-overlay lg:hidden",
		onClick: () => setOpen(false)
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: cn("fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-300 lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-20 items-center justify-between border-b border-border px-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xl",
							children: "🦇"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-sm font-bold uppercase tracking-wide",
							children: "Chupacabra"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-primary",
						children: "B2B Prospect Engine"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					className: "lg:hidden",
					onClick: () => setOpen(false),
					"aria-label": "Fechar navegação",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "flex-1 space-y-1 px-3 py-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-3 pb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground",
					children: "Núcleo de operação"
				}), NAV_ITEMS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => {
						setView(item.id);
						setOpen(false);
					},
					className: cn("nav-item", view === item.id && "nav-item-active"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "size-[18px] shrink-0" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 text-left",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate",
								children: item.label
							}), item.sub && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-[10px] opacity-55",
								children: item.sub
							})]
						}),
						view === item.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ml-auto h-5 w-0.5 bg-primary shadow-glow" })
					]
				}, item.id))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "m-3 border border-border bg-surface p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-[9px] uppercase text-muted-foreground",
							children: "Engine status"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-4 text-primary" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("status-dot", scanState === "paused" && "bg-warning", scanState === "idle" && "bg-muted-foreground shadow-none") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-medium",
							children: scanState === "running" ? "Operando" : scanState === "paused" ? "Pausado" : "Em espera"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 h-1 overflow-hidden bg-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-3/4 bg-primary shadow-glow" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex justify-between font-mono text-[9px] text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "CPU 24%" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "MEM 1.8 GB" })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-t border-border px-5 py-4 font-mono text-[9px] text-muted-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "BUILD" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-primary",
						children: "v2.4.0 STABLE"
					})]
				})
			})
		]
	})] });
}
function PageIntro({ eyebrow, title, description, action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary",
					children: eyebrow
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-bold tracking-wide sm:text-3xl",
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-2xl text-sm text-muted-foreground",
					children: description
				})
			]
		}), action && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "shrink-0",
			children: action
		})]
	});
}
function DashboardView({ scanState, setScanState, startScan, progress, leadCount, logs }) {
	const metrics = [
		{
			label: "Leads coletados",
			value: leadCount.toLocaleString("pt-BR"),
			delta: "+12.4%",
			icon: Users
		},
		{
			label: "Cidades configuradas",
			value: "12",
			delta: "4 estados",
			icon: MapPin
		},
		{
			label: "Nichos ativos",
			value: "08",
			delta: "de 12 totais",
			icon: Target
		},
		{
			label: "Motor de extração",
			value: scanState === "running" ? "Executando" : scanState === "paused" ? "Pausado" : "Inativo",
			delta: scanState === "paused" ? "retoma em 02:14" : "timer estocástico",
			icon: Radio
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageIntro, {
			eyebrow: "Central de inteligência",
			title: "Painel de Controle",
			description: "Monitore a operação, execute varreduras e acompanhe a coleta em tempo real."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
			children: metrics.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "metric-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid size-9 place-items-center border border-primary/20 bg-primary/5 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.icon, { className: "size-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("font-mono text-[10px]", i === 0 ? "text-primary" : "text-muted-foreground"),
							children: m.delta
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 text-xs text-muted-foreground",
						children: m.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: cn("mt-1 font-display text-2xl font-bold", i === 3 && scanState === "running" && "text-primary"),
						children: m.value
					})
				]
			}, m.label))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-lg font-semibold",
						children: "Operação de varredura"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: "Busca paralela em 12 cidades × 8 nichos"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [
							scanState === "running" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								onClick: () => setScanState("paused"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {}), " Pausar"]
							}),
							scanState === "paused" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								onClick: () => setScanState("running"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {}), " Retomar"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "lg",
								onClick: startScan,
								className: "scan-button",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, {}), scanState === "running" ? "Reiniciar varredura" : "Iniciar varredura em massa"]
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_220px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-2 flex justify-between text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "Progresso do ciclo"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-primary",
								children: [Math.round(progress), "%"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-2 overflow-hidden bg-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full bg-primary transition-all duration-700 shadow-glow",
								style: { width: `${progress}%` }
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-5 grid grid-cols-3 gap-3",
							children: [
								["Consultas", "1.248"],
								["Válidos", "386"],
								["Taxa", "30,9%"]
							].map(([a, b]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-l border-border pl-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-mono text-[9px] uppercase text-muted-foreground",
									children: a
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm font-semibold",
									children: b
								})]
							}, a))
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border border-border bg-surface p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-xs font-medium",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { className: "size-4 text-info" }), " Timer estocástico"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 font-mono text-2xl font-bold",
								children: ["04.8", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: "s"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-[10px] text-muted-foreground",
								children: "Próxima requisição aleatória"
							})
						]
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display font-semibold",
						children: "Saúde do sistema"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: "Últimos 15 minutos"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-5 text-primary" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 space-y-5",
					children: [
						["Disponibilidade", 99],
						["Qualidade dos proxies", 87],
						["Integridade dos dados", 94]
					].map(([label, val]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex justify-between text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono",
							children: [val, "%"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-1 bg-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full bg-info",
							style: { width: `${val}%` }
						})
					})] }, String(label)))
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "terminal mt-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between border-b border-terminal-border px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-destructive" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-warning" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-primary" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 font-mono text-[10px] uppercase text-muted-foreground",
							children: "chupacabra_core.log"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-2 font-mono text-[9px] text-primary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "status-dot" }), " LIVE STREAM"]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "h-52 overflow-y-auto p-4 font-mono text-[11px] leading-7",
				children: [logs.map((log, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: i === logs.length - 1 ? "text-primary" : "text-terminal-muted",
					children: log
				}, `${log}-${i}`)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "terminal-cursor",
					children: "▋"
				})]
			})]
		})
	] });
}
function TargetsView() {
	const [cities, setCities] = (0, import_react.useState)([
		"São Paulo, SP",
		"Curitiba, PR",
		"Belo Horizonte, MG",
		"Campinas, SP"
	]);
	const [niches, setNiches] = (0, import_react.useState)([
		"Software B2B",
		"Contabilidade",
		"Clínicas",
		"Engenharia"
	]);
	const [city, setCity] = (0, import_react.useState)("");
	const [niche, setNiche] = (0, import_react.useState)("");
	const [delay, setDelay] = (0, import_react.useState)([5]);
	const [limit, setLimit] = (0, import_react.useState)([120]);
	const add = (value, list, setter, clear) => {
		if (value.trim() && !list.includes(value.trim())) setter([...list, value.trim()]);
		clear("");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageIntro, {
			eyebrow: "Definição de território",
			title: "Matriz de Alvos",
			description: "Combine cidades e segmentos para direcionar o motor de descoberta.",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "hidden border border-primary/20 bg-primary/5 px-3 py-2 font-mono text-xs text-primary sm:block",
				children: [cities.length * niches.length, " combinações"]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 xl:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TagManager, {
				title: "Cidades alvo",
				icon: MapPin,
				items: cities,
				input: city,
				setInput: setCity,
				onAdd: () => add(city, cities, setCities, setCity),
				onRemove: (v) => setCities(cities.filter((x) => x !== v)),
				placeholder: "Ex: Florianópolis, SC"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TagManager, {
				title: "Nichos e segmentos",
				icon: Building2,
				items: niches,
				input: niche,
				setInput: setNiche,
				onAdd: () => add(niche, niches, setNiches, setNiche),
				onRemove: (v) => setNiches(niches.filter((x) => x !== v)),
				placeholder: "Ex: Energia solar"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "panel mt-4 p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-9 place-items-center bg-info/10 text-info",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display font-semibold",
						children: "Parâmetros de segurança"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Controle de cadência e proteção contra bloqueios"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-7 grid gap-8 md:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RangeSetting, {
						label: "Intervalo médio entre requisições",
						value: `${delay[0]} segundos`,
						min: 2,
						max: 15,
						values: delay,
						onChange: setDelay
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RangeSetting, {
						label: "Limite por sessão",
						value: `${limit[0]} requisições`,
						min: 40,
						max: 300,
						values: limit,
						onChange: setLimit
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-7 grid gap-3 sm:grid-cols-3",
					children: [
						"Rotação automática de proxy",
						"Variação de fingerprint",
						"Pausa por detecção de risco"
					].map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center justify-between border border-border bg-surface px-4 py-3 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: x }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, { defaultChecked: true })]
					}, x))
				})
			]
		})
	] });
}
function TagManager({ title, icon: Icon, items, input, setInput, onAdd, onRemove, placeholder }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "panel p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display font-semibold",
						children: title
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-mono text-[10px] text-muted-foreground",
					children: [items.length, " ativos"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: input,
					onChange: (e) => setInput(e.target.value),
					onKeyDown: (e) => e.key === "Enter" && onAdd(),
					placeholder,
					className: "field"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "icon",
					onClick: onAdd,
					"aria-label": `Adicionar ${title}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 space-y-2",
				children: items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 border border-border bg-surface px-3 py-2.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-[10px] text-primary",
							children: String(i + 1).padStart(2, "0")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex-1 text-sm",
							children: item
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							onClick: () => onRemove(item),
							"aria-label": `Remover ${item}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {})
						})
					]
				}, item))
			})
		]
	});
}
function RangeSetting({ label, value, min, max, values, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex items-center justify-between text-xs",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-muted-foreground",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-primary",
				children: value
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
			min,
			max,
			value: values,
			onValueChange: onChange
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-2 flex justify-between font-mono text-[9px] text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: min }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: max })]
		})
	] });
}
function LeadsView() {
	const [search, setSearch] = (0, import_react.useState)("");
	const [city, setCity] = (0, import_react.useState)("Todas");
	const [status, setStatus] = (0, import_react.useState)("Todos");
	const rows = (0, import_react.useMemo)(() => LEADS.filter((l) => (l.name + l.niche + l.city).toLowerCase().includes(search.toLowerCase()) && (city === "Todas" || l.city === city) && (status === "Todos" || l.status === status)), [
		search,
		city,
		status
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageIntro, {
		eyebrow: "Inteligência consolidada",
		title: "Base de Leads",
		description: "Revise, filtre e prepare os contatos encontrados para qualificação.",
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {}), " CSV"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, {}), " XLSX"] })]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "panel overflow-hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(240px,1fr)_200px_180px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field pl-9",
							placeholder: "Buscar empresa, nicho ou cidade...",
							value: search,
							onChange: (e) => setSearch(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectField, {
						value: city,
						setValue: setCity,
						options: [
							"Todas",
							"São Paulo",
							"Curitiba",
							"Belo Horizonte",
							"Campinas"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectField, {
						value: status,
						setValue: setStatus,
						options: [
							"Todos",
							"Novo",
							"Em análise",
							"Qualificado",
							"Descartado"
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[900px] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
						className: "border-b border-border font-mono text-[9px] uppercase tracking-wider text-muted-foreground",
						children: [
							"Empresa",
							"Nicho",
							"Cidade",
							"Telefone",
							"Website",
							"Qualificação"
						].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-5 py-4 font-medium",
							children: h
						}, h))
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((lead) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border/60 transition-colors hover:bg-surface",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-5 py-4 font-medium",
								children: lead.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-5 py-4 text-muted-foreground",
								children: lead.niche
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-5 py-4 text-muted-foreground",
								children: lead.city
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-5 py-4 font-mono text-xs",
								children: lead.phone
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-5 py-4 text-info",
								children: lead.site
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-5 py-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: lead.status })
							})
						]
					}, lead.name)) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between px-5 py-4 text-xs text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					"Exibindo ",
					rows.length,
					" de ",
					LEADS.length,
					" leads"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-primary",
					children: "BASE LOCAL // SINCRONIZADA"
				})]
			})
		]
	})] });
}
function SelectField({ value, setValue, options }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
			className: "field appearance-none pr-8",
			value,
			onChange: (e) => setValue(e.target.value),
			children: options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: o }, o))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" })]
	});
}
function StatusBadge({ status }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("status-badge", status === "Qualificado" && "status-success", status === "Em análise" && "status-info", status === "Descartado" && "status-muted"),
		children: status
	});
}
function OutreachView() {
	const [provider, setProvider] = (0, import_react.useState)("Ollama");
	const [tone, setTone] = (0, import_react.useState)("Consultivo");
	const [generated, setGenerated] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageIntro, {
		eyebrow: "Engine agnóstica",
		title: "Automação de Abordagem",
		description: "Conecte seu modelo preferido e gere mensagens comerciais contextualizadas."
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4 xl:grid-cols-[0.8fr_1.2fr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "panel p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-9 place-items-center bg-primary/10 text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Network, { className: "size-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display font-semibold",
						children: "Modelo de linguagem"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Selecione o motor de geração"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 grid grid-cols-3 gap-2",
					children: [
						"Ollama",
						"Qwen",
						"OpenAI"
					].map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setProvider(p),
						className: cn("provider-button", provider === p && "provider-active"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-sm font-semibold",
							children: p
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[9px] text-muted-foreground",
							children: p === "OpenAI" ? "API" : "Local"
						})]
					}, p))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "field-label",
								children: "Endpoint do modelo"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field mt-2 font-mono text-xs",
								value: provider === "OpenAI" ? "https://api.openai.com/v1" : "http://localhost:11434",
								readOnly: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "field-label",
								children: "Tom da mensagem"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectField, {
								value: tone,
								setValue: setTone,
								options: [
									"Consultivo",
									"Direto",
									"Executivo",
									"Amigável"
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "field-label",
								children: "Contexto da oferta"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								className: "field mt-2 min-h-28 resize-none",
								defaultValue: "Auditoria gratuita de presença digital e oportunidades comerciais para empresas B2B."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between border-t border-border pt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs",
								children: "Personalização por lead"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, { defaultChecked: true })]
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "panel overflow-hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between border-b border-border p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display font-semibold",
					children: "Pré-visualização"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: "Lead 01 de 386 · Nexus Tecnologia"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-5 text-info" })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 border border-border bg-surface p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-9 place-items-center bg-info/10 text-info",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: "Marina · Nexus Tecnologia"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] text-muted-foreground",
								children: "Diretora Comercial · São Paulo"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-auto status-badge status-success",
								children: "82% fit"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative mt-4 min-h-64 border border-border bg-terminal p-5 font-mono text-sm leading-7 text-terminal-text",
						children: generated ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							"Olá Marina, tudo bem?",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							"Analisei a presença digital da Nexus Tecnologia e identifiquei algumas oportunidades para ampliar a geração de demanda B2B em São Paulo. Preparamos uma auditoria objetiva, sem custo, com os principais pontos de crescimento.",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							"Faz sentido reservar 15 minutos esta semana para eu compartilhar os achados?"
						] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute inset-0 grid place-items-center text-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { className: "mx-auto size-8 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-xs text-muted-foreground",
								children: "Configure o modelo e gere uma amostra"
							})] })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => setGenerated(false),
								children: "Limpar"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: () => setGenerated(true),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {}),
									" Gerar pitch com ",
									provider
								]
							}),
							generated && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {}), " Aprovar"] })
						]
					})
				]
			})]
		})]
	})] });
}
function ReportsView() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageIntro, {
			eyebrow: "Dados portáveis",
			title: "Relatórios e Exportação",
			description: "Consolide resultados da operação e exporte bases prontas para sua equipe.",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), " Exportar tudo"] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-4 md:grid-cols-3",
			children: [
				{
					title: "Base completa",
					desc: "Todos os leads, contatos e metadados",
					count: "2.847 registros",
					icon: Database
				},
				{
					title: "Leads qualificados",
					desc: "Contatos com score comercial acima de 70%",
					count: "936 registros",
					icon: Check
				},
				{
					title: "Relatório operacional",
					desc: "Desempenho, fontes e eficiência da coleta",
					count: "Últimos 30 dias",
					icon: Gauge
				}
			].map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-10 place-items-center bg-primary/10 text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(r.icon, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-5 font-display font-semibold",
						children: r.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 min-h-10 text-xs text-muted-foreground",
						children: r.desc
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 font-mono text-[10px] text-info",
						children: r.count
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							className: "flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {}), " CSV"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							className: "flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, {}), " XLSX"]
						})]
					})
				]
			}, r.title))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "panel mt-4 p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display font-semibold",
					children: "Resumo da operação"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted-foreground",
					children: "Distribuição dos leads por estágio"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "size-5 text-primary" })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					[
						"Novos",
						"1.492",
						"52%"
					],
					[
						"Em análise",
						"419",
						"15%"
					],
					[
						"Qualificados",
						"936",
						"33%"
					],
					[
						"Com website",
						"2.274",
						"80%"
					]
				].map(([l, v, p]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-l border-border pl-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: l
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 font-display text-2xl font-bold",
							children: v
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 font-mono text-[10px] text-primary",
							children: [p, " da base"]
						})
					]
				}, l))
			})]
		})
	] });
}
//#endregion
export { ChupacabraDashboard as component };
