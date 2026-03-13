import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCached } from '@/lib/cache';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
});

export async function GET() {
  try {
    const data = await getCached('revenue:mrr', async () => {
      const subscriptions = await stripe.subscriptions.list({
        status: 'active',
        limit: 100,
      });

      let totalMRR = 0;
      const breakdown: { [key: string]: number } = {};

      for (const sub of subscriptions.data) {
        for (const item of sub.items.data) {
          const price = item.price;
          const quantity = item.quantity || 1;
          
          if (price.recurring) {
            let monthlyAmount = price.unit_amount || 0;
            
            if (price.recurring.interval === 'year') {
              monthlyAmount = monthlyAmount / 12;
            }
            
            totalMRR += monthlyAmount * quantity;
            
            const key = price.nickname || price.id;
            breakdown[key] = (breakdown[key] || 0) + monthlyAmount * quantity;
          }
        }
      }

      totalMRR = totalMRR / 100;
      Object.keys(breakdown).forEach(key => {
        breakdown[key] = breakdown[key] / 100;
      });

      return {
        mrr: totalMRR,
        activeSubscriptions: subscriptions.data.length,
        breakdown,
        currency: 'USD',
        lastUpdated: new Date().toISOString(),
      };
    }, 30);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[mrr] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MRR data' },
      { status: 500 }
    );
  }
}
