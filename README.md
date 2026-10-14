<p align="center">
  <img src="src-tauri/icons/icon.png" alt="Chupacabra System" width="280" />
</p>

<p align="center">
  <a href="https://github.com/bloodshinoda/chupacabra/releases/tag/v1.1.0"><img src="https://img.shields.io/github/v/release/bloodshinoda/chupacabra?style=flat-square&label=release&color=22c55e" alt="Release" /></a>
  <a href="https://github.com/bloodshinoda/chupacabra/actions/workflows/build-windows.yml"><img src="https://github.com/bloodshinoda/chupacabra/actions/workflows/build-windows.yml/badge.svg" alt="Build Windows" /></a>
  <a href="https://github.com/bloodshinoda/chupacabra/actions/workflows/build-linux.yml"><img src="https://github.com/bloodshinoda/chupacabra/actions/workflows/build-linux.yml/badge.svg" alt="Build Linux" /></a>
  <a href="https://github.com/bloodshinoda/chupacabra/actions/workflows/build-macos.yml"><img src="https://github.com/bloodshinoda/chupacabra/actions/workflows/build-macos.yml/badge.svg" alt="Build macOS" /></a>
  <img src="https://img.shields.io/badge/Windows-NSIS-0A66C2?style=flat-square&logo=windows&logoColor=white" alt="Windows" />
  <img src="https://img.shields.io/badge/Linux-DEB-FCC624?style=flat-square&logo=linux&logoColor=black" alt="Linux" />
  <img src="https://img.shields.io/badge/macOS-Apple%20Silicon%20DMG-000000?style=flat-square&logo=apple&logoColor=white" alt="macOS" />
  <img src="https://img.shields.io/badge/stack-Tauri%20%2B%20Rust%20%2B%20Python-b91c1c?style=flat-square" alt="Stack" />
  <img src="https://img.shields.io/badge/stress--test-Windows%20%26%20Linux%20limpos-16a34a?style=flat-square" alt="Stress test" />
</p>

# Chupacabra System 🦇

**B2B Prospect Engine.** O nome não é branding fofo: o bicho foi feito pra **chupar** lead — cidade, nicho, telefone, site, score, CNPJ, o combo inteiro.

Crawler assíncrono, enriquecimento, perfis com fome configurável e desktop Tauri. Você monta a matriz, escolhe o nível de sede e aperta o botão. O resto é sangue no XLSX.

<p align="center"><strong>👉 <a href="https://github.com/bloodshinoda/chupacabra/releases/tag/v1.1.0">Vem dar uma chupadinha</a> 👈</strong></p>

> **Versão 1.1.0** — leads reais, relatórios, CNPJ/BrasilAPI, **Configurações** de perfil, CI em **três frentes** e instaladores **Windows (NSIS) · Linux (DEB) · macOS (DMG, Apple Silicon)**. Branch oficial: `main`.

Release: [v1.1.0](https://github.com/bloodshinoda/chupacabra/releases/tag/v1.1.0) · [Changelog](CHANGELOG.md)  
🐾 *Mais controle, menos chute, mais fome configurável.*  
🍎 *E agora também dá uma mordida na maçã.*

### Validação em campo

A **1.1.0** foi **stress-testada em Windows e Linux limpos** (máquina sem toolchain de dev): instalador → engine embutido → run real → leads e relatório. Não é só CI verde e torcida — o bicho chupou fora da casa do dono.

**macOS:** build de release **Apple Silicon** (`aarch64`) gera o `.dmg` e já entrou na release **v1.1.0**. Gatekeeper/assinatura notarizada ainda é história de Cupertino pra depois — na primeira abertura o macOS pode fazer cara feia; é o preço de monstro sem selo da Apple.

---

## O que esse monstro faz

Prospecção B2B sem viver de planilha na unha e script solto na pasta Downloads:

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
 coleta → dedupe → enriquecimento → leads + relatórios
```

**Windows + NSIS** continua o prato principal. **Linux** tem DEB + stress em limpo. **macOS** agora entra no cardápio: DMG nativo pra **Apple Silicon** (M1/M2/M3…). Intel Mac? Ainda não — o dente foi afiado pro silicon da casa.

Tudo roda **local**. Sem conta na nuvem, sem “assine o plano Chupa Pro”. Autenticação e cobrança? Não é dessa temporada.

---

## 1.1 — o que mudou na fome

- **Configurações** — página pra afiar o dente de cada perfil (Rápido, Balanceado, Chupacabra)
- Preferências **persistentes** em `profile-settings.json`
- Limite por job, concorrência, sites, lotes, timeout, intervalo mín/máx — com **validação**
- Parâmetros **registrados na run**
- Jobs em paralelo conforme o perfil
- Timeout de enriquecimento/CNPJ menos drama
- Testes novos de perfil, persistência e concorrência
- **Stress test** em Windows e Linux limpos
- **Mordida na maçã** — workflow `build-macos.yml`, empacotamento DMG **aarch64**, artefato na release

---

## Engine — a boca

- `placesCrawlerV2` manda na coleta (`aiohttp`, paginação do Maps)
- Dedupe por `place_id` — coletado vs único vs lixo repetido no painel
- Retry com backoff (o Maps não é open bar)
- Runs em pastas `YYYY-MM-DD HH.MM` — **local**, fora do git
- Enriquecimento: telefone, site, domínio, avaliação, **score**, **porte**, **CNPJ** (site + BrasilAPI quando rola)
- Daemon JSON stdin/stdout + eventos de ciclo de vida pra UI não ficar no escuro
- UTF-8/mojibake Python ↔ Rust ↔ Windows (e agora o Mac também senta à mesa)
- XLSX no final, abas que o Excel engole, com CNPJ/porte/score

**Lead no GitHub público é crime de guerra.** `runs/`, CSV e XLSX ficam no `.gitignore` de propósito.

---

## Frontend — onde você aperta o botão

| Tela | O que é |
|------|--------|
| **Painel** | Run de verdade, jobs, pausa/retoma/cancela |
| **Matriz de Alvos** | Cidades + **montanha de nichos B2B** + custom (`src/lib/niches.ts`) |
| **Base de Leads** | O que foi chupado — filtros por empresa, cidade, score, CNPJ, site… |
| **Relatórios** | XLSX/CSV por execução |
| **Configurações** | Afiar Rápido / Balanceado / Chupacabra |
| **Automação** | Cadeira reservada |
| **IA** | Modal “em breve”; **1.1 não inventa pitch sozinha** |

Splash do **Chupacabrinha** na abertura (é o mesmo bixin do topo).

---

## Perfis de fome

| Perfil | Vibes | Limite/job | Jobs // | Sites | Web // | Lote | Timeout | Intervalo |
|--------|--------|----------:|--------:|:-----:|-------:|-----:|--------:|----------|
| **Rápido** | Snack run: bebe a vitrine e some | 250 | 5 | não | 4 | 100 | 6 s | 3–7 s |
| **Balanceado** | Fome de adulto responsável | 500 | 3 | sim | 8 | 100 | 10 s | 8–16 s |
| **Chupacabra** | Modo monstro: mais sede, mais pausa | 1000 | 3 | sim | 10 | 100 | 10 s | 15–35 s |

- **Rápido** — velocidade > profundidade. Sem enriquecimento de site.
- **Balanceado** — coleta + site, sem tentar beber o Maps inteiro.
- **Chupacabra** — agressivo e paciente: chupa mais, espera mais entre as mordidas.

Editável na Configurações e persiste. Validação de fábrica:

| Parâmetro | Faixa |
|-----------|--------|
| Resultados por job | 1 – 5.000 |
| Concorrência crawler | 1 – 5 |
| Concorrência web | 1 – 20 |
| Lote web | 1 – 500 |
| Timeout | 1 – 60 s |
| Pausas | 0 – 120 s (máx ≥ mín) |

O **limite** é teto **por job** (cidade × nicho), **antes** do dedupe — não é promessa de N leads no Excel.

### Nomes zoeiros dos knobs (Configurações)

| Técnico | Na cara do usuário |
|---------|-------------------|
| Limite de resultados | **Tamanho do banquete** |
| Concorrência do crawler | **Bocadas ao mesmo tempo** |
| Enriquecimento de sites | **Abrir o site da vítima** |
| Concorrência do enriquecimento | **Aberturas simultâneas** |
| Tamanho dos lotes | **Tamanho do bocado** (avançado) |
| Timeout | **Paciência com site lerdo** |
| Intervalo mín/máx | **Tempo entre mordidas** |

---

## Matriz — o cardápio

**Cidade × nicho.** Você monta, o runner executa.

- Geografia: municípios BR (IBGE) + busca fora via engine
- Nichos: centenas de categorias B2B + custom
- Limite de jobs na matriz pra não hospitalizar o PC (nem o IP)

Autocomplete é B2B de gravata. Nicho livre? O cano aguenta — o Maps devolve o que tiver. Use com responsabilidade (e humor).

---

## Relatórios — o sangue engarrafado

- lista por execução
- export CSV / XLSX combinado
- colunas: contato, score, **porte**, **CNPJ**, categoria…

Tudo amarrado em `run_id` / job.

---

## Onde os dados moram

### Windows

```text
C:\Program Files\Chupacabra System\
%LOCALAPPDATA%\Chupacabra System\          # cache, logs, profile-settings.json
%USERPROFILE%\Documents\Chupacabra System\ # runs, relatórios, exports
```

### Linux / macOS

Dados de usuário seguem o padrão do desktop (Documents / app data do Tauri). Em dev, `runs/` na raiz do projeto — **no `.gitignore`**.

**Não commit lead.** Telefone de terceiro no repo público é PR que o universo devolve com juros.

---

## Instaladores (v1.1.0)

| Plataforma | Pacote | Notas |
|------------|--------|--------|
| **Windows** | `*_x64-setup.exe` (NSIS, perMachine) | Alvo oficial; stress em limpo OK |
| **Linux** | `*_amd64.deb` | Stress em limpo OK |
| **macOS** | `*_aarch64.dmg` | **Apple Silicon only**; Gatekeeper pode reclamar sem notarização |

Arte: `src-tauri/icons/icon.png`. NSIS opcional: header **150×57**, sidebar **164×314**.

---

## Desenvolvimento — alimentar o bicho em casa

Só **`main`**.

```bash
# frontend
npm install
npm run dev

# engine
python -m pip install -r mapScraper/requirements.txt
python -m engine.daemon

# smoke
python -m engine.main --profile rapido --query "Agencias de publicidade em Chapeco SC"

# rust
cargo check --manifest-path src-tauri/Cargo.toml
npx tauri dev
```

Em dev: `CHUPACABRA_PYTHON` / `CHUPACABRA_ROOT` ou `python` no PATH. Dados de teste: `CHUPACABRA_DATA_ROOT`.

---

## Build — engarrafar

```bash
npm run build                 # frontend
npm run build:engine          # engine self-contained (PyInstaller)
npx tauri build --bundles nsis   # Windows
npx tauri build --bundles deb    # Linux
npx tauri build --bundles dmg    # macOS (Apple Silicon no CI)
```

`beforeBuildCommand` = `npm run build:desktop`. Usuário final **não precisa de Python**.

### CI

| Workflow | Artefato |
|----------|----------|
| **Build Windows** | NSIS → artifact + release em `v*` |
| **Build Linux** | DEB → artifact + release em `v*` |
| **Build macOS** | DMG **aarch64** → artifact + release em `v*` |

Push em `main`, tag `v*`, ou `workflow_dispatch`.

Assinatura de código (Windows Authenticode / Apple notarization) ainda é passo à parte — não bloqueia o uso, só a “cara de desconhecido” do SO.

---

## Mapa do antro

```text
chupacabra/
├── src/                     # React/TanStack
├── src-tauri/               # Rust + empacotamento (Win/Linux/macOS)
├── engine/                  # daemon, geography, orchestration, profiles
├── mapScraper/              # crawler, enrichment, XLSX
├── scripts/                 # build do engine, assets
├── tests/
├── .github/workflows/       # build-windows, build-linux, build-macos
├── CHANGELOG.md
└── README.md
```

---

## Próximas vítimas

1. Automação de abordagem (hoje é só a cadeira)
2. IA de verdade (modal já provocando)
3. Histórico de runs ainda mais carnudo
4. Relatório por cidade + consolidado, se a fome pedir
5. Assinatura / notarização dos instaladores (Windows + macOS)
6. Stress test macOS em máquina limpa (o dente na maçã é novo)
7. Intel Mac? Só se a fome pedir — prioridade é Apple Silicon

---

## Plataformas

| OS | Status |
|----|--------|
| **Windows** | Oficial · NSIS · stress limpo |
| **Linux** | DEB · CI · stress limpo |
| **macOS** | **DMG aarch64** · CI verde · mordida recente na maçã |

---

<p align="center">
  Feito pra chupar.<br/>
  Windows, Linux e — agora — uma mordida na maçã.<br/>
  Com perfil, limite, concorrência e relatório no final.<br/>
  Porque até monstro precisa de processinho.
</p>

<p align="center"><strong>Vem dar uma chupadinha.</strong> 🦇🍎</p>
