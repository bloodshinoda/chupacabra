# Chupacabra System

**B2B Prospect Engine** para pesquisa de empresas por cidade e nicho, com crawler assíncrono, enriquecimento de leads, execução controlada por perfis e interface desktop baseada em Tauri.

> Projeto em desenvolvimento. O frontend atual foi originalmente gerado com Lovable/TanStack Start e está sendo integrado ao engine Python legado do MapScraper.

## Objetivo

O Chupacabra transforma o fluxo antigo baseado em scripts/BAT em uma aplicação desktop integrada:

```text
Interface React/TanStack
        ↓
     Tauri IPC
        ↓
     Rust bridge
        ↓
 Python Engine / daemon
        ↓
 placesCrawlerV2
        ↓
 coleta → deduplicação → enriquecimento → relatórios
```

A meta de distribuição atual é **Windows + instalador NSIS por máquina**, instalado para todos os usuários em `Program Files`.

## Estado atual

### Engine

- `placesCrawlerV2` é o crawler principal.
- Coleta assíncrona via `aiohttp`.
- Paginação direta do Google Maps.
- Deduplicação por `place_id`.
- Retry com backoff.
- Perfis de execução:
  - `fast`
  - `balanced`
  - `aggressive`
- Execução organizada em `runs/<run_id>/jobs/<job_id>/` durante o desenvolvimento.
- Enriquecimento de leads com campos de telefone, site, domínio, avaliação, densidade de avaliações, score e segmento.
- Daemon Python com protocolo JSON por stdin/stdout.
- Eventos de ciclo de vida: início, jobs, progresso, conclusão, falha, cancelamento e logs.

### Tauri

O bridge Rust já consegue iniciar `python -m engine.daemon`, enviar comandos JSON e encaminhar eventos do engine para o frontend.

O frontend de produção será servido pelo diretório `.output/public` gerado pelo TanStack/Nitro.

A configuração de desenvolvimento usa `127.0.0.1:5173`. O ambiente de Codespaces/Lovable pode alterar portas do servidor web por causa da infraestrutura de sandbox; isso não deve ser usado como referência para a execução nativa do Tauri em Windows.

### Frontend

A interface já possui as áreas principais:

- **Painel de Controle**
- **Matriz de Alvos / Cidades & Nichos**
- **Base de Leads**
- **Automação / Abordagem**
- **Relatórios / Exportação**

O próximo trabalho de integração é substituir os dados simulados do dashboard por eventos e estados reais do engine.

## Perfis de execução

| Perfil | Limite padrão | Sites | Concorrência web | Intervalo |
|---|---:|---|---:|---:|
| `fast` | 250 | não | 4 | 3–7 s |
| `balanced` | 500 | sim | 8 | 8–16 s |
| `aggressive` | 1000 | sim | 10 | 15–35 s |

Os valores são parâmetros operacionais, não garantias de quantidade de resultados.

## Matriz de prospecção

A antiga automação BAT possuía 36 combinações ativas entre 12 categorias e 3 cidades:

- Chapecó
- Xanxerê
- Concórdia

Categorias principais incluem agências de publicidade, gráficas, comunicação visual, marketing digital, brindes corporativos, eventos, serigrafia/estamparia, imobiliárias, concessionárias, construtoras e clínicas odontológicas.

A matriz será controlada pela aplicação, eliminando a necessidade de executar arquivos `.bat`.

## Relatórios

A arquitetura de relatórios será orientada por **cidade**, sem perder a visão consolidada.

Cada execução deverá poder produzir:

```text
Reports/
├── consolidado.xlsx
├── Chapeco.xlsx
├── Xanxere.xlsx
└── Concordia.xlsx
```

Além dos arquivos por cidade, a aplicação deverá manter uma visão consolidada contendo totais, categorias, score, segmentos e indicadores gerais.

Quando uma execução abranger várias cidades, os dados internos continuarão associados a `run_id`, cidade, categoria e job. Isso permite regenerar relatórios sem repetir a coleta.

## Diretórios de dados no Windows

O instalador e os binários **não devem gravar dados mutáveis dentro de `Program Files`**.

A divisão planejada é:

```text
C:\Program Files\Chupacabra System\
    aplicação, runtime, recursos e componentes instalados

C:\ProgramData\Chupacabra System\
    configurações e dados compartilhados pela máquina, quando necessários

%LOCALAPPDATA%\Chupacabra System\
    cache, estado temporário e logs do usuário

%USERPROFILE%\Documents\Chupacabra System\
    runs, relatórios, exports e arquivos gerados pelo usuário
```

A regra é simples: **Programa em `Program Files`; dados do usuário em `Documents`; cache/logs em `LocalAppData`; dados realmente compartilhados em `ProgramData`.**

Durante o desenvolvimento, `runs/` continua sendo aceito como diretório local do projeto para facilitar testes e validação.

## Instalador NSIS

O destino oficial atual é um instalador `.exe` NSIS com instalação **`perMachine`**, portanto:

- requer elevação administrativa;
- instala por padrão em `Program Files`;
- fica disponível para todos os usuários da máquina;
- usa metadados de instalação em `HKLM`;
- cria o atalho no Menu Iniciar em `Chupacabra System`.

A configuração Tauri já está preparada para esse modo.

### Artes do instalador

Para personalizar o NSIS, preparar estas imagens nas dimensões exatas recomendadas pelo Tauri:

| Arquivo | Uso | Dimensão |
|---|---|---:|
| `header.bmp` | cabeçalho das páginas do instalador | **150 × 57 px** |
| `sidebar.bmp` | lateral da tela inicial/final | **164 × 314 px** |
| `uninstaller-header.bmp` | cabeçalho do desinstalador, opcional | **150 × 57 px** |

O Tauri trata essas artes como bitmaps para o template NSIS. O ícone do instalador/desinstalador é um `.ico`; o conjunto de ícones já é gerado em `src-tauri/icons/`.

Também é recomendável manter uma arte-mestra quadrada de alta resolução, por exemplo **1024 × 1024 px em PNG**, para regenerar os ícones quando a identidade visual mudar.

## Desenvolvimento

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

### Smoke test do engine

```bash
python -m engine.main --profile fast --query "Agencias de publicidade em Chapeco SC"
```

### Validação Rust/Tauri

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

O `npx tauri dev` deve ser executado em um ambiente desktop local com suporte gráfico. Codespaces pode servir o frontend pelo navegador, mas não representa uma janela nativa do Tauri.

## Build Windows

No ambiente Windows com os pré-requisitos do Tauri instalados:

```bash
npm run build
npx tauri build --bundles nsis
```

O resultado esperado é um instalador NSIS `.exe`.

Antes da distribuição pública, ainda será necessário configurar assinatura de código, identidade do publicador e validação do instalador em uma instalação limpa do Windows.

## Arquitetura do repositório

```text
chupacabra/
├── src/                     # frontend React/TanStack
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── routes/
├── src-tauri/               # shell desktop Tauri/Rust
│   ├── icons/
│   ├── src/
│   └── tauri.conf.json
├── engine/                  # engine Python
│   ├── crawler/
│   ├── models/
│   ├── orchestration/
│   └── storage/
├── mapScraper/              # crawler legado e dependências
├── runs/                    # saída local de desenvolvimento
└── README.md
```

## Próximos marcos

1. Integrar o dashboard aos eventos reais do engine.
2. Integrar a matriz de cidades/nichos ao runner.
3. Implementar pausa, retomada e cancelamento pela interface.
4. Implementar armazenamento em diretórios padrão do Windows.
5. Implementar relatório consolidado + relatórios individuais por cidade.
6. Implementar tela de histórico das execuções.
7. Empacotar o runtime Python junto da aplicação Windows.
8. Gerar e testar o instalador NSIS `perMachine` em Windows limpo.
9. Assinar o executável/instalador para distribuição.

## Plataformas

O **Tauri não é limitado ao Windows**. O framework suporta Windows, Linux e macOS no desktop, além de Android e iOS. O instalador NSIS e a integração atual do Chupacabra, porém, são o alvo de distribuição **Windows** deste projeto.

Uma versão Linux/macOS seria tecnicamente possível, mas exigiria validar e adaptar o engine Python, empacotamento do runtime, caminhos de dados, dependências nativas e integração específica de cada sistema operacional.
