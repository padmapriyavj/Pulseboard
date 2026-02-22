# Insights Engine – Testing & Verification

## Commands to Run Each Test

### 1. Database migration

Run the migration against the TimescaleDB container and `pulseboard` database:

```bash
# From project root
docker exec -i timescaledb psql -U postgres -d pulseboard < migrations/add_insights_table.sql
```

**Expected:** No error; output may show `CREATE TABLE`, `CREATE INDEX` messages.

---

### 2. Verify insights table

```bash
docker exec timescaledb psql -U postgres -d pulseboard -c "\d insights"
```

**Expected output (structure):**

- Column list including: `id`, `org_id`, `sensor_id`, `insight_type`, `insight_text`, `severity`, `metadata`, `created_at`, `expires_at`
- `insights_pkey` primary key
- `insights_sensor_id_fkey` foreign key to `sensors(id)`
- Check constraint on `severity` for INFO, WARNING, CRITICAL
- Indexes: `idx_insights_org_id`, `idx_insights_sensor_id`, `idx_insights_created_at`, `idx_insights_insight_type`, `idx_insights_severity`

---

### 3. Install dependencies

```bash
cd apps/insights-engine
npm install
```

**Expected:** `added N packages`; no errors. `node_modules` and `package-lock.json` created.

---

### 4. Create .env

```bash
cd apps/insights-engine
cp .env.example .env
# Edit .env and add GROQ_API_KEY when ready (optional for basic health/alerts tests)
```

**Expected:** File `.env` exists with `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=pulseboard`, `PORT=5004`, `NODE_ENV`.

For local Docker, use:

- `DB_HOST=localhost` (or `timescaledb` if run from Docker)
- `DB_PORT=5433`
- `DB_NAME=pulseboard`

---

### 5. Start server

```bash
cd apps/insights-engine
npm start
```

**Expected output:**

- `✅ Database connected: pulseboard at <timestamp>`
- `🚀 Insights engine running at http://localhost:5004`
- `   Database: pulseboard | NODE_ENV: development`
- `   Endpoints: GET /health | GET /test/alerts | POST /generate/:orgId | GET /insights/:orgId`

---

### 6. Health check

```bash
curl http://localhost:5004/health
```

**Expected response (200):**

```json
{"status":"healthy","database":"connected"}
```

---

### 7. Alert test

```bash
curl http://localhost:5004/test/alerts
```

**Expected response (200):** JSON with `total`, `critical`, `warning` (values depend on current DB; e.g. total 175, critical 63, warning 112):

```json
{"total":175,"critical":63,"warning":112}
```

---

## Verification checklist

- [ ] Migration runs without error
- [ ] `\d insights` shows correct columns, PK, FK, check constraint, indexes
- [ ] `npm install` completes in `apps/insights-engine`
- [ ] `.env` created from `.env.example` and DB vars point to `pulseboard`
- [ ] `npm start` shows DB connected and server on port 5004
- [ ] `curl http://localhost:5004/health` returns `{"status":"healthy","database":"connected"}`
- [ ] `curl http://localhost:5004/test/alerts` returns `total`, `critical`, `warning` counts

---

## Note on migration schema

The migration uses **`org_id TEXT NOT NULL`** (not `organization_id INTEGER`) to match existing tables (`users`, `sensors`, `alerts`), which all use `org_id` as text. There is no `organizations` table in the project.

---

## Prompt #2: Alert analyzer & LLM tests

### Test 1: Verify Groq API key

```bash
cat apps/insights-engine/.env | grep GROQ_API_KEY
```

**Expected:** `GROQ_API_KEY=gsk_...`

### Test 2: Find organization ID (use the one that has alerts)

Insights are generated from **alerts**. Use the `org_id` that actually has alerts:

```bash
docker exec timescaledb psql -U postgres -d pulseboard -c "SELECT org_id, COUNT(*) FROM alerts GROUP BY org_id;"
```

**Expected:** One or more rows; use that `org_id` in `/generate/:orgId` and `/insights/:orgId` (e.g. `calix`). Using an org_id with no alerts (e.g. `1`) returns 0 insights.

### Test 3: Restart server

Stop existing server (Ctrl+C), then:

```bash
cd apps/insights-engine && npm start
```

**Expected:** Starts without errors; DB connected.

### Test 4: Optional – LLM generator (manual)

```bash
cd apps/insights-engine
node test-groq.js
```

**Expected:** One line of natural-language insight (or template fallback if API fails).

### Test 5: Generate insights

Replace `calix` with your actual `org_id` from Test 2 (the one that has alerts):

```bash
curl -X POST http://localhost:5004/generate/calix
```

**Expected response (200):**

```json
{"success":true,"count":6,"duration":"3.45"}
```

Console should show: 🔍 Analyzing alert clustering…, sensor frequency…, thresholds…, severity distribution…, then ✅ Generated N insights in X seconds.

### Test 6: View insights

```bash
curl http://localhost:5004/insights/calix
```

**Expected:** JSON array of insight objects with `insightType`, `insightText`, `severity`, `metadata`, etc.

### Test 7: Verify in database

```bash
docker exec timescaledb psql -U postgres -d pulseboard -c "SELECT insight_type, severity, LEFT(insight_text, 80) as preview FROM insights ORDER BY created_at DESC LIMIT 5;"
```

**Expected:** Rows with `insight_type`, `severity`, and truncated `preview` of `insight_text`.
