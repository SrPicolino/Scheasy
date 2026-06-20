@echo off
setlocal
title Scheasy v3.0 SaaS - Sistema Multi-Barbearia
color 0B

echo =======================================================
echo                 SCHEASY v3.0 SaaS
echo       PLATAFORMA MULTI-BARBEARIA PROFISSIONAL
echo =======================================================
echo.

set PROJECT_ROOT=%~dp0
set BACKEND_DIR=%PROJECT_ROOT%backend
set FRONTEND_DIR=%PROJECT_ROOT%frontend

:: Verificar e instalar dependências
echo [1/4] Verificando dependências...
if not exist "%BACKEND_DIR%\node_modules" (
    echo [INFO] Instalando dependências do Backend...
    cd /d "%BACKEND_DIR%" && call npm.cmd install
)

if not exist "%FRONTEND_DIR%\node_modules" (
    echo [INFO] Instalando dependências do Frontend...
    cd /d "%FRONTEND_DIR%" && call npm.cmd install
)

:: Sincronizar e popular Banco de Dados
echo [2/4] Sincronizando e populando Banco de Dados...
cd /d "%BACKEND_DIR%"
call npx.cmd prisma generate
call npx.cmd prisma db push --skip-generate
:: Executa o seed para garantir que existam serviços e barbeiros cadastrados
call npm.cmd run seed

:: Iniciar o Backend
echo [3/4] Iniciando Servidor Backend (Porta 3001)...
start "BACKEND - Barbershop v2.0" cmd /c "cd /d %BACKEND_DIR% && npm.cmd run dev"

:: Iniciar o Frontend
echo [4/4] Iniciando Interface Frontend (Porta 5173)...
start "FRONTEND - Barbershop v2.0" cmd /c "cd /d %FRONTEND_DIR% && npm.cmd run dev"

:: Aguardar um momento e abrir o navegador
echo.
echo [OK] Aguardando inicialização para abrir o navegador...
timeout /t 5 /nobreak >nul
start http://localhost:5173/demo

echo.
echo -------------------------------------------------------
echo SISTEMA INICIADO COM SUCESSO! (SaaS v3.0)
echo.
echo - Barbearia Demo:  http://localhost:5173/demo
echo - Admin (Demo):    http://localhost:5173/admin
echo.
echo Para adicionar uma nova barbearia:
echo   Use a API POST /api/barbershops com { name, slug }
echo   Acesse pelo link: http://localhost:5173/SEU-SLUG
echo -------------------------------------------------------
echo.
echo Pressione qualquer tecla para sair desta janela.
pause >nul
endlocal
