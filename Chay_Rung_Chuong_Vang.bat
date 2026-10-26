@echo off
title Rung Chuong Vang - Game Server
cd /d "D:\RungChuongVang2"

echo ===================================================
echo     DANG KHOI DONG HE THONG RUNG CHUONG VANG...
echo ===================================================
echo.

:: Giai phong cong 3000 neu co tien trinh cu dang chiem
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: Tien trinh ngam cho server san sang roi moi tu dong mo web
start "" powershell -NoProfile -Command "$p=3000; while (-not (Test-NetConnection -ComputerName 127.0.0.1 -Port $p -WarningAction SilentlyContinue).TcpTestSucceeded) { Start-Sleep -Milliseconds 400 }; Start-Process 'http://localhost:3000'"

echo [*] Dang khoi dong may chu Next.js & Socket.IO...
echo [*] Trinh duyet se TU DONG MO len khi may chu san sang!
echo.
echo (Luu y: Giu nguyen cua so nay trong suot thoi gian su dung)
echo ===================================================
echo.

npm run dev

pause
