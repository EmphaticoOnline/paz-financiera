@echo off
REM Script para cerrar los servidores frontend (5175) y backend (4000)

REM Buscar y terminar proceso en el puerto 5175 (frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5175"') do (
    echo Terminando proceso en puerto 5175 (PID: %%a)
    taskkill /PID %%a /F
)

REM Buscar y terminar proceso en el puerto 4000 (backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4000"') do (
    echo Terminando proceso en puerto 4000 (PID: %%a)
    taskkill /PID %%a /F
)

echo Procesos finalizados.
pause
