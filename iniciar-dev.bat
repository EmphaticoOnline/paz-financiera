@echo off
REM Script para iniciar frontend y backend en ventanas separadas



@echo off
REM Script para iniciar frontend y backend en ventanas separadas

REM Verificar si el puerto 5175 (frontend) está en uso
netstat -ano | findstr ":5175" >nul
if %errorlevel%==0 (
	echo El puerto 5175 ya está en uso. No se iniciará el frontend.
) else (
	start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
	REM Abrir navegador en el frontend
	start "Abrir navegador" "http://localhost:5175"
)

REM Verificar si el puerto 4000 (backend) está en uso
netstat -ano | findstr ":4000" >nul
if %errorlevel%==0 (
	echo El puerto 4000 ya está en uso. No se iniciará el backend.
) else (
	start "Backend" cmd /k "cd /d %~dp0backend && npm run dev"
)

echo Script finalizado.
pause
