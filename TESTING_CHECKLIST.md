# BMC Enterprise Dashboard - Testing Checklist

## Pre-Deploy Verification

### 1. Build & TypeScript
- [x] `npm run build` — No TypeScript errors
- [x] All API routes compile successfully
- [x] All tab components render without errors

### 2. API Routes (Test Locally)
```bash
# Start dev server
npm run dev

# Test each route
curl http://localhost:3000/api/revenue/mrr
curl http://localhost:3000/api/pipeline/stats
curl http://localhost:3000/api/leads/velocity
curl http://localhost:3000/api/outreach/stats
curl http://localhost:3000/api/system/crons
curl http://localhost:3000/api/system/bullmq
curl http://localhost:3000/api/system/infra
curl http://localhost:3000/api/costs/daily
curl http://localhost:3000/api/agents/performance
```

**Expected:** All routes return JSON (no 500 errors). If tables don't exist, should return graceful fallbacks.

### 3. Tab Navigation
- [ ] Click each tab (Exec, Leads, Outreach, Revenue, System, Agents)
- [ ] Verify no console errors
- [ ] Verify loading states appear briefly
- [ ] Verify data loads or shows error states

### 4. Mobile Responsiveness
- [ ] Test on Chrome DevTools mobile view (iPhone, iPad)
- [ ] All tabs scroll correctly (no horizontal overflow)
- [ ] Bottom nav is accessible
- [ ] Pull-to-refresh works on touchscreen

### 5. Real-Time Features
- [ ] WebSocket connection shows "Live" indicator
- [ ] Toast notifications appear on new activities
- [ ] Active agents update in real-time

### 6. Keyboard Shortcuts
- [ ] Press 1-6 → Tab switches
- [ ] Press R → Dashboard refreshes

### 7. Error Handling
- [ ] Kill Redis → Should fallback to direct fetch
- [ ] Kill Supabase → Should show error banner + retry button
- [ ] Stripe API failure → Should show error card, not crash

### 8. Performance
- [ ] Initial page load < 3s (Executive tab only)
- [ ] Tab switching < 500ms
- [ ] No memory leaks (check Chrome DevTools Memory tab)

---

## Post-Deploy Verification (Production)

### 1. Vercel Deployment
- [ ] Auto-deploy triggered from main branch
- [ ] Build logs show success
- [ ] Environment variables set correctly

### 2. Production URLs
- [ ] https://bri-dashboard-three.vercel.app/ — Loads Executive tab
- [ ] All API routes accessible (no CORS errors)

### 3. Database Queries
- [ ] Check Supabase logs for slow queries (should be < 100ms)
- [ ] Verify Redis cache hit rate (should be > 80% after warmup)

### 4. Cost Monitoring
- [ ] Track Stripe API calls (should be < 100/day with 30s cache)
- [ ] Track Supabase queries (should be < 1000/day with 5min cache)

---

## Known Limitations

1. **Missing Tables:** If `api_usage_log` or `agent_tasks` don't exist, routes return zeros (graceful degradation)
2. **Conversion Funnel:** Uses pipeline stages as proxy for Demo/Trial counts
3. **Agent Spawn:** Links to existing Agent Management panel (not reimplemented)
4. **Redis Dependency:** If Redis is down, falls back to direct fetch (slower)

---

## Recommended Next Steps

1. **Create Missing Tables:**
   ```sql
   -- api_usage_log
   CREATE TABLE api_usage_log (
     id SERIAL PRIMARY KEY,
     provider TEXT NOT NULL,
     cost NUMERIC(10,2) DEFAULT 0,
     tokens INTEGER DEFAULT 0,
     characters INTEGER DEFAULT 0,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   CREATE INDEX idx_api_usage_provider_created ON api_usage_log(provider, created_at);

   -- agent_tasks
   CREATE TABLE agent_tasks (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     agent_id TEXT NOT NULL,
     agent_type TEXT NOT NULL,
     status TEXT NOT NULL,
     duration_ms INTEGER,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     completed_at TIMESTAMPTZ
   );
   CREATE INDEX idx_agent_tasks_type_created ON agent_tasks(agent_type, created_at);
   ```

2. **Verify Indexes on crm_leads:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON crm_leads(created_at DESC);
   CREATE INDEX IF NOT EXISTS idx_crm_leads_stage ON crm_leads(stage);
   CREATE INDEX IF NOT EXISTS idx_crm_leads_temperature ON crm_leads(temperature);
   ```

3. **Verify Indexes on crm_activities:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_crm_activities_created_at ON crm_activities(created_at DESC);
   CREATE INDEX IF NOT EXISTS idx_crm_activities_type_status ON crm_activities(type, status);
   CREATE INDEX IF NOT EXISTS idx_crm_activities_lead_id ON crm_activities(lead_id);
   ```

4. **Set Up Redis Monitoring:**
   ```bash
   redis-cli INFO memory
   redis-cli INFO stats
   ```

5. **Enable Stripe Webhooks:**
   - Configure webhook endpoint: `/api/webhooks/stripe`
   - Subscribe to `customer.subscription.created/updated/deleted`
   - Invalidate `revenue:mrr` cache on events

