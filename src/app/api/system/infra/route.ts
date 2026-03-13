import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getCached } from '@/lib/cache';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const data = await getCached('system:infra', async () => {
      // Get memory stats
      const { stdout: memOutput } = await execAsync('free -m');
      const memLines = memOutput.split('\n')[1].split(/\s+/);
      const totalMem = parseInt(memLines[1]);
      const usedMem = parseInt(memLines[2]);
      const memPercent = (usedMem / totalMem) * 100;

      // Get disk stats
      const { stdout: diskOutput } = await execAsync('df -h / | tail -1');
      const diskParts = diskOutput.split(/\s+/);
      const diskUsed = diskParts[2];
      const diskTotal = diskParts[1];
      const diskPercent = parseInt(diskParts[4]);

      // Get uptime
      const { stdout: uptimeOutput } = await execAsync('uptime -p');
      const uptime = uptimeOutput.trim().replace('up ', '');

      // Get CPU load
      const { stdout: loadOutput } = await execAsync('uptime');
      const loadMatch = loadOutput.match(/load average: ([\d.]+)/);
      const cpuLoad = loadMatch ? parseFloat(loadMatch[1]) : 0;

      return {
        memory: {
          used: usedMem,
          total: totalMem,
          percent: Math.round(memPercent),
        },
        disk: {
          used: diskUsed,
          total: diskTotal,
          percent: diskPercent,
        },
        cpu: {
          load: cpuLoad,
          cores: 8, // From specs
        },
        uptime,
        lastUpdated: new Date().toISOString(),
      };
    }, 30);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[system/infra] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch infrastructure stats' },
      { status: 500 }
    );
  }
}
