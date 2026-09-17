#!/usr/bin/env python3
"""
Gera um relatorio Excel (.xlsx) consolidado a partir dos CSVs produzidos
pelo mapScraper (raw e/ou enriched), com abas por categoria, aba de
resumo com totais e graficos, numeros de celular destacados em verde.

Uso:
    python gerar_relatorio.py [pasta_com_csvs] [arquivo_saida.xlsx]

Se nao informar argumentos, usa a pasta "data" e gera
"relatorio_chapeco_<data>.xlsx" na pasta atual.
"""
import sys
import re
import glob
import os
from datetime import datetime

import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.chart import BarChart, PieChart, Reference
from openpyxl.chart.label import DataLabelList

# ---------------------------------------------------------------------------
# Nomes amigaveis conhecidos (slug do arquivo -> nome de exibicao em pt-BR)
# Qualquer slug nao mapeado aqui cai no fallback (title case + underscore->espaco)
FRIENDLY_NAMES = {
    "agencias_publicidade": "Agências de Publicidade",
    "brindes_corporativos": "Brindes Corporativos",
    "comunicacao_visual": "Comunicação Visual",
    "eventos_corporativos": "Eventos Corporativos",
    "graficas": "Gráficas",
    "graficas_rapidas": "Gráficas Rápidas",
    "marketing_digital": "Marketing Digital",
    "serigrafia_estamparia": "Serigrafia e Estamparia",
}

RAW_COLS = [
    "id", "url_place", "title", "category", "address", "phoneNumber",
    "completePhoneNumber", "domain", "url", "coor", "stars", "reviews",
    "source_query",
]
ENRICHED_EXTRA = ["score", "segment"]


def friendly_name(slug: str) -> str:
    if slug in FRIENDLY_NAMES:
        return FRIENDLY_NAMES[slug]
    return slug.replace("_", " ").title()


def discover_files(folder: str) -> dict:
    """
    Varre a pasta procurando pares <slug>_raw.csv / <slug>.csv.
    Retorna dict slug -> caminho do melhor arquivo disponivel
    (prioriza o enriquecido, que tem mais colunas).
    """
    all_csvs = glob.glob(os.path.join(folder, "*.csv"))
    by_slug = {}
    for path in all_csvs:
        fname = os.path.basename(path)
        stem = fname[:-4]
        is_raw = stem.endswith("_raw")
        slug = stem[:-4] if is_raw else stem
        entry = by_slug.setdefault(slug, {})
        if is_raw:
            entry["raw"] = path
        else:
            entry["enriched"] = path

    chosen = {}
    for slug, entry in by_slug.items():
        chosen[slug] = entry.get("enriched") or entry.get("raw")
    return chosen


def is_mobile(phone) -> bool:
    if not isinstance(phone, str) or not phone.strip():
        return False
    digits = re.sub(r"\D", "", phone)
    return len(digits) == 11  # (DD) 9XXXX-XXXX


# ---------------------------------------------------------------------------
# Estilos
HEADER_FILL = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
HEADER_FONT = Font(name="Arial", size=11, bold=True, color="FFFFFF")
BASE_FONT = Font(name="Arial", size=10)
MOBILE_FILL = PatternFill(start_color="C6EFCE", end_color="C6EFCE", fill_type="solid")
MOBILE_FONT = Font(name="Arial", size=10, bold=True, color="006100")
TOTAL_FILL = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")
THIN = Side(style="thin", color="D9D9D9")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)
LEFT = Alignment(horizontal="left", vertical="center", wrap_text=True)

COLS = [
    ("title", "Nome", 32),
    ("category", "Categoria (Google)", 20),
    ("phoneNumber", "Telefone", 16),
    ("address", "Endereço", 42),
    ("domain", "Site/Domínio", 24),
    ("stars", "Avaliação", 10),
    ("reviews", "Nº Avaliações", 12),
    ("score", "Score (Lead)", 12),
    ("segment", "Segmento", 12),
]


def build_workbook(files_by_slug: dict, out_path: str):
    wb = Workbook()
    wb.remove(wb.active)

    summary_rows = []  # (nome, total, celular, fixo/sem, score_medio, segmentos_counter)
    segment_totals = {"micro": 0, "small": 0, "medium": 0, "large": 0}

    for slug in sorted(files_by_slug, key=lambda s: friendly_name(s)):
        path = files_by_slug[slug]
        sheet_name = friendly_name(slug)
        df = pd.read_csv(path)
        has_score = "score" in df.columns

        sort_cols = ["stars", "reviews"]
        if has_score:
            sort_cols = ["score"] + sort_cols
        df = df.sort_values(
            by=[c for c in sort_cols if c in df.columns],
            ascending=False,
        ).reset_index(drop=True)

        ws = wb.create_sheet(title=sheet_name[:31])

        cols_here = [c for c in COLS if c[0] in df.columns or c[0] in ("phoneNumber", "title", "category", "address")]

        ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(cols_here))
        title_cell = ws.cell(row=1, column=1, value=f"{sheet_name} — Chapecó/SC")
        title_cell.font = Font(name="Arial", size=13, bold=True, color="1F4E78")
        ws.row_dimensions[1].height = 22

        header_row = 2
        for j, (key, label, width) in enumerate(cols_here, start=1):
            c = ws.cell(row=header_row, column=j, value=label)
            c.font = HEADER_FONT
            c.fill = HEADER_FILL
            c.alignment = CENTER
            c.border = BORDER
            ws.column_dimensions[get_column_letter(j)].width = width

        n_mobile = 0
        for i, row in df.iterrows():
            r = header_row + 1 + i
            for j, (key, label, width) in enumerate(cols_here, start=1):
                val = row.get(key, "")
                if pd.isna(val):
                    val = ""
                if key in ("stars", "score") and val != "":
                    try:
                        val = float(val)
                    except Exception:
                        pass
                if key == "reviews" and val != "":
                    try:
                        val = int(val)
                    except Exception:
                        pass
                c = ws.cell(row=r, column=j, value=val)
                c.font = BASE_FONT
                c.border = BORDER
                c.alignment = CENTER if key in ("stars", "reviews", "phoneNumber", "score", "segment") else LEFT

                if key == "phoneNumber" and is_mobile(str(val)):
                    c.fill = MOBILE_FILL
                    c.font = MOBILE_FONT
                    n_mobile += 1
            ws.row_dimensions[r].height = 28

        ws.freeze_panes = f"A{header_row+1}"
        ws.auto_filter.ref = f"A{header_row}:{get_column_letter(len(cols_here))}{header_row+len(df)}"

        avg_score = round(df["score"].mean(), 1) if has_score and len(df) else None
        if has_score and "segment" in df.columns:
            counts = df["segment"].value_counts().to_dict()
            for k in segment_totals:
                segment_totals[k] += counts.get(k, 0)

        summary_rows.append((sheet_name, len(df), n_mobile, len(df) - n_mobile, avg_score))

    # ------------------------------------------------------------------
    # Aba Resumo
    ws_sum = wb.create_sheet(title="Resumo", index=0)
    ws_sum.merge_cells("A1:E1")
    t = ws_sum.cell(row=1, column=1, value="Resumo — Mapeamento de Concorrentes/Parceiros Chapecó/SC")
    t.font = Font(name="Arial", size=14, bold=True, color="1F4E78")
    ws_sum.row_dimensions[1].height = 24
    ws_sum.cell(row=2, column=1, value=f"Gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')}").font = Font(
        name="Arial", size=9, italic=True, color="808080"
    )

    headers = ["Categoria", "Total de Empresas", "Com Celular", "Com Fixo/Sem Nº", "Score Médio"]
    header_row = 4
    for j, h in enumerate(headers, start=1):
        c = ws_sum.cell(row=header_row, column=j, value=h)
        c.font = HEADER_FONT
        c.fill = HEADER_FILL
        c.alignment = CENTER
        c.border = BORDER

    total_all = total_mobile = total_other = 0
    scores = []
    for i, (name, total, mob, other, avg_score) in enumerate(summary_rows):
        r = header_row + 1 + i
        vals = [name, total, mob, other, avg_score if avg_score is not None else ""]
        for j, v in enumerate(vals, start=1):
            c = ws_sum.cell(row=r, column=j, value=v)
            c.font = BASE_FONT
            c.border = BORDER
            c.alignment = LEFT if j == 1 else CENTER
            if j == 3 and mob > 0:
                c.fill = MOBILE_FILL
                c.font = MOBILE_FONT
        total_all += total
        total_mobile += mob
        total_other += other
        if avg_score is not None:
            scores.append(avg_score)

    total_row = header_row + 1 + len(summary_rows)
    totals = ["TOTAL", total_all, total_mobile, total_other, round(sum(scores) / len(scores), 1) if scores else ""]
    for j, v in enumerate(totals, start=1):
        c = ws_sum.cell(row=total_row, column=j, value=v)
        c.font = Font(name="Arial", size=10, bold=True)
        c.border = BORDER
        c.alignment = LEFT if j == 1 else CENTER
        c.fill = TOTAL_FILL

    ws_sum.column_dimensions["A"].width = 28
    ws_sum.column_dimensions["B"].width = 16
    ws_sum.column_dimensions["C"].width = 12
    ws_sum.column_dimensions["D"].width = 16
    ws_sum.column_dimensions["E"].width = 12

    legend_row = total_row + 2
    ws_sum.cell(row=legend_row, column=1, value="Legenda:").font = Font(name="Arial", size=10, bold=True)
    c = ws_sum.cell(row=legend_row + 1, column=1, value="Número de celular")
    c.fill = MOBILE_FILL
    c.font = MOBILE_FONT
    c.border = BORDER

    # ------------------------------------------------------------------
    # Grafico 1: Total de empresas x Com celular, por categoria (barras)
    chart1 = BarChart()
    chart1.type = "col"
    chart1.title = "Empresas por Categoria — Total vs. Com Celular"
    chart1.y_axis.title = "Nº de empresas"
    chart1.x_axis.title = "Categoria"
    chart1.style = 10
    data = Reference(ws_sum, min_col=2, max_col=3, min_row=header_row, max_row=header_row + len(summary_rows))
    cats = Reference(ws_sum, min_col=1, min_row=header_row + 1, max_row=header_row + len(summary_rows))
    chart1.add_data(data, titles_from_data=True)
    chart1.set_categories(cats)
    chart1.width = 24
    chart1.height = 11
    ws_sum.add_chart(chart1, f"A{legend_row + 4}")

    # Grafico 2: Score medio por categoria (barras)
    if scores:
        chart2 = BarChart()
        chart2.type = "bar"
        chart2.title = "Score Médio de Lead por Categoria"
        chart2.x_axis.title = "Score (0-100)"
        chart2.style = 12
        data2 = Reference(ws_sum, min_col=5, max_col=5, min_row=header_row, max_row=header_row + len(summary_rows))
        chart2.add_data(data2, titles_from_data=True)
        chart2.set_categories(cats)
        chart2.width = 24
        chart2.height = 11
        ws_sum.add_chart(chart2, f"A{legend_row + 26}")

    # Grafico 3: distribuicao de segmentos (pizza), se houver dados de score
    if sum(segment_totals.values()) > 0:
        seg_row = legend_row + 48
        ws_sum.cell(row=seg_row, column=1, value="Distribuição de Segmentos (todas as categorias)").font = Font(
            name="Arial", size=10, bold=True
        )
        seg_labels = ["Micro", "Small", "Medium", "Large"]
        seg_keys = ["micro", "small", "medium", "large"]
        for i, (label, key) in enumerate(zip(seg_labels, seg_keys)):
            ws_sum.cell(row=seg_row + 1 + i, column=1, value=label).font = BASE_FONT
            ws_sum.cell(row=seg_row + 1 + i, column=2, value=segment_totals[key]).font = BASE_FONT

        chart3 = PieChart()
        chart3.title = "Distribuição de Segmentos"
        data3 = Reference(ws_sum, min_col=2, min_row=seg_row + 1, max_row=seg_row + 4)
        cats3 = Reference(ws_sum, min_col=1, min_row=seg_row + 1, max_row=seg_row + 4)
        chart3.add_data(data3)
        chart3.set_categories(cats3)
        chart3.dataLabels = DataLabelList()
        chart3.dataLabels.showPercent = True
        chart3.width = 14
        chart3.height = 11
        ws_sum.add_chart(chart3, f"D{seg_row}")

    wb.save(out_path)
    return out_path, summary_rows


def main():
    folder = sys.argv[1] if len(sys.argv) > 1 else "data"
    if len(sys.argv) > 2:
        out_path = sys.argv[2]
    else:
        stamp = datetime.now().strftime("%Y%m%d_%H%M")
        out_path = f"relatorio_chapeco_{stamp}.xlsx"

    if not os.path.isdir(folder):
        print(f"Pasta não encontrada: {folder}")
        sys.exit(1)

    files_by_slug = discover_files(folder)
    if not files_by_slug:
        print(f"Nenhum CSV encontrado em {folder}")
        sys.exit(1)

    print(f"Encontradas {len(files_by_slug)} categorias:")
    for slug, path in files_by_slug.items():
        print(f"  - {friendly_name(slug)}: {os.path.basename(path)}")

    out_path, summary = build_workbook(files_by_slug, out_path)
    print(f"\nPlanilha gerada: {out_path}")


if __name__ == "__main__":
    main()
