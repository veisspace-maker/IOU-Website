@echo off
echo Running reasonable test data seeding...
cd backend
call npx tsx src/scripts/seedReasonableTestData.ts
cd ..
echo.
echo Done! Press any key to exit...
pause > nul
