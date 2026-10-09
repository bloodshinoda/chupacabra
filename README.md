<p align="center">
  <img src="src-tauri/icons/icon.png" alt="Chupacabra System" width="280" />
</p>

# Chupacabra System 🦇

**B2B Prospect Engine.** O nome não é branding fofo: o bicho foi feito pra **chupar** lead — cidade, nicho, telefone, site, score, CNPJ, o combo inteiro.

Crawler assíncrono, enriquecimento, perfis com fome configurável e desktop Tauri. Você monta a matriz, escolhe o nível de sede e aperta o botão. O resto é sangue no XLSX.

<p align="center"><strong>👉 <a href="https://github.com/bloodshinoda/chupacabra/releases/tag/v1.1.0">Vem dar uma chupadinha</a> 👈</strong></p>

> **Versão 1.1.0** — leads reais, relatórios do que foi chupado, CNPJ/BrasilAPI, **página de Configurações** com perfis personalizáveis e persistentes, concorrência controlada, CI Windows + Linux, instalador NSIS/DEB. Branch oficial: `main` (o resto é folclore).

Release: [v1.1.0](https://github.com/bloodshinoda/chupacabra/releases/tag/v1.1.0) · [Changelog](CHANGELOG.md)  
🐾 *Mais controle, menos chute, mais fome configurável.*

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

**Windows + NSIS** em `Program Files` é o prato principal. Linux ganha **DEB** no CI (o primo que também come, só que de terno experimental).

Tudo roda **local**. Sem conta na nuvem, sem “assine o plano Chupa Pro”. Autenticação e cobrança? Não é dessa temporada.

---

## 1.1 — o que mudou na fome

- **Configurações** — página pra afiar o dente de cada perfil (Rápido, Balanceado, Chupacabra)
- Preferências **persistentes** em `profile-settings.json` (não some quando fecha o app)
- Limite por job, concorrência, sites, lotes, timeout, intervalo mín/máx — com **validação** pra não inventar número mágico
- Parâmetros **registrados na run** (histórico de “com que fome isso foi chupado”)
- Jobs em paralelo de verdade, conforme o perfil
- Timeout de enriquecimento/CNPJ menos drama
- Testes novos de perfil, persistência e concorrência

---

## Engine — a boca

- `placesCrawlerV2` manda na coleta (`aiohttp`, paginação do Maps)
- Dedupe por `place_id` — coletado vs único vs lixo repetido no painel
- Retry com backoff (o Maps não é open bar)
- Runs em pastas `YYYY-MM-DD HH.MM` — **local**, fora do git
- Enriquecimento: telefone, site, domínio, avaliação, **score**, **porte**, **CNPJ** (site + BrasilAPI quando rola)
- Daemon JSON stdin/stdout + eventos de ciclo de vida pra UI não ficar no escuro
- UTF-8/mojibake Python ↔ Rust ↔ Windows: já tomamos essa porrada
- XLSX no final, abas que o Excel engole, com CNPJ/porte/score

**Lead no GitHub público é crime de guerra.** `runs/`, CSV e XLSX ficam no `.gitignore` de propósito.

---

## Frontend — onde você aperta o botão

| Tela | O que é |
|------|--------|
| **Painel** | Run de verdade, jobs, pausa/retoma/cancela, o bicho respirando entre as vítimas |
| **Matriz de Alvos** | Cidades (IBGE e afins) + **montanha de nichos B2B** + nicho custom (`src/lib/niches.ts`) |
| **Base de Leads** | O que foi chupado — filtro por empresa, cidade, score, CNPJ, site… |
| **Relatórios** | XLSX/CSV por execução, sem teatro |
| **Configurações** | Afiar Rápido / Balanceado / Chupacabra — a novidade da 1.1 |
| **Automação** | Cadeira reservada; ainda não manda Zap pra ninguém |
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

Tudo isso é **editável** na Configurações e persiste. Validação de fábrica:

| Parâmetro | Faixa |
|-----------|--------|
| Resultados por job | 1 – 5.000 |
| Concorrência crawler | 1 – 5 |
| Concorrência web | 1 – 20 |
| Lote web | 1 – 500 |
| Timeout | 1 – 60 s |
| Pausas | 0 – 120 s (máx ≥ mín) |

O **limite** é teto **por job** (uma cidade × um nicho), **antes** do dedupe. Não é promessa de “N leads no Excel”. O Maps e o dedupe decidem o que sobra no prato. A concorrência do crawler limita quantos jobs roem ao mesmo tempo; as pausas aleatórias entram entre os inícios de job.

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
- Nichos: centenas de categorias B2B (marketing, TI, saúde, indústria, varejo…) e o que você digitar de custom
- Tem limite de jobs na matriz pra não mandar o PC (nem o IP) pro hospital

O autocomplete é B2B de gravata. Nicho livre? O cano aguenta query esquisita — o Maps devolve o que tiver indexado. Use com responsabilidade (e humor).

---

## Relatórios — o sangue engarrafado

Depois da coleta/enriquecimento:

- lista por execução
- export CSV de leads
- export combinado / XLSX
- colunas que importam: contato, score, **porte**, **CNPJ**, categoria…

Tudo amarrado em `run_id` / job. Re-chupar a cidade inteira só porque faltou uma aba não é o plano de vida.

---

## Onde o Windows guarda a bagunça

```text
C:\Program Files\Chupacabra System\
    o executável e a alma instalada

C:\ProgramData\Chupacabra System\
    config compartilhada (se precisar)

%LOCALAPPDATA%\Chupacabra System\
    cache, logs, profile-settings.json, sujeira de sessão

%USERPROFILE%\Documents\Chupacabra System\
    runs, relatórios, exports — o estoque
```

Dev: `runs/` na raiz, ignorado pelo git. **Não commit lead.** Telefone de terceiro no repo público é o tipo de PR que o universo devolve com juros.

---

## Instalador

`.exe` **perMachine**: admin, `Program Files`, atalho **Chupacabra System**, PT-BR.

Arte: `src-tauri/icons/icon.png` (cópia em `public/icon.png` no build).  
NSIS opcional: header **150×57**, sidebar **164×314**.

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
npm run build:engine          # chupacabra-engine.exe (PyInstaller)
npx tauri build --bundles nsis
```

`beforeBuildCommand` = `npm run build:desktop` (frontend + engine). Usuário final **não precisa de Python**.

### CI

- Windows → NSIS + release em tags `v*`
- Linux → DEB + release em tags `v*`

Push em `main`, tag `v*`, ou `workflow_dispatch`.  
Assinatura de código e smoke em Windows limpo: faça antes de soltar pros desconhecidos.

---

## Mapa do antro

```text
chupacabra/
├── src/                     # React/TanStack — painel, matriz, leads, configs
├── src-tauri/               # Rust — a ponte
├── engine/                  # daemon, geography, orchestration, profiles
├── mapScraper/              # crawler, enrichment, XLSX
├── scripts/                 # build do engine, assets
├── tests/                   # pra não chupar errado duas vezes
├── .github/workflows/       # Windows + Linux
├── CHANGELOG.md
└── README.md                # você está aqui (com o bixin e o convite)
```

---

## Próximas vítimas

1. Automação de abordagem (hoje é só a cadeira)
2. IA de verdade (modal já provocando)
3. Histórico de runs ainda mais carnudo
4. Relatório por cidade + consolidado, se a fome pedir
5. Assinatura do instalador
6. Mais teste em máquina limpa

---

## Plataformas

Tauri fala Windows, Linux e macOS. **Oficial pra distribuir: Windows.** Linux no CI é laboratório com `.deb` de brinde.

---

<p align="center">
  Feito pra chupar.<br/>
  Com perfil, limite, concorrência e relatório no final —<br/>
  porque até monstro precisa de processinho.
</p>

<p align="center"><strong>Vem dar uma chupadinha.</strong> 🦇</p>
