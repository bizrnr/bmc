import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCached } from '@/lib/cache';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  try {
    const data = await getCached('agents:performance', async () => {
      // Query agent_tasks table if it exists
      const { data: tasks, error } = await supabase
        .from('agent_tasks')
        .select('agent_id, agent_type, status, duration_ms, created_at, completed_at')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        // Table might not exist, return empty stats
        return {
          leaderboard: [],
          recentTasks: [],
          lastUpdated: new Date().toISOString(),
        };
      }

      // Aggregate by agent type
      const agentStats: { [key: string]: { 
        completed: number; 
        errors: number; 
        totalDuration: number;
        avgDuration: number;
      } } = {};

      tasks?.forEach(task => {
        const type = task.agent_type || 'unknown';
        if (!agentStats[type]) {
          agentStats[type] = { completed: 0, errors: 0, totalDuration: 0, avgDuration: 0 };
        }

        if (task.status === 'completed') {
          agentStats[type].completed++;
          agentStats[type].totalDuration += task.duration_ms || 0;
        } else if (task.status === 'error' || task.status === 'failed') {
          agentStats[type].errors++;
        }
      });

      // Calculate averages and error rates
      const leaderboard = Object.entries(agentStats).map(([agentType, stats]) => ({
        agentType,
        tasksCompleted: stats.completed,
        errorRate: stats.completed + stats.errors > 0 
          ? (stats.errors / (stats.completed + stats.errors)) * 100 
          : 0,
        avgDuration: stats.completed > 0 ? stats.totalDuration / stats.completed : 0,
      })).sort((a, b) => b.tasksCompleted - a.tasksCompleted);

      // Recent tasks
      const recentTasks = tasks?.slice(0, 50).map(task => ({
        id: task.agent_id,
        type: task.agent_type,
        status: task.status,
        duration: task.duration_ms,
        createdAt: task.created_at,
        completedAt: task.completed_at,
      })) || [];

      return {
        leaderboard,
        recentTasks,
        lastUpdated: new Date().toISOString(),
      };
    }, 300);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[agents/performance] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent performance' },
      { status: 500 }
    );
  }
}
