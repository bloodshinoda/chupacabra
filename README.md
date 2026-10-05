# Chupacabra System

**B2B Prospect Engine** para pesquisa de empresas por cidade e nicho, com crawler assíncrono, enriquecimento de leads, execução controlada por perfis e interface desktop baseada em Tauri.

> **Versão 0.4.0** — branch único `main`, runtime nativo refinado, CI Windows + Linux, higiene de dados no tip e splash do Chupacabrinha. O frontend TanStack/Tauri está integrado ao engine Python, com execução real, matriz de alvos, enriquecimento e geração do relatório final.

## Objetivo

O Chupacabra transforma o fluxo anterior de automação em uma aplicação desktop integrada:

```text
Interface React/TanStack
        ↓
     Tauri IPC
        ↓
     Rust bridge (engine_runtime)
        ↓
 Python Engine / daemon
        ↓
 placesCrawlerV2
        ↓
 coleta → deduplicação → enriquecimento → relatórios
```

A meta de distribuição principal é **Windows + instalador NSIS por máquina** (`Program Files`). O CI também gera pacote **DEB** para Linux.

O desenvolvimento oficial ocorre **somente no branch `main`**.

## Estado atual

### Engine

- `placesCrawlerV2` é o crawler principal.
- Coleta assíncrona via `aiohttp`.
- Paginação direta do Google Maps.
- Deduplicação por `place_id`, com contagem de coletados, únicos e duplicados no painel.
- Retry com backoff.
- Perfis de execução: `rapido`, `balanceado`, `chupacabra`.
- Execução em `runs/<run_id>/jobs/<job_id>/` no desenvolvimento (dados locais, não versionados).
- Enriquecimento com telefone, site, domínio, avaliação, score e segmento.
- Daemon Python com protocolo JSON por stdin/stdout.
- Eventos de ciclo de vida: início, jobs, progresso, conclusão, falha, cancelamento, logs e relatório final.
- Protocolo protegido contra UTF-8/mojibake entre Python, Rust e Windows.
- Relatório final XLSX após enriquecimento, com títulos de abas sanitizados para Excel.

### Tauri

O bridge Rust (`engine_runtime`) inicia o engine e encaminha stdout/stderr para eventos do frontend.

Em desenvolvimento: `python -m engine.daemon` a partir da raiz do projeto.

No build Windows, o engine vira executável **self-contained (PyInstaller)** e é embutido como recurso do Tauri — a instalação final **não exige Python** no PC do usuário.

Dados do usuário (instalado):

```text
%USERPROFILE%\Documents\Chupacabra System\
```

Frontend de produção: `.output/public` (TanStack/Nitro).

Dev server: `127.0.0.1:5173` com porta estrita.

### Distribuição 0.4.0

```text
engine/daemon.py
      ↓
PyInstaller --onefile  (scripts/build-engine.mjs)
      ↓
engine/dist/chupacabra-engine.exe
      ↓
Tauri resource
      ↓
NSIS (Windows) / DEB (Linux CI)
```

Build do engine: `npm run build:engine` → `scripts/build-engine.mjs` + `requirements-build.txt` (só no ambiente de build).

O `src-tauri` prioriza o engine empacotado; em dev usa `CHUPACABRA_PYTHON` / `CHUPACABRA_ROOT` ou `python` no PATH. Dados de teste: `CHUPACABRA_DATA_ROOT`.

### Frontend

- **Painel de Controle**
- **Matriz de Alvos / Cidades & Nichos** (autocomplete de nichos)
- **Base de Leads**
- **Automação / Abordagem**
- **Relatórios / Exportação**
- Splash do Chupacabrinha na abertura (`public/chupacabra-splash.png`)

## Perfis de execução

| Perfil | Limite padrão | Sites | Concorrência web | Intervalo |
|---|---:|---|---:|---:|
| `rapido` | 250 | não | 4 | 3–7 s |
| `balanceado` | 500 | sim | 8 | 8–16 s |
| `chupacabra` | 1000 | sim | 10 | 15–35 s |

Valores operacionais — não são garantias de quantidade de resultados.

## Matriz de prospecção

36 combinações iniciais (12 categorias × 3 cidades):

- Chapecó
- Xanxerê
- Concórdia

Categorias: agências de publicidade, gráficas, comunicação visual, marketing digital, brindes corporativos, eventos, serigrafia/estamparia, imobiliárias, concessionárias, construtoras, clínicas odontológicas, entre outras.

A matriz é controlada pela aplicação e pelo runner do engine.

## Relatórios

Após coleta e enriquecimento, o engine consolida CSVs e gera o XLSX da execução. Estrutura planejada por cidade:

```text
Reports/
├── consolidado.xlsx
├── Chapeco.xlsx
├── Xanxere.xlsx
└── Concordia.xlsx
```

Dados intermediários ficam ligados a `run_id`, cidade, categoria e job, permitindo regenerar relatórios sem repetir a coleta.

## Diretórios de dados no Windows

**Programa em `Program Files`; dados do usuário em `Documents`; cache/logs em `LocalAppData`; compartilhados em `ProgramData`.**

```text
C:\Program Files\Chupacabra System\
    aplicação e recursos instalados

C:\ProgramData\Chupacabra System\
    configuração compartilhada (quando necessário)

%LOCALAPPDATA%\Chupacabra System\
    cache, estado temporário e logs

%USERPROFILE%\Documents\Chupacabra System\
    runs, relatórios e exports
```

Em desenvolvimento, `runs/` na raiz do projeto é local e está no `.gitignore`.

## Instalador NSIS

Instalador `.exe` **perMachine**:

- elevação administrativa;
- `Program Files` por padrão;
- disponível para todos os usuários;
- metadados em `HKLM`;
- atalho no Menu Iniciar: `Chupacabra System`;
- tradução `PortugueseBR`.

### Splash

Arte do Chupacabrinha na abertura; fonte em `public/chupacabra-splash.png`.

### Artes do instalador (opcional)

| Arquivo | Uso | Dimensão |
|---|---|---:|
| `header.bmp` | cabeçalho | **150 × 57 px** |
| `sidebar.bmp` | lateral | **164 × 314 px** |
| `uninstaller-header.bmp` | desinstalador | **150 × 57 px** |

Ícones em `src-tauri/icons/`.

## Desenvolvimento

Branch de trabalho: **`main`** apenas.

### Frontend

```bash
npm install
npm run dev
```

### Engine

```bash
python -m pip install -r mapScraper/requirements.txt
python -m engine.daemon
```

### Smoke test

```bash
python -m engine.main --profile rapido --query "Agencias de publicidade em Chapeco SC"
```

### Rust / Tauri

```bash
cargo check --manifest-path src-tauri/Cargo.toml
npx tauri dev
```

## Build

### Frontend

```bash
npm run build
```

### Engine self-contained

```bash
npm run build:engine
```

Gera `engine/dist/chupacabra-engine.exe` (Windows).

### Instalador Windows (NSIS)

```bash
npx tauri build --bundles nsis
```

`beforeBuildCommand` = `npm run build:desktop` (frontend + engine).

### CI

- **Build Windows** — NSIS artifact + release em tags `v*`
- **Build Linux** — DEB artifact + release em tags `v*`

Triggers: push em `main`, tags `v*`, `workflow_dispatch`.

Assinatura de código e validação em Windows limpo ainda são passos antes de distribuição ampla.

## Arquitetura do repositório

```text
chupacabra/
├── src/                     # frontend React/TanStack
├── src-tauri/               # Tauri/Rust (engine_runtime)
├── engine/                  # daemon, crawler, geography, orchestration, storage
├── mapScraper/              # crawler legado e pipeline
├── scripts/                 # build-engine.mjs, prepare-assets
├── tests/                   # testes Python
├── .github/workflows/       # build-windows, build-linux
└── README.md
```

## Próximos marcos

1. Dashboard 100% ligado a eventos reais do engine.
2. Histórico de execuções na interface.
3. Relatórios individuais por cidade + consolidado.
4. Pausa/retomada/cancelamento refinados na UI.
5. Diretórios padrão Windows consolidados em produção.
6. Assinatura de código do instalador.
7. Validação em Windows limpo e matriz de testes ampliada.

## Plataformas

Tauri cobre Windows, Linux e macOS. O alvo oficial de distribuição é **Windows (NSIS)**; o CI Linux (DEB) valida o build e gera artefato experimental.
