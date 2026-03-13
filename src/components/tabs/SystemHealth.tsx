'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function SystemHealth() {
  const { data: crons } = useSWR('/api/system/crons', fetcher, { refreshInterval: 30000 });
  const { data: bullmq } = useSWR('/api/system/bullmq', fetcher, { refreshInterval: 30000 });
  const { data: infra } = useSWR('/api/system/infra', fetcher, { refreshInterval: 30000 });
  const { data: costs } = useSWR('/api/costs/daily', fetcher, { refreshInterval: 300000 });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">System Health</h2>

      {/* Infrastructure Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="CPU Load"
          value={infra ? `${infra.cpu.load.toFixed(2)}` : '-'}
          subtitle={infra ? `${infra.cpu.cores} cores` : ''}
          alert={infra && infra.cpu.load > 4}
        />
        <MetricCard
          title="Memory"
          value={infra ? `${infra.memory.percent}%` : '-'}
          subtitle={infra ? `${infra.memory.used}MB / ${infra.memory.total}MB` : ''}
          alert={infra && infra.memory.percent > 80}
        />
        <MetricCard
          title="Disk"
          value={infra ? `${infra.disk.percent}%` : '-'}
          subtitle={infra ? `${infra.disk.used} / ${infra.disk.total}` : ''}
          alert={infra && infra.disk.percent > 85}
        />
        <MetricCard
          title="Uptime"
          value={infra?.uptime || '-'}
          subtitle="System uptime"
        />
      </div>

      {/* BullMQ Queues */}
      {bullmq && (
        <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
            BullMQ Job Queues
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(bullmq.queues).map(([queue, stats]: [string, any]) => (
              <div key={queue} className="bg-[var(--bg-primary)] rounded-lg p-3">
                <p className="text-xs text-[var(--text-muted)] mb-2 uppercase">{queue}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Waiting</span>
                    <span className="text-yellow-400">{stats.waiting}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Active</span>
                    <span className="text-blue-400">{stats.active}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Failed</span>
                    <span className={stats.failed > 0 ? 'text-red-400' : 'text-green-400'}>
                      {stats.failed}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">Totals:</span>
            <div className="flex gap-4">
              <span>Pending: <strong className="text-yellow-400">{bullmq.totals.pending}</strong></span>
              <span>Active: <strong className="text-blue-400">{bullmq.totals.active}</strong></span>
              <span>Failed: <strong className="text-red-400">{bullmq.totals.failed}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Cron Jobs */}
      {crons && (
        <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
            OpenClaw Cron Jobs ({crons.total})
          </h3>
          {crons.errorCount > 0 && (
            <div className="mb-3 p-2 bg-red-500/10 text-red-400 rounded-lg text-sm">
              ⚠️ {crons.errorCount} cron job(s) failing
            </div>
          )}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {crons.crons.slice(0, 10).map((cron: any) => (
              <div 
                key={cron.id} 
                className="flex items-center justify-between text-sm p-2 rounded bg-[var(--bg-primary)]"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    cron.status === 'error' ? 'bg-red-500' :
                    cron.enabled ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-[var(--text-primary)]">{cron.name || cron.id}</span>
                </div>
                <span className="text-xs text-[var(--text-muted)]">{cron.schedule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Costs */}
      {costs && (
        <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
            API Cost Tracking
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-2">Today</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Anthropic</span>
                  <span className="text-[var(--text-primary)]">${costs.daily.anthropic.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">ElevenLabs</span>
                  <span className="text-[var(--text-primary)]">${costs.daily.elevenlabs.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Twilio</span>
                  <span className="text-[var(--text-primary)]">${costs.daily.twilio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[var(--border-color)]">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold text-blue-400">${costs.daily.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-2">This Month</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Anthropic</span>
                  <span className="text-[var(--text-primary)]">${costs.monthly.anthropic.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">ElevenLabs</span>
                  <span className="text-[var(--text-primary)]">${costs.monthly.elevenlabs.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Twilio</span>
                  <span className="text-[var(--text-primary)]">${costs.monthly.twilio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[var(--border-color)]">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold text-blue-400">${costs.monthly.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  alert 
}: { 
  title: string; 
  value: string; 
  subtitle?: string; 
  alert?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 border ${
      alert 
        ? 'bg-red-500/10 border-red-500/30' 
        : 'bg-[var(--bg-card)] border-[var(--border-color)]'
    }`}>
      <p className="text-xs text-[var(--text-muted)] mb-1">{title}</p>
      <p className={`text-2xl font-bold ${alert ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
        {value}
      </p>
      {subtitle && <p className="text-xs text-[var(--text-muted)] mt-1">{subtitle}</p>}
    </div>
  );
}
