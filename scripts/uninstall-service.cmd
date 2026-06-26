@echo off
setlocal
set SERVICE_NAME=Solomon Agent

echo Stopping and removing Solomon Agent service...
sc stop "%SERVICE_NAME%"
sc delete "%SERVICE_NAME%"
pause
