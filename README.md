# Chupacabra System

**B2B Prospect Engine** para pesquisa de empresas por cidade e nicho, com crawler assíncrono, enriquecimento de leads (incluindo CNPJ), execução controlada por perfis e interface desktop baseada em Tauri.

> **Versão 1.0.0 (stable)** — primeira base funcional consolidada: engine integrado, **Base de Leads real**, **Relatórios** por execução (XLSX/CSV), enriquecimento com CNPJ/BrasilAPI, CI Windows + Linux e instaladores NSIS/DEB. Branch oficial: `main`.

Release: [v1.0.0](https://github.com/bloodshinoda/chupacabra/releases/tag/v1.0.0)

## Objetivo

O Chupacabra transforma prospecção B2B em uma aplicação desktop integrada:

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
 coleta → deduplicação → enriquecimento → leads + relatórios
```

A meta de distribuição principal é **Windows + instalador NSIS por máquina** (`Program Files`). O CI também gera pacote **DEB** para Linux.

O desenvolvimento oficial ocorre **somente no branch `main`**.

## Estado atual (1.0.0)

### Engine

- `placesCrawlerV2` é o crawler principal.
- Coleta assíncrona via `aiohttp` e paginação do Google Maps.
- Deduplicação por `place_id`, com contagem de coletados, únicos e duplicados no painel.
- Retry com backoff.
- Perfis de execução: `rapido`, `balanceado`, `chupacabra`.
- Runs em pastas locais no formato `YYYY-MM-DD HH.MM` (dados **não** versionados; ver `.gitignore`).
- Enriquecimento: telefone, site, domínio, avaliação, **score**, **segmento/porte**, **CNPJ** (extração no site + consulta BrasilAPI quando disponível).
- Daemon Python com protocolo JSON por stdin/stdout.
- Eventos de ciclo de vida: início, jobs, progresso, conclusão, falha, cancelamento, logs e relatório final.
- Protocolo protegido contra UTF-8/mojibake entre Python, Rust e Windows.
- Relatório final XLSX após enriquecimento (abas sanitizadas para Excel), com CNPJ, porte e faixa de score.

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

### Distribuição 1.0.0

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

- **Painel de Controle** — execução real, telemetria de jobs, pausa estocástica entre jobs
- **Matriz de Alvos** — cidades (IBGE / catálogo) e **centenas de nichos B2B** com autocomplete (`src/lib/niches.ts`)
- **Base de Leads** — dados reais das runs (busca/filtros por empresa, categoria, cidade, score, CNPJ, site)
- **Relatórios** — XLSX/CSV por execução, a partir do que o engine gerou
- **Automação / Abordagem** — espaço reservado; automação comercial fica para versões futuras
- **IA** — modal “em breve”; **fora do escopo funcional da 1.0.0**
- Splash do Chupacabrinha na abertura (`public/chupacabra-splash.png`)

## Perfis de execução

| Perfil | Limite padrão | Sites | Concorrência web | Intervalo |
|---|---:|---|---:|---:|
| `rapido` | 250 | não | 4 | 3–7 s |
| `balanceado` | 500 | sim | 8 | 8–16 s |
| `chupacabra` | 1000 | sim | 10 | 15–35 s |

Valores operacionais — não são garantias de quantidade de resultados.

## Matriz de prospecção

A matriz é **cidade × nicho**, montada na interface e executada pelo runner:

- Geografia: municípios brasileiros (IBGE) e busca de cidades no exterior via engine
- Nichos: lista expandida de categorias B2B (marketing, TI, saúde, indústria, varejo, serviços, etc.), com suporte a nichos personalizados

O limite de jobs da run é configurável na Matriz de Alvos.

## Relatórios e exportação

Após coleta e enriquecimento, o engine consolida os CSVs da run e gera o XLSX da execução. Na interface (1.0):

- listagem de relatórios por execução
- exportação CSV de leads
- exportação combinada da execução
- colunas relevantes: empresa, contato, score, **porte**, **CNPJ**, categoria, etc.

Dados intermediários ficam ligados a `run_id`, cidade, categoria e job (pastas locais / Documents no Windows).

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

Em desenvolvimento, `runs/` na raiz do projeto é local e está no `.gitignore`. CSVs de leads e XLSX de relatório **não** devem ser versionados.

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

Assinatura de código e validação em Windows limpo ainda são recomendados antes de distribuição ampla.

## Arquitetura do repositório

```text
chupacabra/
├── src/                     # frontend React/TanStack
├── src-tauri/               # Tauri/Rust (engine_runtime)
├── engine/                  # daemon, crawler, geography, orchestration, storage
├── mapScraper/              # crawler, pipeline, enrichment, gerar_relatorio
├── scripts/                 # build-engine.mjs, prepare-assets
├── tests/                   # testes Python
├── .github/workflows/       # build-windows, build-linux
└── README.md
```

## Próximos marcos

1. Automação de abordagem comercial (hoje só reservada na UI).
2. Módulo de IA (modal preparado; fora do escopo 1.0.0).
3. Histórico de execuções ainda mais rico na interface.
4. Relatórios adicionais por cidade + consolidado, se necessário.
5. Assinatura de código do instalador Windows.
6. Validação contínua em Windows limpo e matriz de testes ampliada.

## Plataformas

Tauri cobre Windows, Linux e macOS. O alvo oficial de distribuição é **Windows (NSIS)**; o CI Linux (DEB) valida o build e gera artefato experimental.
