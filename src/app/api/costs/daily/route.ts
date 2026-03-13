import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCached } from '@/lib/cache';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  try {
    const data = await getCached('costs:daily', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: usage, error } = await supabase
        .from('api_usage_log')
        .select('provider, tokens, characters, cost, created_at')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        return {
          daily: { anthropic: 0, elevenlabs: 0, twilio: 0, total: 0 },
          monthly: { anthropic: 0, elevenlabs: 0, twilio: 0, total: 0 },
          lastUpdated: new Date().toISOString(),
        };
      }

      const costs = { anthropic: 0, elevenlabs: 0, twilio: 0 };

      usage?.forEach(u => {
        if (u.provider === 'anthropic') costs.anthropic += u.cost || 0;
        if (u.provider === 'elevenlabs') costs.elevenlabs += u.cost || 0;
        if (u.provider === 'twilio') costs.twilio += u.cost || 0;
      });

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: monthlyUsage } = await supabase
        .from('api_usage_log')
        .select('provider, cost')
        .gte('created_at', monthStart.toISOString());

      const monthlyCosts = { anthropic: 0, elevenlabs: 0, twilio: 0 };
      monthlyUsage?.forEach(u => {
        if (u.provider === 'anthropic') monthlyCosts.anthropic += u.cost || 0;
        if (u.provider === 'elevenlabs') monthlyCosts.elevenlabs += u.cost || 0;
        if (u.provider === 'twilio') monthlyCosts.twilio += u.cost || 0;
      });

      return {
        daily: { ...costs, total: costs.anthropic + costs.elevenlabs + costs.twilio },
        monthly: { 
          ...monthlyCosts, 
          total: monthlyCosts.anthropic + monthlyCosts.elevenlabs + monthlyCosts.twilio 
        },
        lastUpdated: new Date().toISOString(),
      };
    }, 300);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[costs/daily] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost data' },
      { status: 500 }
    );
  }
}
