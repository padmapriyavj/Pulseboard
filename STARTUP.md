# PulseBoard – Graceful Startup

Start services in this order so dependencies are ready before apps that use them.

---

## 1. Start Docker (database + APIs)

From the project root:

```bash
cd /Users/padmapriyavijayaragavarengaraj/Documents/GitHub/Pulseboard
docker compose up -d
```

This starts:

- **TimescaleDB** (port 5433) – database
- **Zookeeper** – for Kafka
- **Kafka** (port 9092) – message broker
- **auth-service** (port 5001) – login/register
- **graphql-api** (port 4000) – GraphQL
- **insights-engine** (port 5004) – AI insights (so “Generate New Insights” on the Insights page works)

Wait until containers are healthy (about 10–20 seconds):

```bash
docker compose ps
```

All services should show `Up` (or `healthy` where applicable).

---

## 2. Insights engine (AI insights)

The **insights-engine** is now part of Docker Compose, so it starts with `docker compose up -d`.  
The **“Generate New Insights”** button on the Insights page (Dashboard → Insights) will work without running anything in the terminal.

**Optional:** For full AI-generated text (instead of template fallbacks), add your Groq API key to `.env.shared` in the project root:

```bash
GROQ_API_KEY=gsk_your_key_here
```

Then restart: `docker compose down && docker compose up -d`.

---

## 3. Optional: Sensor simulator + Kafka processor

Only if you want live sensor data and alerts:

**Terminal A – sensor simulator**

```bash
cd apps/sensor-simulator
npm install   # if not done yet
npm start
```

**Terminal B – Kafka processor** (consumes Kafka, writes to DB, creates alerts)

```bash
cd apps/kafka-processor
npm install   # if not done yet
npm start
```

---

## 4. Start the frontend

```bash
cd apps/frontend/pulseboard-dashboard
npm install   # if not done yet
npm start
```

Runs on **port 3000**. Open http://localhost:3000 and log in.

---

## Quick reference

| Order | Service           | Command / Location              | Port  |
|-------|-------------------|----------------------------------|-------|
| 1     | Docker stack      | `docker compose up -d` (project root) | 4000, 5001, 5004, 5433, 9092 |
| 2     | Sensor simulator  | `npm start` in `apps/sensor-simulator` | —     |
| 3     | Kafka processor   | `npm start` in `apps/kafka-processor`  | —     |
| 4     | Frontend          | `npm start` in `apps/frontend/pulseboard-dashboard` | 3000  |

**Minimum to use the app (including Generate on Insights page):** Step 1 + Step 4. Steps 2 and 3 are optional (for live sensor data).

---

## Before shutting down (keep your data)

To avoid losing user/sensor/alert data, **back up the database** before stopping:

```bash
./scripts/backup-db.sh
```

Then stop with `docker compose down` (do **not** use `-v`). See **DATA_SAFETY.md** for details.
