@echo off
echo Running migration to add seller column to sales_transactions...
cd backend
call npx tsx src/scripts/addSellerToSalesTransactions.ts
pause
