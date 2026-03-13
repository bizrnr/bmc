'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function RevenueConversion() {
  const { data: mrr } = useSWR('/api/revenue/mrr', fetcher, { refreshInterval: 30000 });
  const { data: pipeline } = useSWR('/api/pipeline/stats', fetcher, { refreshInterval: 30000 });

  // Mock conversion funnel data (replace with real API when available)
  const funnelStages = [
    { stage: 'Lead', count: pipeline?.totalLeads || 0, rate: 100 },
    { stage: 'Contacted', count: pipeline?.byStage?.Contacted?.count || 0, rate: 70 },
    { stage: 'Qualified', count: pipeline?.byStage?.Qualified?.count || 0, rate: 40 },
    { stage: 'Demo', count: pipeline?.byStage?.Proposal?.count || 0, rate: 20 },
    { stage: 'Trial', count: 0, rate: 10 },
    { stage: 'Paid', count: mrr?.activeSubscriptions || 0, rate: 5 },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">Revenue & Conversion</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="MRR"
          value={mrr ? `$${mrr.mrr.toFixed(0)}` : '-'}
          subtitle={mrr ? `${mrr.activeSubscriptions} subs` : ''}
        />
        <MetricCard
          title="Avg Deal Size"
          value="$499"
          subtitle="Starter plan"
        />
        <MetricCard
          title="Won This Month"
          value={pipeline?.wonCount?.toString() || '-'}
          subtitle={pipeline ? `$${Math.round(pipeline.wonValue)}` : ''}
        />
        <MetricCard
          title="Pipeline Forecast"
          value={pipeline ? `$${Math.round(pipeline.totalPipelineValue / 1000)}K` : '-'}
          subtitle="Active pipeline"
        />
      </div>

      {/* Conversion Funnel */}
      <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">
          Conversion Funnel
        </h3>
        <div className="space-y-2">
          {funnelStages.map((stage, i) => (
            <div key={stage.stage} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[var(--text-primary)]">{stage.stage}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text-muted)]">{stage.count}</span>
                  <span className="text-xs text-[var(--text-muted)]">({stage.rate}%)</span>
                </div>
              </div>
              <div className="h-8 bg-[var(--bg-primary)] rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center text-xs font-medium text-white"
                  style={{ width: `${stage.rate}%` }}
                >
                  {stage.rate}%
                </div>
              </div>
              {i < funnelStages.length - 1 && (
                <div className="absolute left-1/2 -translate-x-1/2 text-2xl text-[var(--text-muted)] my-1">
                  ↓
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Breakdown */}
      {mrr?.breakdown && (
        <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
            MRR Breakdown
          </h3>
          <div className="space-y-2">
            {Object.entries(mrr.breakdown).map(([plan, value]: [string, any]) => (
              <div key={plan} className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-primary)]">{plan}</span>
                <span className="font-medium">${value.toFixed(0)}</span>
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
  subtitle 
}: { 
  title: string; 
  value: string; 
  subtitle?: string;
}) {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
      <p className="text-xs text-[var(--text-muted)] mb-1">{title}</p>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      {subtitle && <p className="text-xs text-[var(--text-muted)] mt-1">{subtitle}</p>}
    </div>
  );
}
