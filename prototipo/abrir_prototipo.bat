@echo off
rem Abre o prototipo num servidor local (o 3D precisa de http).
cd /d "%~dp0"
start "" http://127.0.0.1:8800/
python -m http.server 8800 --bind 127.0.0.1
