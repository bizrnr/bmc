import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCached } from '@/lib/cache';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  try {
    const data = await getCached('pipeline:stats', async () => {
      const { data: leads, error } = await supabase
        .from('crm_leads')
        .select('stage, deal_value, temperature, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const stages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
      const statsByStage: { [key: string]: { count: number; value: number; hot: number } } = {};

      stages.forEach(stage => {
        statsByStage[stage] = { count: 0, value: 0, hot: 0 };
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let newLeadsToday = 0;

      leads?.forEach(lead => {
        const stage = lead.stage || 'New';
        if (statsByStage[stage]) {
          statsByStage[stage].count++;
          statsByStage[stage].value += lead.deal_value || 0;
          if (lead.temperature === 'hot') {
            statsByStage[stage].hot++;
          }
        }

        if (new Date(lead.created_at) >= today) {
          newLeadsToday++;
        }
      });

      const activeStages = stages.filter(s => s !== 'Won' && s !== 'Lost');
      const totalPipelineValue = activeStages.reduce(
        (sum, stage) => sum + statsByStage[stage].value,
        0
      );

      return {
        byStage: statsByStage,
        totalPipelineValue,
        totalLeads: leads?.length || 0,
        newLeadsToday,
        wonValue: statsByStage['Won'].value,
        wonCount: statsByStage['Won'].count,
        lastUpdated: new Date().toISOString(),
      };
    }, 300);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[pipeline/stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline stats' },
      { status: 500 }
    );
  }
}
