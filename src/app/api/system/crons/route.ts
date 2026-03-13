import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getCached } from '@/lib/cache';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const data = await getCached('system:crons', async () => {
      const { stdout } = await execAsync('openclaw cron list --json');
      const crons = JSON.parse(stdout);

      let errorCount = 0;
      const failing: any[] = [];

      crons.forEach((cron: any) => {
        if (cron.status === 'error' || cron.lastStatus === 'error') {
          errorCount++;
          failing.push(cron);
        }
      });

      return {
        crons,
        total: crons.length,
        active: crons.filter((c: any) => c.enabled).length,
        errorCount,
        failing,
        lastUpdated: new Date().toISOString(),
      };
    }, 30);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[system/crons] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cron jobs' },
      { status: 500 }
    );
  }
}
