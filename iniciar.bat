@echo off
echo Abriendo servidor en http://localhost:8080
python -m http.server 8080 -d "%~dp0"
pause
