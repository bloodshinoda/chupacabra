@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================================
echo  O MAGNÍFICO CHUPA CABRA - IMPRIMA COOPER
echo  Prospecção de clientes em potencial - Oeste de SC
echo ========================================================

if not exist data mkdir data
if not exist logs mkdir logs

set LANG=pt
set COUNTRY=br
set LIMIT=1000

REM Intervalo aleatorio (em segundos) entre uma consulta e outra.
REM Um valor variavel deixa o padrao de acesso menos previsivel pro Google
REM do que um timeout fixo sempre igual.
set WAIT_MIN=15
set WAIT_MAX=35

REM -----------------------------------------------------------------
REM CATEGORIAS — clientes em potencial da ImprimaCooper
REM Formato: slug|Texto_da_busca_com_underscore_no_lugar_de_espaco
REM Para adicionar uma categoria nova: crie a proxima linha CAT[n] e
REM aumente o COUNT_CAT. Para desativar uma, comente com REM e diminua
REM o COUNT_CAT (ou reordene os indices).
REM -----------------------------------------------------------------
set "CAT[1]=agencias_publicidade|Agencias_de_publicidade"
set "CAT[2]=graficas|Graficas"
set "CAT[3]=graficas_rapidas|Grafica_rapida"
set "CAT[4]=comunicacao_visual|Comunicacao_visual"
set "CAT[5]=marketing_digital|Agencias_de_marketing_digital"
set "CAT[6]=brindes_corporativos|Brindes_corporativos"
set "CAT[7]=eventos_corporativos|Organizacao_de_eventos_corporativos"
set "CAT[8]=serigrafia_estamparia|Serigrafia_e_estamparia"
set "CAT[9]=imobiliarias|Imobiliarias"
set "CAT[10]=concessionarias|Concessionarias_de_veiculos"
set "CAT[11]=construtoras|Construtoras"
set "CAT[12]=clinicas_odontologicas|Clinicas_odontologicas"
set COUNT_CAT=12

REM Categorias adicionais prontas, so descomentar as linhas abaixo
REM (tirar o "REM " do inicio) e ajustar COUNT_CAT para 18:
REM set "CAT[13]=escritorios_advocacia|Escritorios_de_advocacia"
REM set "CAT[14]=academias|Academias"
REM set "CAT[15]=supermercados|Supermercados"
REM set "CAT[16]=escolas_particulares|Escolas_particulares"
REM set "CAT[17]=restaurantes|Restaurantes"
REM set "CAT[18]=distribuidoras|Distribuidoras_e_atacadistas"

REM -----------------------------------------------------------------
REM CIDADES — Chapeco + vizinhas (Oeste de SC)
REM Mesma logica: adicionar CID[n] novo e aumentar COUNT_CID.
REM -----------------------------------------------------------------
set "CID[1]=Chapeco"
set "CID[2]=Xanxere"
set "CID[3]=Concordia"
set COUNT_CID=3

REM Cidades adicionais prontas (descomentar + COUNT_CID=5):
REM set "CID[4]=Xaxim"
REM set "CID[5]=Pinhalzinho"

set /a TOTAL=%COUNT_CID%*%COUNT_CAT%
set /a STEP=0

REM Gera o "backspace" usado pra atualizar a contagem regressiva na mesma linha
for /f %%a in ('"prompt $H &echo on&for %%b in (1) do rem"') do set "BACKSPACE=%%a"

echo  Total de consultas: %TOTAL% ^(%COUNT_CID% cidade(s^) x %COUNT_CAT% categoria(s^)^)
echo ========================================================

for /l %%i in (1,1,%COUNT_CID%) do (
    for /l %%j in (1,1,%COUNT_CAT%) do (
        for /f "tokens=1,2 delims=|" %%A in ("!CAT[%%j]!") do (
            set "SLUG=%%A"
            set "QTEXT=%%B"
        )
        set "QTEXT=!QTEXT:_= !"
        set "CIDADE=!CID[%%i]!"
        set "QUERY=!QTEXT! em !CIDADE! SC"
        set "FULLSLUG=!CIDADE!_!SLUG!"
        call :run_categoria "!QUERY!" "!FULLSLUG!"
    )
)

echo ========================================================
echo  EXTRAÇÃO CONCLUÍDA COM SUCESSO!
echo  As planilhas enriquecidas estão na pasta data\.
echo  Os logs de cada categoria estão na pasta logs\.
echo ========================================================

if exist gerar_relatorio.py (
    echo.
    echo Gerando planilha consolidada com graficos...
    python gerar_relatorio.py data
    echo Planilha consolidada gerada — confira o arquivo relatorio_chapeco_*.xlsx
) else (
    echo.
    echo [AVISO] gerar_relatorio.py nao encontrado nesta pasta — planilha
    echo consolidada nao foi gerada. Copie o script pra cá e rode de novo,
    echo ou rode "python gerar_relatorio.py data" manualmente.
)

echo ========================================================
pause
goto :eof

:run_categoria
set /a STEP+=1
set "QUERY=%~1"
set "SLUG=%~2"

echo.
echo [!STEP!/%TOTAL%] Buscando: %QUERY%

python main.py --mode full "%QUERY%" --limit %LIMIT% --lang %LANG% --country %COUNTRY% --log-level DEBUG > "logs\%SLUG%.log" 2>&1

if errorlevel 1 (
    echo   [ERRO] A extração de "%QUERY%" falhou. Veja logs\%SLUG%.log
) else (
    if exist data\output.csv move /y data\output.csv "data\%SLUG%_raw.csv" >nul
    if exist data\output_enriched.csv move /y data\output_enriched.csv "data\%SLUG%.csv" >nul
    echo   OK - resultado salvo em data\%SLUG%.csv
)

if !STEP! LSS %TOTAL% (
    set /a "WAIT_SECONDS=%WAIT_MIN% + (!RANDOM! %% (%WAIT_MAX%-%WAIT_MIN%+1))"
    call :esperar !WAIT_SECONDS!
)

goto :eof

:esperar
set /a SEG=%~1
for /l %%s in (%SEG%,-1,1) do (
    <nul set /p "=   Aguardando %%s segundo(s^) antes da proxima consulta...          "
    timeout /t 1 /nobreak >nul
    for /l %%c in (1,1,90) do <nul set /p "=%BACKSPACE%"
)
echo.
goto :eof
