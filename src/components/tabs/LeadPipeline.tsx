'use client';

import useSWR from 'swr';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function LeadPipeline() {
  const { data: velocity, error } = useSWR('/api/leads/velocity', fetcher, { refreshInterval: 30000 });
  const { data: leads, error: leadsError } = useSWR('/api/leads/stats', fetcher, { refreshInterval: 30000 });

  const hourlyChartData = velocity?.hourlyData 
    ? Object.entries(velocity.hourlyData).map(([hour, count]) => ({
        hour: `${hour}:00`,
        leads: count,
      }))
    : [];

  const scoreChartData = velocity?.scoreDistribution
    ? Object.entries(velocity.scoreDistribution).map(([score, count]) => ({
        score: `Score ${score}`,
        count,
      }))
    : [];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">Lead Pipeline</h2>

      {/* Coverage Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          title="Email Coverage"
          value={velocity ? `${velocity.emailCoverage}%` : '-'}
          loading={!velocity && !error}
        />
        <MetricCard
          title="Phone Coverage"
          value={velocity ? `${velocity.phoneCoverage}%` : '-'}
          loading={!velocity && !error}
        />
        <MetricCard
          title="Fully Enriched"
          value={velocity ? `${velocity.enrichmentHealth}%` : '-'}
          loading={!velocity && !error}
        />
      </div>

      {/* Lead Velocity Chart */}
      {hourlyChartData.length > 0 && (
        <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
            Lead Velocity (Last 24h)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-overlay)', 
                  border: '1px solid var(--border-color)' 
                }} 
              />
              <Bar dataKey="leads" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Score Distribution */}
      {scoreChartData.length > 0 && (
        <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
            Lead Score Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="score" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-overlay)', 
                  border: '1px solid var(--border-color)' 
                }} 
              />
              <Bar dataKey="count" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Leads Table */}
      {leads?.recentLeads && (
        <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
            Recent Leads (Top 50)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border-color)]">
                  <th className="pb-2">Company</th>
                  <th className="pb-2">Score</th>
                  <th className="pb-2">Temp</th>
                  <th className="pb-2">Stage</th>
                </tr>
              </thead>
              <tbody>
                {leads.recentLeads.slice(0, 10).map((lead: any) => (
                  <tr key={lead.id} className="border-b border-[var(--border-color)]">
                    <td className="py-2 text-[var(--text-primary)]">{lead.company}</td>
                    <td className="py-2">{lead.score}/10</td>
                    <td className="py-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        lead.temperature === 'hot' ? 'bg-red-500' :
                        lead.temperature === 'warm' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                    </td>
                    <td className="py-2 text-[var(--text-muted)]">{lead.stage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, loading }: { title: string; value: string; loading?: boolean }) {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
      <p className="text-xs text-[var(--text-muted)] mb-1">{title}</p>
      {loading ? (
        <div className="h-8 bg-[var(--bg-primary)] animate-pulse rounded" />
      ) : (
        <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      )}
    </div>
  );
}
