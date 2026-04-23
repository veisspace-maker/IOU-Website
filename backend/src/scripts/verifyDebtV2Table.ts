import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function verifyDebtV2Table() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'company_tracker',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });
  
  const client = await pool.connect();
  
  try {
    console.log('Verifying debt_transactions_v2 table...\n');
    
    // Check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'debt_transactions_v2'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.error('❌ Table debt_transactions_v2 does not exist!');
      return;
    }
    
    console.log('✓ Table exists');
    
    // Get table structure
    const columns = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'debt_transactions_v2'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nTable columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Get constraints
    const constraints = await client.query(`
      SELECT
        con.conname as constraint_name,
        con.contype as constraint_type,
        pg_get_constraintdef(con.oid) as constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'debt_transactions_v2';
    `);
    
    console.log('\nConstraints:');
    constraints.rows.forEach(con => {
      const typeMap: Record<string, string> = {
        'p': 'PRIMARY KEY',
        'c': 'CHECK',
        'f': 'FOREIGN KEY',
        'u': 'UNIQUE'
      };
      const type = typeMap[con.constraint_type] || con.constraint_type;
      console.log(`  - ${con.constraint_name} (${type}): ${con.constraint_definition}`);
    });
    
    // Get indexes
    const indexes = await client.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'debt_transactions_v2';
    `);
    
    console.log('\nIndexes:');
    indexes.rows.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
      console.log(`    ${idx.indexdef}`);
    });
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run verification
verifyDebtV2Table()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
