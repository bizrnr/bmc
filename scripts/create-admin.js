#!/usr/bin/env node

/**
 * Create admin users for BMC (BizRnR Mission Control)
 * 
 * Usage: node scripts/create-admin.js <email> <password>
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
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

async function createAdmin(email, password) {
  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const { data, error } = await supabase
      .from('dashboard_users')
      .insert({
        email,
        password_hash: passwordHash,
        role: 'admin',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        console.error('❌ User already exists');
      } else {
        console.error('❌ Error creating user:', error.message);
      }
      process.exit(1);
    }

    console.log('✅ Admin user created:', data.email);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.js <email> <password>');
  process.exit(1);
}

createAdmin(email, password);
