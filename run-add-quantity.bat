@echo off
echo Running migration to add quantity column to sales_transactions...
cd backend
call npx tsx src/scripts/addQuantityToSalesTransactions.ts
cd ..
echo Migration complete!
pause
