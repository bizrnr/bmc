import { NextResponse } from 'next/server';
import { createClient } from 'redis';
import { getCached } from '@/lib/cache';

export async function GET() {
  try {
    const data = await getCached('system:bullmq', async () => {
      const redis = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });
      await redis.connect();

      const queues = ['general', 'voice', 'email', 'sms', 'webhook', 'enrichment'];
      const stats: any = {};

      for (const queue of queues) {
        const waiting = await redis.lLen(`bull:${queue}:wait`);
        const active = await redis.lLen(`bull:${queue}:active`);
        const completed = await redis.zCard(`bull:${queue}:completed`);
        const failed = await redis.zCard(`bull:${queue}:failed`);

        stats[queue] = { waiting, active, completed, failed };
      }

      await redis.quit();

      const totalPending = Object.values(stats).reduce((sum: number, q: any) => sum + q.waiting, 0);
      const totalActive = Object.values(stats).reduce((sum: number, q: any) => sum + q.active, 0);
      const totalFailed = Object.values(stats).reduce((sum: number, q: any) => sum + q.failed, 0);

      return {
        queues: stats,
        totals: { pending: totalPending, active: totalActive, failed: totalFailed },
        lastUpdated: new Date().toISOString(),
      };
    }, 30);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[system/bullmq] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch BullMQ stats' },
      { status: 500 }
    );
  }
}
