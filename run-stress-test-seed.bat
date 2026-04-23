@echo off
echo Running stress test data seeding...
cd backend
call npx tsx src/scripts/seedStressTestData.ts
cd ..
echo.
echo Done! Press any key to exit...
pause > nul
