@echo off
setlocal
set SERVICE_NAME=Solomon Agent
set EXE_PATH=%~dp0Solomon.Worker.exe

echo Installing Solomon Agent Windows Service...
sc create "%SERVICE_NAME%" binPath= "\"%EXE_PATH%\"" start= auto DisplayName= "Solomon Agent"
sc description "%SERVICE_NAME%" "Bridges cloud web app with local file-drop folder."
sc start "%SERVICE_NAME%"
echo.
echo Admin panel: http://127.0.0.1:5050/
pause
