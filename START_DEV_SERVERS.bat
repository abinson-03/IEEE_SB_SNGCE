@echo off
title IEEE SB SNGCE Portal Dev Servers
cd /d "%~dp0"
echo ===================================================
echo   Starting IEEE SB SNGCE Portal (Full-Stack MERN)
echo ===================================================
echo Backend Server: http://localhost:5000
echo Frontend Client: http://localhost:3000
echo MongoDB: mongodb://localhost:27017/ieee_sb_portal
echo ===================================================
npm run dev
pause
