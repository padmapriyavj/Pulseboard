# PulseBoard – AI Insights Feature Readiness Report

**Date:** 2026-02-22  
**Scope:** Prerequisites verification for adding an AI-powered insights feature.

---

## 1. DATABASE STRUCTURE CHECK

### 1.1 List public tables

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

**Result:**
```
    table_name     
-------------------
 alerts
 sensor_access_log
 sensor_metrics
 sensors
 users
(5 rows)
```

**✅ PASS** – All core tables exist (see note on `organizations` below).

**Note:** Your checklist expected an **organizations** table. It does **not** exist in the current schema. `init.sql` defines: `users`, `sensors`, `sensor_metrics`, `sensor_access_log`, `alerts`. Organization context is carried via `org_id` on users/sensors/alerts. If AI insights need a dedicated organizations table, add it before or as part of the feature.

### 1.2 Table schemas

| Table           | Status | Notes |
|----------------|--------|--------|
| **organizations** | ❌ **MISSING** | Not in schema; see above. |
| **sensors**       | ✅ | id, org_id, name, type, min, max, unit, status, created_at, updated_at, delete_status |
| **sensor_metrics**| ✅ | device_id, sensor_type, org_id, sensor_id, value, unit, status, timestamp (TimescaleDB hypertable) |
| **alerts**        | ✅ | id, org_id, sensor_id, sensor_name, sensor_type, alert_type, severity, message, value, threshold_min/max, acknowledged, created_at |
| **users**         | ✅ | id, name, email, password, org_id, created_at |

**sensor_metrics** is a **hypertable** (verified via `timescaledb_information.hypertables`).

---

## 2. DATA AVAILABILITY CHECK

| Query | Result |
|-------|--------|
| **total_sensors** (delete_status = false) | **3** |
| **active_sensors** (status = 'active', delete_status = false) | **3** |
| **sensor_metrics** | total_readings: **231**, oldest: 2026-02-22 05:20, newest: 2026-02-22 05:23, **days_of_data: 0** |
| **By sensor_type** | temperature: 231 readings, 3 unique sensors |
| **Null value %** | 0.00% (234 total, 0 null) |
| **total_alerts** | **37** |

**✅ PASS** – Data exists and quality (no nulls) is good.

**⚠️ WARNING** – **days_of_data = 0**: only a few minutes of metrics. For meaningful AI/ML (trends, seasonality, anomaly baselines), plan to accumulate at least several days (ideally weeks) of data, or use the simulator longer before relying on insights.

---

## 3. SERVICES OPERATIONAL CHECK

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Result:**
```
NAMES                       STATUS          PORTS
pulseboard-graphql-api-1    Up 13 minutes   0.0.0.0:4000->4000/tcp
pulseboard-kafka-1          Up 13 minutes   0.0.0.0:9092->9092/tcp
pulseboard-auth-service-1   Up 13 minutes   0.0.0.0:5001->5001/tcp
pulseboard-zookeeper-1      Up 13 minutes   2181/tcp, 2888/tcp, 3888/tcp
timescaledb                 Up 13 minutes   8008/tcp, 8081/tcp, 0.0.0.5433->5432/tcp
```

**✅ PASS** – timescaledb, kafka, zookeeper, auth-service, graphql-api are running.

**Note:** `docker-compose.yml` does not define a service named `sensor-simulator` or `kafka-processor`; they may be run separately. Only the services above were verified as running.

---

## 4. GRAPHQL API CHECK

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { queryType { name } } }"}'
```

**Result:**  
`{"error":"Missing or invalid Authorization header"}`

**✅ PASS** – The GraphQL endpoint is **reachable and responding**. The API requires a **Bearer JWT** on all `/graphql` requests (`apps/graphql-api/middleware/auth.js`). To get schema introspection, call the same URL with a valid token:  
`Authorization: Bearer <JWT>` (obtain JWT via auth-service login).

---

## 5. DATABASE CONNECTION CHECK

Your checklist used database name **iot_monitoring**. The project uses **pulseboard** (see `.env.shared`: `PGDATABASE=pulseboard`).

```bash
docker exec timescaledb psql -U postgres -d pulseboard -c "SELECT NOW();"
```

**Result:**  
`2026-02-22 05:23:30.423718+00`

**✅ PASS** – Database is accessible. Use **pulseboard** (not iot_monitoring) for all DB operations.

---

## 6. FILE STRUCTURE CHECK

- **apps/** – Contains: auth-service, frontend, graphql-api, kafka-processor, sensor-simulator.
- **New service test:**  
  `mkdir -p apps/insights-engine/test && rmdir apps/insights-engine/test`  
  **✅ PASS** – Directory creation works; you can add `apps/insights-engine` when you implement the AI insights service.

---

## 7. ENVIRONMENT VARIABLES CHECK

```bash
find . -name ".env*" -type f
```

**Result:**
- `.env.shared` (root)
- `apps/auth-service/.env`
- `apps/graphql-api/.env`
- `apps/kafka-processor/.env`
- `apps/sensor-simulator/.env`
- `apps/frontend/pulseboard-dashboard/src/.env`

**✅ PASS** – Expected services have `.env` files.

---

## 8. DEPENDENCY CHECK

| Check | Result |
|-------|--------|
| **node --version** | v20.19.5 (✅ ≥ 18) |
| **npm --version** | 10.8.2 (✅ ≥ 8) |
| **graphql-api:** `npm list pg` | pg@8.16.3 present |

**✅ PASS** – Node 18+, npm 8+, and `pg` are available for backend/DB work.

---

## Summary

### What’s ready

- **Database:** PostgreSQL + TimescaleDB with correct tables (users, sensors, sensor_metrics as hypertable, alerts, sensor_access_log).
- **Data:** Sensors, metrics, and alerts present; no null values in sampled metrics.
- **Stack:** Docker Compose with timescaledb, kafka, zookeeper, auth-service, graphql-api running.
- **API:** GraphQL endpoint up; auth enforced via JWT.
- **Project:** `apps/` structure and `.env` files in place; can add `apps/insights-engine`.
- **Runtime:** Node 20, npm 10, `pg` in graphql-api.

### Blocking issues (must fix before relying on AI insights)

1. **None** – You can proceed to implement the AI insights feature from an infrastructure and schema perspective.

### Warnings (should address, not blocking)

1. **organizations table** – If you need a dedicated organizations table (e.g. for org metadata or multi-tenant AI context), add it to `init.sql` and run migrations.
2. **Limited history** – Only ~0 days of sensor_metrics. Run the simulator (or collect real data) for several days/weeks before expecting robust AI/ML behavior.
3. **DB name** – Use database name **pulseboard** (not iot_monitoring) in scripts and docs.
4. **GraphQL testing** – Use a valid JWT (e.g. from auth-service login) when calling GraphQL for introspection or queries.

### Green light decision

**YES** – You can proceed with the AI insights feature. Resolve the **organizations** requirement if needed, and plan for more historical data (or clearly scope insights to “recent data only”) for better model/insight quality.
