# BizRnR Mission Control (BMC) - Enterprise Dashboard Architecture

## Overview
Real-time enterprise operations dashboard providing 360° visibility into BizRnR's sales, outreach, revenue, infrastructure, and agent performance.

## Dashboard Tabs (6)

### 1. Executive Overview (Default)
**Purpose:** Real-time C-suite metrics for rapid decision-making

**Data Sources:**
- `/api/revenue/mrr` — Stripe subscriptions (30s cache)
- `/api/pipeline/stats` — Supabase crm_leads (5min cache)
- `/api/system/bullmq` — Redis BullMQ stats (30s cache)
- `/api/system/crons` — OpenClaw cron health (30s cache)
- `/api/costs/daily` — Supabase api_usage_log (5min cache)

**Metrics:**
- MRR (live Stripe)
- Total pipeline value by stage
- Today's new leads, demos, trials, checkouts
- BullMQ pending jobs
- Top 3 system alerts (cron errors, low balance, cost spikes)

**Refresh:** 30s polling + WebSocket for system alerts

---

### 2. Lead Pipeline
**Purpose:** Sales operations & lead health monitoring

**Data Sources:**
- `/api/leads/velocity` — Supabase crm_leads (5min cache)
- `/api/leads/stats` — Existing LGM report

**Metrics:**
- Lead velocity chart (leads/hour, last 24h) via Recharts
- Lead score distribution (1-10 histogram)
- Email/phone coverage percentages
- Enrichment health (% with email+phone+website+industry)
- Top 50 recent leads table (filterable)

**Refresh:** 30s polling

---

### 3. Outreach Performance
**Purpose:** Multi-channel engagement tracking

**Data Sources:**
- `/api/outreach/stats` — Supabase crm_activities (5min cache)

**Metrics:**
- Email: sent, delivered, opened, replied, bounced
- SMS: sent, delivered, replied
- Calls: made, connected, voicemail
- WhatsApp: sent, delivered, replied
- Response rates by channel
- Hot lead follow-up compliance ("X of Y hot leads touched today")

**Refresh:** 30s polling

---

### 4. Revenue & Conversion
**Purpose:** Funnel analytics & revenue forecasting

**Data Sources:**
- `/api/revenue/mrr` — Stripe subscriptions
- `/api/pipeline/stats` — Supabase crm_leads

**Metrics:**
- Conversion funnel (Lead → Contacted → Qualified → Demo → Trial → Paid)
- Average deal size ($499)
- Average sales cycle (days from lead → Won)
- Trial→Paid conversion rate
- MRR breakdown by plan

**Refresh:** 30s polling

---

### 5. System Health
**Purpose:** Infrastructure & cost monitoring

**Data Sources:**
- `/api/system/infra` — Shell commands (free, df, uptime) (30s cache)
- `/api/system/bullmq` — Redis BullMQ keys (30s cache)
- `/api/system/crons` — openclaw cron list (30s cache)
- `/api/costs/daily` — Supabase api_usage_log (5min cache)

**Metrics:**
- CPU load, memory %, disk %, uptime
- BullMQ queue stats (waiting, active, failed) for 6 queues
- OpenClaw cron job status (all jobs, highlighted failures)
- API cost tracking (Anthropic, ElevenLabs, Twilio) — daily + monthly

**Refresh:** 30s polling

---

### 6. Agent Management
**Purpose:** Sub-agent performance & task monitoring

**Data Sources:**
- `/api/agents/performance` — Supabase agent_tasks (5min cache)
- `/api/status` — OpenClaw gateway (5s polling)

**Metrics:**
- Active agents (live status from WebSocket)
- Agent performance leaderboard (tasks completed, error rate, avg duration)
- Recent task log (last 50 with status, duration, timestamps)
- Manual agent spawn interface (links to existing panel)

**Refresh:** 5s polling for active agents, 30s for performance stats

---

## Data Fetching Strategy

### Page Load (Initial)
- **Executive Overview ONLY** — defer all other tabs until clicked
- Prevents overloading Supabase on dashboard open

### WebSocket (Real-Time)
- Active agents (status changes)
- Current task updates
- New leads (push notification)
- System alerts (cron failures, cost spikes)

### Polling (Stale-While-Revalidate)
| Metric | Interval | Cache TTL |
|--------|----------|-----------|
| MRR | 30s | 30s |
| Pipeline stats | 30s | 5min |
| Lead velocity | 30s | 5min |
| Outreach stats | 30s | 5min |
| Cron health | 30s | 30s |
| BullMQ stats | 30s | 30s |
| Infrastructure | 30s | 30s |
| API costs | 5min | 5min |
| Agent performance | 30s | 5min |

### Caching Layer
- **Redis** for all expensive aggregations
- `src/lib/cache.ts` — `getCached(key, fetcher, ttlSeconds)`
- Fallback to direct fetch if Redis fails

---

## API Routes

### Revenue
- `/api/revenue/mrr` — Stripe active subscriptions → MRR calculation

### Pipeline
- `/api/pipeline/stats` — Aggregate crm_leads by stage, calculate pipeline value

### Leads
- `/api/leads/velocity` — Hourly lead chart, score distribution, enrichment health

### Outreach
- `/api/outreach/stats` — Multi-channel activity stats from crm_activities

### System
- `/api/system/crons` — `openclaw cron list --json`
- `/api/system/bullmq` — Query Redis BullMQ keys
- `/api/system/infra` — Shell commands for CPU/RAM/disk/uptime

### Costs
- `/api/costs/daily` — Daily + monthly API spend from api_usage_log

### Agents
- `/api/agents/performance` — Agent task stats from agent_tasks table

---

## Performance Optimizations

1. **No Full Table Scans** — All Supabase queries use indexed columns or LIMIT
2. **Batch API Calls** — `Promise.all()` for parallel external API requests
3. **Incremental WebSocket Updates** — Only emit changed data, not full state
4. **Lazy Chart Rendering** — Defer Recharts until tab is visible
5. **Connection Pooling** — Supabase Supavisor enabled
6. **Redis Caching** — 5min TTL for expensive aggregations

---

## UI/UX Features

- **Mobile-first** — Responsive grid, no horizontal scroll
- **Dark mode only** — Existing theme
- **Loading states** — Skeleton loaders for all data fetches
- **Error handling** — Error banners + retry buttons, no crashes
- **Accessibility** — ARIA labels on charts, button labels
- **Keyboard shortcuts** — 1-6 for tab switching, R for refresh
- **Pull-to-refresh** — Mobile gesture support

---

## Database Schema Requirements

### Existing Tables
- `crm_leads` — Must have: stage, deal_value, temperature, created_at, lead_score, email, phone, website, industry
- `crm_activities` — Must have: type, status, created_at, lead_id

### Optional Tables (Return zeros if missing)
- `api_usage_log` — provider, cost, tokens, characters, created_at
- `agent_tasks` — agent_id, agent_type, status, duration_ms, created_at, completed_at

---

## Environment Variables

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...

# Supabase
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=eyJ...

# Redis
REDIS_URL=redis://localhost:6379

# Twilio (for future expansion)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...

# Instantly (for future expansion)
INSTANTLY_API_KEY=...
```

---

## Deployment

1. **Build:** `npm run build` (Next.js 16 + Turbopack)
2. **Deploy:** Vercel auto-deploys from main branch
3. **Custom Server:** `npm run start` (for WebSocket support)

---

## Future Enhancements

1. **Real Stripe Webhook** — Push MRR updates instead of polling
2. **Conversion Tracking** — Dedicated tracking for Lead → Trial → Paid stages
3. **Alert Rules Engine** — User-configurable thresholds for alerts
4. **Export to CSV** — Download lead tables + performance reports
5. **Dark/Light Theme Toggle** — Re-enable theme switcher
