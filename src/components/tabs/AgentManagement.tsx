'use client';

import useSWR from 'swr';
import { formatDistanceToNow } from 'date-fns';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function AgentManagement() {
  const { data: performance } = useSWR('/api/agents/performance', fetcher, { refreshInterval: 30000 });
  const { data: status } = useSWR('/api/status', fetcher, { refreshInterval: 5000 });

  const activeAgents = status?.subAgents || [];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">Agent Management</h2>

      {/* Active Agents */}
      <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
          🤖 Active Agents ({activeAgents.length})
        </h3>
        {activeAgents.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm text-center py-4">No active agents</p>
        ) : (
          <div className="space-y-2">
            {activeAgents.map((agent: any) => (
              <div 
                key={agent.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-primary)]"
              >
                <div className={`w-3 h-3 rounded-full mt-1 ${
                  agent.status === 'active' ? 'bg-green-500 animate-pulse' :
                  agent.status === 'thinking' ? 'bg-yellow-500 animate-pulse' :
                  'bg-gray-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {agent.model || 'Unknown'}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {agent.uptime ? formatDuration(agent.uptime) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                    {agent.currentTask || 'Idle'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent Performance Leaderboard */}
      {performance?.leaderboard && performance.leaderboard.length > 0 && (
        <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
            🏆 Agent Performance Leaderboard
          </h3>
          <div className="space-y-2">
            {performance.leaderboard.map((agent: any, index: number) => (
              <div 
                key={agent.agentType}
                className="flex items-center gap-3 p-2 rounded bg-[var(--bg-primary)]"
              >
                <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊'}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {agent.agentType}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {agent.tasksCompleted} tasks • {agent.errorRate.toFixed(1)}% error rate • 
                    avg {(agent.avgDuration / 1000).toFixed(1)}s
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Task Log */}
      {performance?.recentTasks && performance.recentTasks.length > 0 && (
        <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
            📋 Recent Tasks (Last 50)
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {performance.recentTasks.slice(0, 20).map((task: any) => (
              <div 
                key={task.id}
                className="flex items-center justify-between text-sm p-2 rounded bg-[var(--bg-primary)]"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    task.status === 'completed' ? 'bg-green-500' :
                    task.status === 'error' || task.status === 'failed' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`} />
                  <span className="text-[var(--text-primary)]">{task.type}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  {task.duration && <span>{(task.duration / 1000).toFixed(1)}s</span>}
                  <span>{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Spawn Interface (placeholder) */}
      <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
          ⚡ Manual Agent Spawn
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Use the existing Agent Management panel below for spawning agents
        </p>
        <button 
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          onClick={() => alert('Navigate to Manage tab for full agent controls')}
        >
          Go to Agent Management Panel
        </button>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
