@echo off
REM ==============================================================================
REM One-Click Launcher for Smart Traffic & Fuel Prediction System (Windows)
REM Double-click this file or run 'run.bat' in Command Prompt or PowerShell
REM ==============================================================================
title Smart Traffic & Fuel Prediction System

echo Checking Python installation...
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python was not found in PATH!
    echo Please download and install Python 3.10+ from https://www.python.org
    echo Make sure to check the box "Add Python to PATH" during installation.
    pause
    exit /b 1
)

python run.py %*
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo System encountered an error. Press any key to exit.
    pause
)
