@echo off
echo Clearing all stress test data...
cd backend
call npx tsx src/scripts/clearStressTestData.ts
cd ..
echo.
echo Done! Press any key to exit...
pause > nul
