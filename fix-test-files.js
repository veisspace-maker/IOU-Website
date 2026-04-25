const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/api/salesApi.test.ts',
  'frontend/src/components/DrillDownView.test.tsx',
  'frontend/src/components/ItemBreakdownTable.test.tsx',
  'frontend/src/components/ItemFilter.test.tsx',
  'frontend/src/components/SalesStatsCards.test.tsx',
  'frontend/src/components/SalesTransactionList.test.tsx',
  'frontend/src/pages/SalesPage.test.tsx',
  'frontend/src/utils/salesUtils.test.ts'
];

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add quantity and seller fields after price field
    content = content.replace(/(\s+price:\s*\d+,)\s+(date:)/g, '$1\n      quantity: 1,\n      seller: \'seller1\',\n      $2');
    content = content.replace(/(\s+price:\s*number,)\s+(date:)/g, '$1\n      quantity: 1,\n      seller: \'seller1\',\n      $2');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed ${file}`);
  } catch (error) {
    console.error(`Error fixing ${file}:`, error.message);
  }
});

console.log('Done!');
