import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCached } from '@/lib/cache';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  try {
    const data = await getCached('leads:velocity', async () => {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: leads, error } = await supabase
        .from('crm_leads')
        .select('created_at, lead_score, temperature, email, phone, website, industry')
        .gte('created_at', last24h)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by hour
      const hourlyData: { [hour: string]: number } = {};
      const scoreDistribution: { [score: number]: number } = {};
      
      let emailCount = 0;
      let phoneCount = 0;
      let fullyEnriched = 0;

      leads?.forEach(lead => {
        const hour = new Date(lead.created_at).getHours();
        hourlyData[hour] = (hourlyData[hour] || 0) + 1;

        const score = lead.lead_score || 0;
        scoreDistribution[score] = (scoreDistribution[score] || 0) + 1;

        if (lead.email) emailCount++;
        if (lead.phone) phoneCount++;
        if (lead.email && lead.phone && lead.website && lead.industry) {
          fullyEnriched++;
        }
      });

      const total = leads?.length || 0;
      const emailCoverage = total > 0 ? (emailCount / total) * 100 : 0;
      const phoneCoverage = total > 0 ? (phoneCount / total) * 100 : 0;
      const enrichmentHealth = total > 0 ? (fullyEnriched / total) * 100 : 0;

      return {
        hourlyData,
        scoreDistribution,
        totalLast24h: total,
        emailCoverage: Math.round(emailCoverage),
        phoneCoverage: Math.round(phoneCoverage),
        enrichmentHealth: Math.round(enrichmentHealth),
        lastUpdated: new Date().toISOString(),
      };
    }, 300);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[leads/velocity] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead velocity' },
      { status: 500 }
    );
  }
}
