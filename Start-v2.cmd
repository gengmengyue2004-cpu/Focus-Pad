@echo off
cd /d "%~dp0"
set ELECTRON_RUN_AS_NODE=
start "Focus Pad v2" "%~dp0.runtime\electron.exe" .

