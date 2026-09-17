@echo off
echo ========================================================
echo  GERANDO RELATORIO CONSOLIDADO - IMPRIMA COOPER
echo ========================================================
echo.

REM Verifica se as bibliotecas necessarias estao instaladas
python -c "import pandas, openpyxl" 2>nul
if errorlevel 1 (
    echo Instalando dependencias necessarias ^(pandas, openpyxl^)...
    pip install pandas openpyxl
)

echo.
echo Lendo CSVs da pasta data\ e gerando planilha...
echo.

python gerar_relatorio.py data relatorio_chapeco.xlsx

echo.
echo ========================================================
echo  CONCLUIDO! Abra relatorio_chapeco.xlsx
echo ========================================================
pause
