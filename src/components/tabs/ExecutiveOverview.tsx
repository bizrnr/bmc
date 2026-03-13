'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function ExecutiveOverview() {
  const { data: mrr, error: mrrError } = useSWR('/api/revenue/mrr', fetcher, { refreshInterval: 30000 });
  const { data: pipeline, error: pipelineError } = useSWR('/api/pipeline/stats', fetcher, { refreshInterval: 30000 });
  const { data: system, error: systemError } = useSWR('/api/system/bullmq', fetcher, { refreshInterval: 30000 });
  const { data: crons, error: cronsError } = useSWR('/api/system/crons', fetcher, { refreshInterval: 30000 });
  const { data: costs, error: costsError } = useSWR('/api/costs/daily', fetcher, { refreshInterval: 300000 });

  const alerts: { type: 'error' | 'warning'; message: string }[] = [];
  
  if (crons?.errorCount > 0) {
    alerts.push({ type: 'error', message: `${crons.errorCount} cron job(s) failing` });
  }
  if (system?.totals.failed > 10) {
    alerts.push({ type: 'warning', message: `${system.totals.failed} failed BullMQ jobs` });
  }
  if (costs?.daily.total > 50) {
    alerts.push({ type: 'warning', message: `Daily API spend: $${costs.daily.total.toFixed(2)}` });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">Executive Overview</h2>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="MRR"
          value={mrr ? `$${mrr.mrr.toFixed(0)}` : '-'}
          subtitle={mrr ? `${mrr.activeSubscriptions} active` : ''}
          loading={!mrr && !mrrError}
          error={mrrError}
        />
        <MetricCard
          title="Pipeline Value"
          value={pipeline ? `$${Math.round(pipeline.totalPipelineValue / 1000)}K` : '-'}
          subtitle={pipeline ? `${pipeline.totalLeads} leads` : ''}
          loading={!pipeline && !pipelineError}
          error={pipelineError}
        />
        <MetricCard
          title="New Leads Today"
          value={pipeline?.newLeadsToday?.toString() || '-'}
          subtitle="Last 24h"
          loading={!pipeline && !pipelineError}
          error={pipelineError}
        />
        <MetricCard
          title="BullMQ Pending"
          value={system?.totals.pending?.toString() || '-'}
          subtitle={system ? `${system.totals.active} active` : ''}
          loading={!system && !systemError}
          error={systemError}
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">⚠️ Alerts</h3>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={`text-sm px-3 py-2 rounded-lg ${
                  alert.type === 'error'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-yellow-500/10 text-yellow-400'
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline by Stage */}
      {pipeline && (
        <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Pipeline by Stage</h3>
          <div className="space-y-2">
            {Object.entries(pipeline.byStage || {})
              .filter(([stage]) => !['Lost'].includes(stage))
              .map(([stage, stats]: [string, any]) => (
                <div key={stage} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-primary)]">{stage}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--text-muted)]">{stats.count} leads</span>
                    <span className="font-medium">${Math.round(stats.value / 1000)}K</span>
                  </div>
                </div>
              ))}
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
  loading, 
  error 
}: { 
  title: string; 
  value: string; 
  subtitle?: string; 
  loading?: boolean; 
  error?: any;
}) {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
      <p className="text-xs text-[var(--text-muted)] mb-1">{title}</p>
      {loading ? (
        <div className="h-8 bg-[var(--bg-primary)] animate-pulse rounded" />
      ) : error ? (
        <p className="text-red-400 text-sm">Error</p>
      ) : (
        <>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
          {subtitle && <p className="text-xs text-[var(--text-muted)] mt-1">{subtitle}</p>}
        </>
      )}
    </div>
  );
}
