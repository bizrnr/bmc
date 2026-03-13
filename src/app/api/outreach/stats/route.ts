import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCached } from '@/lib/cache';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  try {
    const data = await getCached('outreach:stats', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: activities, error } = await supabase
        .from('crm_activities')
        .select('type, status, created_at, lead_id')
        .gte('created_at', today.toISOString());

      if (error) throw error;

      const stats = {
        email: { sent: 0, delivered: 0, opened: 0, replied: 0, bounced: 0 },
        sms: { sent: 0, delivered: 0, replied: 0 },
        calls: { made: 0, connected: 0, voicemail: 0 },
        whatsapp: { sent: 0, delivered: 0, replied: 0 },
      };

      activities?.forEach(activity => {
        if (activity.type === 'email') {
          stats.email.sent++;
          if (activity.status === 'delivered') stats.email.delivered++;
          if (activity.status === 'opened') stats.email.opened++;
          if (activity.status === 'replied') stats.email.replied++;
          if (activity.status === 'bounced') stats.email.bounced++;
        } else if (activity.type === 'sms') {
          stats.sms.sent++;
          if (activity.status === 'delivered') stats.sms.delivered++;
          if (activity.status === 'replied') stats.sms.replied++;
        } else if (activity.type === 'call') {
          stats.calls.made++;
          if (activity.status === 'connected') stats.calls.connected++;
          if (activity.status === 'voicemail') stats.calls.voicemail++;
        } else if (activity.type === 'whatsapp') {
          stats.whatsapp.sent++;
          if (activity.status === 'delivered') stats.whatsapp.delivered++;
          if (activity.status === 'replied') stats.whatsapp.replied++;
        }
      });

      const emailResponseRate = stats.email.sent > 0 
        ? (stats.email.replied / stats.email.sent) * 100 
        : 0;
      const smsResponseRate = stats.sms.sent > 0 
        ? (stats.sms.replied / stats.sms.sent) * 100 
        : 0;
      const callConnectRate = stats.calls.made > 0 
        ? (stats.calls.connected / stats.calls.made) * 100 
        : 0;

      const { data: hotLeads } = await supabase
        .from('crm_leads')
        .select('id')
        .eq('temperature', 'hot');

      const hotLeadIds = new Set(hotLeads?.map(l => l.id) || []);
      const touchedHotLeads = new Set(
        activities?.filter(a => hotLeadIds.has(a.lead_id)).map(a => a.lead_id)
      );

      return {
        channels: stats,
        responseRates: {
          email: Math.round(emailResponseRate),
          sms: Math.round(smsResponseRate),
          callConnect: Math.round(callConnectRate),
        },
        hotLeadCompliance: {
          total: hotLeadIds.size,
          touched: touchedHotLeads.size,
        },
        lastUpdated: new Date().toISOString(),
      };
    }, 300);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[outreach/stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outreach stats' },
      { status: 500 }
    );
  }
}
