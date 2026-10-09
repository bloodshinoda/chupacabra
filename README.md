<p align="center">
  <img src="src-tauri/icons/icon.png" alt="Chupacabra System" width="280" />
</p>

# Chupacabra System 🦇

**B2B Prospect Engine.** O nome não é metáfora de marketing: o bicho foi feito pra **chupar** lead — cidade, nicho, telefone, site, score, CNPJ, o combo.

Crawler assíncrono, enriquecimento, perfis de execução e desktop Tauri. Você monta a matriz, aperta o botão, e o resto é sangue no XLSX.

> **Versão 1.1.0 (stable)** — primeira versão que dá pra olhar no espelho sem ver mock. Engine real, **Base de Leads** de verdade, **Relatórios** do que foi chupado, CNPJ/BrasilAPI, CI Windows + Linux, instalador NSIS/DEB. Branch oficial: `main` (só ela; o resto é lenda urbana).

Release: [v1.1.0](https://github.com/bloodshinoda/chupacabra/releases/tag/v1.1.0)  
🐾 *Chupacabra tá pronto pra chupar.*

## O que esse monstro faz

Prospecção B2B sem viver em planilha na mão e script solto:

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

Alvo principal de distribuição: **Windows + NSIS** em `Program Files`. Linux ganha **DEB** no CI (irmão mais novo, mas já entra na festa).

## Estado atual (1.1.0) — o que já mama

### Engine

- `placesCrawlerV2` manda na coleta.
- `aiohttp`, paginação do Maps, dedupe por `place_id` (coletado vs único vs lixo duplicado no painel).
- Retry com backoff — o Maps não é buffet livre.
- Perfis: `rapido`, `balanceado`, `chupacabra` (esse último é fome mesmo).
- Runs em pastas `YYYY-MM-DD HH.MM` — **local**, fora do git. Lead no repo público é crime de guerra.
- Enriquecimento: telefone, site, domínio, avaliação, **score**, **porte**, **CNPJ** (site + BrasilAPI quando rola).
- Daemon JSON stdin/stdout; eventos de ciclo de vida pra UI não ficar no escuro.
- UTF-8/mojibake entre Python, Rust e Windows: a gente já tomou essa porrada e tratou.
- XLSX no final, abas que o Excel não vomita, com CNPJ/porte/score.

### Tauri

Rust (`engine_runtime`) sobe o engine e joga stdout/stderr pra interface.

Dev: `python -m engine.daemon` na raiz.  
Build Windows: engine **PyInstaller one-file** embutido — usuário final **não precisa de Python** (e graças a Deus).

Dados instalados:

```text
%USERPROFILE%\Documents\Chupacabra System\
```

Frontend prod: `.output/public`. Dev: `127.0.0.1:5173` (porta teimosa de propósito).

### Como o instalador nasce

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

`npm run build:engine` + `requirements-build.txt` só no build. Em dev: `CHUPACABRA_PYTHON` / `CHUPACABRA_ROOT` ou `python` no PATH. Teste de dados: `CHUPACABRA_DATA_ROOT`.

### Frontend — onde você aperta o botão

- **Painel** — run de verdade, jobs, pausa estocástica (o bicho respira entre as vítimas)
- **Matriz de Alvos** — cidades (IBGE e afins) + **montanha de nichos B2B** (`src/lib/niches.ts`)
- **Base de Leads** — o que foi chupado, filtrável (empresa, cidade, score, CNPJ, site…)
- **Relatórios** — XLSX/CSV da execução, sem teatro
- **Automação** — cadeira reservada; ainda não manda mensagem pra ninguém
- **IA** — modal “em breve”; **1.0 não inventa copy sozinha**
- Splash do **Chupacabrinha** na abertura (mesma arte do ícone acima)

## Perfis de fome

| Perfil | Limite por job | Jobs crawler em paralelo | Sites | Concorrência web | Lote web | Timeout | Intervalo |
|---|---:|---:|---|---:|---:|---:|---:|
| `rapido` | 250 | 5 | não | 4 | 100 | 6 s | 3–7 s |
| `balanceado` | 500 | 3 | sim | 8 | 100 | 10 s | 8–16 s |
| `chupacabra` | 1000 | 3 | sim | 10 | 100 | 10 s | 15–35 s |

Os valores são editáveis por perfil e persistidos em `profile-settings.json` na pasta de dados do aplicativo. A validação limita: resultados por job de 1 a 5.000; concorrência crawler de 1 a 5; concorrência web de 1 a 20; lote web de 1 a 500; timeout de 1 a 60 segundos; pausas de 0 a 120 segundos, com máximo maior ou igual ao mínimo.

O limite é aplicado pelo crawler a cada consulta (um job = uma combinação cidade × nicho), antes da deduplicação. Portanto, não é uma promessa de quantidade final de leads; o Maps decide quantos sobram depois do dedupe. A concorrência crawler limita jobs simultâneos; as pausas aleatórias configuradas são aplicadas entre inícios de jobs.

## Matriz de prospecção

**Cidade × nicho.** Você monta, o runner executa.

- Geografia: municípios BR (IBGE) + busca fora via engine
- Nichos: Acompanhantes, Igrejas evangélicas com café da manhã, Casas de apostas, Academias de Crossfrit, Sex Shop… e o que você inventar de custom

Tem limite de jobs na matriz pra não mandar o PC (nem o IP) pro hospital.

## Relatórios — o sangue engarrafado

Depois da coleta/enriquecimento: CSV consolidado + XLSX da run. Na UI 1.0:

- lista por execução
- export CSV de leads
- export combinado
- colunas que importam: contato, score, **porte**, **CNPJ**, categoria…

Tudo amarrado em `run_id` / job. Regenerar relatório sem re-chupar a cidade inteira é o sonho; a estrutura já aponta pra isso.

## Onde o Windows guarda a bagunça

```text
C:\Program Files\Chupacabra System\
    o executável e a alma instalada

C:\ProgramData\Chupacabra System\
    config compartilhada (se precisar)

%LOCALAPPDATA%\Chupacabra System\
    cache, logs, coisa suja de sessão

%USERPROFILE%\Documents\Chupacabra System\
    runs, relatórios, exports — o estoque de leads
```

Dev: `runs/` na raiz, no `.gitignore`. **Não commit lead.** Telefone de terceiros no GitHub público é o tipo de PR que o universo devolve com juros.

## Instalador NSIS

`.exe` **perMachine**: admin, `Program Files`, todo mundo no PC, `HKLM`, atalho **Chupacabra System**, PT-BR.

Arte do bicho: `src-tauri/icons/icon.png` (e cópia gerada em `public/icon.png` no build).  
Artes opcionais do instalador: header **150×57**, sidebar **164×314**. Ícones em `src-tauri/icons/`.

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

## Build — engarrafar

```bash
npm run build                 # frontend
npm run build:engine          # chupacabra-engine.exe
npx tauri build --bundles nsis
```

`beforeBuildCommand` = `npm run build:desktop` (frontend + engine).

### CI

- Windows → NSIS + release em tags `v*`
- Linux → DEB + release em tags `v*`

Push em `main`, tags `v*`, ou `workflow_dispatch`.  
Assinatura de código e teste em Windows limpo ainda são “faça antes de soltar pros desconhecidos”.

## Mapa do antro

```text
chupacabra/
├── src/                     # React/TanStack — o painel
├── src-tauri/               # Rust — a ponte
├── engine/                  # daemon, geography, orchestration
├── mapScraper/              # crawler, enrichment, XLSX
├── scripts/                 # build do engine, assets
├── tests/                   # pra não chupar errado duas vezes
├── .github/workflows/       # Windows + Linux
└── README.md                # você está aqui (com o bixin em cima)
```

## Próximas vítimas (roadmap)

1. Automação de abordagem (hoje é só a cadeira vazia)
2. IA de verdade (modal já provocando; 1.0 não alucina pitch)
3. Histórico de runs ainda mais carnudo na UI
4. Relatório por cidade + consolidado, se a fome pedir
5. Assinatura do instalador
6. Mais teste em máquina limpa

## Plataformas

Tauri fala Windows, Linux e macOS. **Oficial pra distribuir: Windows.** Linux no CI é o laboratório que também gera `.deb`.

---

Feito pra chupar. Com perfil, limite de jobs e relatório no final — porque até monstro precisa de processinho.
