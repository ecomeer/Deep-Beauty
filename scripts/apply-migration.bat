@echo off
chcp 65001 >nul
echo.
echo ================================================
echo   Deep Beauty - Apply Marketing Migration
echo ================================================
echo.

REM Try to use Supabase CLI if available
where supabase >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo [ℹ] Supabase CLI found, attempting to apply migration...
    supabase db push
    if %ERRORLEVEL% == 0 (
        echo [✅] Migration applied successfully via CLI!
        goto :done
    ) else (
        echo [⚠] CLI push failed, falling back to manual method...
    )
)

REM Check for Node.js
where node >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo [ℹ] Attempting to apply via Node.js script...
    node "%~dp0apply-migration-simple.mjs" 2>nul
    if %ERRORLEVEL% == 0 (
        goto :done
    )
)

echo.
echo [📋] Manual Application Required
echo.
echo Please follow these steps to apply the migration:
echo.
echo 1. Open Supabase Studio in your browser
echo    https://supabase.com/dashboard
echo.
echo 2. Select your Deep Beauty project
echo.
echo 3. Go to: SQL Editor ^> New query
echo.
echo 4. Open and copy the SQL from:
echo    %~dp0..\supabase\apply-marketing-campaigns.sql
echo.
echo 5. Paste in SQL Editor and click "Run"
echo.
echo 6. Verify the table was created:
echo    SELECT * FROM marketing_campaigns LIMIT 1;
echo.

REM Try to open the file for easy copy
if exist "%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe" (
    echo [💻] Opening SQL file in VS Code...
    start "" "%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe" "%~dp0..\supabase\apply-marketing-campaigns.sql"
) else (
    echo [📄] SQL file location:
    echo    %~dp0..\supabase\apply-marketing-campaigns.sql
)

:done
echo.
pause
