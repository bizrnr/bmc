'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function OutreachPerformance() {
  const { data, error } = useSWR('/api/outreach/stats', fetcher, { refreshInterval: 30000 });

  const channels = data?.channels || {};
  const responseRates = data?.responseRates || {};
  const hotLead = data?.hotLeadCompliance || { total: 0, touched: 0 };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">Outreach Performance</h2>

      {/* Multi-Channel Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ChannelCard
          title="Email"
          icon="📧"
          stats={channels.email || {}}
          responseRate={responseRates.email}
          loading={!data && !error}
        />
        <ChannelCard
          title="SMS"
          icon="💬"
          stats={channels.sms || {}}
          responseRate={responseRates.sms}
          loading={!data && !error}
        />
        <ChannelCard
          title="Calls"
          icon="📞"
          stats={channels.calls || {}}
          responseRate={responseRates.callConnect}
          loading={!data && !error}
        />
        <ChannelCard
          title="WhatsApp"
          icon="📱"
          stats={channels.whatsapp || {}}
          loading={!data && !error}
        />
      </div>

      {/* Hot Lead Compliance */}
      <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
          🔥 Hot Lead Follow-Up Compliance
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {hotLead.touched} / {hotLead.total}
            </p>
            <p className="text-xs text-[var(--text-muted)]">Hot leads touched today</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-400">
              {hotLead.total > 0 ? Math.round((hotLead.touched / hotLead.total) * 100) : 0}%
            </p>
            <p className="text-xs text-[var(--text-muted)]">Compliance rate</p>
          </div>
        </div>
      </div>

      {/* Response Rates Summary */}
      <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
          Response Rates by Channel
        </h3>
        <div className="space-y-2">
          <ResponseBar label="Email" rate={responseRates.email || 0} />
          <ResponseBar label="SMS" rate={responseRates.sms || 0} />
          <ResponseBar label="Call Connect" rate={responseRates.callConnect || 0} />
        </div>
      </div>
    </div>
  );
}

function ChannelCard({ 
  title, 
  icon, 
  stats, 
  responseRate, 
  loading 
}: { 
  title: string; 
  icon: string; 
  stats: any; 
  responseRate?: number; 
  loading?: boolean;
}) {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      </div>
      {loading ? (
        <div className="h-16 bg-[var(--bg-primary)] animate-pulse rounded" />
      ) : (
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Sent</span>
            <span className="text-[var(--text-primary)] font-medium">{stats.sent || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Delivered</span>
            <span className="text-[var(--text-primary)] font-medium">{stats.delivered || 0}</span>
          </div>
          {stats.replied !== undefined && (
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Replied</span>
              <span className="text-green-400 font-medium">{stats.replied || 0}</span>
            </div>
          )}
          {responseRate !== undefined && (
            <div className="flex justify-between pt-1 border-t border-[var(--border-color)]">
              <span className="text-[var(--text-muted)]">Response Rate</span>
              <span className="text-blue-400 font-medium">{responseRate}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResponseBar({ label, rate }: { label: string; rate: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[var(--text-muted)]">{label}</span>
        <span className="text-[var(--text-primary)] font-medium">{rate}%</span>
      </div>
      <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
    </div>
  );
}
