#!/usr/bin/env node

/**
 * Log activity to the BMC API
 * 
 * Usage: node api-server/log-activity.js "Task description" [agent] [status]
 */

import fetch from 'node-fetch';

const API_URL = process.env.DASHBOARD_API_URL || 'http://localhost:3001';
const API_TOKEN = process.env.DASHBOARD_API_TOKEN || 'bmc-token-2026';

async function logActivity(description, agent = 'bri', status = 'completed') {
  try {
    const response = await fetch(`${API_URL}/api/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({
        type: 'task',
        description,
        agent,
        status,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('Failed to log activity:', await response.text());
      process.exit(1);
    }

    console.log('✅ Activity logged');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const [description, agent, status] = process.argv.slice(2);

if (!description) {
  console.error('Usage: node api-server/log-activity.js "Task description" [agent] [status]');
  process.exit(1);
}

logActivity(description, agent, status);
