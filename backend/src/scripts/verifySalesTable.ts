import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function verifySalesTable() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'company_tracker',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });
  
  const client = await pool.connect();
  
  try {
    console.log('Verifying sales_transactions table structure...\n');
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sales_transactions'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('❌ Table sales_transactions does not exist!');
      process.exit(1);
    }
    
    console.log('✓ Table sales_transactions exists');
    
    // Get column information
    const columns = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'sales_transactions'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(nullable)'}`);
    });
    
    // Get indexes
    const indexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'sales_transactions'
      ORDER BY indexname;
    `);
    
    console.log('\n📊 Indexes:');
    indexes.rows.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
    });
    
    // Get constraints
    const constraints = await client.query(`
      SELECT 
        con.conname as constraint_name,
        con.contype as constraint_type
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'sales_transactions';
    `);
    
    console.log('\n🔒 Constraints:');
    constraints.rows.forEach(con => {
      const typeMap: Record<string, string> = {
        'p': 'PRIMARY KEY',
        'f': 'FOREIGN KEY',
        'c': 'CHECK',
        'u': 'UNIQUE'
      };
      const type = typeMap[con.constraint_type] || con.constraint_type;
      console.log(`  - ${con.constraint_name}: ${type}`);
    });
    
    // Verify required fields match spec
    const requiredFields = ['id', 'item', 'price', 'date', 'description', 'created_by'];
    const actualFields = columns.rows.map(col => col.column_name);
    
    console.log('\n✅ Verification Results:');
    requiredFields.forEach(field => {
      if (actualFields.includes(field)) {
        console.log(`  ✓ ${field} field exists`);
      } else {
        console.log(`  ✗ ${field} field MISSING`);
      }
    });
    
    // Check indexes
    const requiredIndexes = ['id', 'created_by'];
    const actualIndexNames = indexes.rows.map(idx => idx.indexname);
    
    console.log('\n✅ Index Verification:');
    requiredIndexes.forEach(field => {
      const hasIndex = actualIndexNames.some(name => name.includes(field));
      if (hasIndex) {
        console.log(`  ✓ Index on ${field} exists`);
      } else {
        console.log(`  ✗ Index on ${field} MISSING`);
      }
    });
    
    console.log('\n✅ Table verification complete!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run verification
verifySalesTable()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
