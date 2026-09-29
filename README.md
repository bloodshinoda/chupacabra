# Chupacabra System

**B2B Prospect Engine** para pesquisa de empresas por cidade e nicho, com crawler baseado no `placesCrawlerV2`, enriquecimento de leads e interface desktop Tauri.

## Estado atual

O projeto está em evolução ativa no branch de engine P0. A arquitetura atual substitui progressivamente o fluxo antigo baseado em BAT por:

```text
Interface React/TanStack
        ↓
Tauri / Rust
        ↓
Python Engine
        ↓
placesCrawlerV2
        ↓
coleta → deduplicação → enriquecimento → XLSX
```

O engine trabalha com perfis de execução **Rápido**, **Balanceado** e **Chupacabra**, com limites e cadências diferentes.

A coleta possui deduplicação por identificador do local. A interface pode distinguir resultados **coletados**, **únicos** e **duplicados**, evitando confundir o volume bruto do crawler com o volume final do relatório.

## Desktop Windows

A aplicação desktop usa Tauri 2 e o objetivo de distribuição é um instalador **NSIS por máquina**, com o runtime Python empacotado em um executável self-contained via PyInstaller.

O instalador Windows está configurado para **Português (Brasil)**.

Dados mutáveis das execuções devem permanecer fora de `Program Files`, principalmente em:

```text
%USERPROFILE%\Documents\Chupacabra System\
```

## Relatórios

O pipeline produz CSV bruto, CSV enriquecido e relatório final XLSX. O relatório consolida os jobs concluídos e possui proteção contra caracteres inválidos em nomes de abas do Excel.

Os logs de execução registram o progresso do crawler, enriquecimento e erros de geração do relatório.

## Desenvolvimento

Frontend:

```bash
npm install
npm run dev
```

Testes Python:

```bash
python -m unittest discover -s tests -v
```

Build Windows:

```bash
npx tauri build --bundles nsis
```

## Estrutura

```text
src/          frontend React/TanStack
src-tauri/    shell Tauri/Rust
engine/       engine Python
mapScraper/   crawler e pipeline legado
scripts/      automações de build
```

A documentação técnica detalhada permanece no branch de engine P0.
