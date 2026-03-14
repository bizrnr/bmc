#!/usr/bin/env node

/**
 * Setup database tables for BMC (BizRnR Mission Control)
 * 
 * Creates the dashboard_users table if it doesn't exist
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('Setting up BMC database...');

  // Check if table exists by trying to query it
  const { error: checkError } = await supabase
    .from('dashboard_users')
    .select('id')
    .limit(1);

  if (checkError && checkError.code === '42P01') {
    console.log('Creating dashboard_users table...');
    
    // Table doesn't exist, create it using raw SQL
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS dashboard_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'viewer',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_dashboard_users_email ON dashboard_users(email);
      `
    });

    if (createError) {
      console.error('❌ Error creating table:', createError.message);
      console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
      console.log(`
CREATE TABLE IF NOT EXISTS dashboard_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_users_email ON dashboard_users(email);
      `);
      process.exit(1);
    }

    console.log('✅ Table created successfully');
  } else {
    console.log('✅ Table already exists');
  }

  console.log('\nNext steps:');
  console.log('1. Create an admin user:');
  console.log('   node scripts/create-admin.js admin@example.com yourpassword');
}

setupDatabase();
