import express from "express";
import dotenv from "dotenv";
import { pool, testConnection } from "./db.js";
import {
  analyzeAlertClustering,
  analyzeSensorFrequency,
  analyzeThresholdIssues,
  analyzeSeverityDistribution,
} from "./analyzers/alert-patterns.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5004;
const DB_NAME = process.env.DB_NAME || "pulseboard";
const NODE_ENV = process.env.NODE_ENV || "development";

app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "healthy", database: "connected" });
  } catch (err) {
    console.error("❌ Health check failed:", err.message);
    res.status(503).json({ status: "unhealthy", database: "disconnected", error: err.message });
  }
});

app.get("/test/alerts", async (_req, res) => {
  try {
    const total = await pool.query("SELECT COUNT(*)::int AS count FROM alerts");
    const bySeverity = await pool.query(
      `SELECT severity, COUNT(*)::int AS count FROM alerts GROUP BY severity`
    );
    const totalCount = total.rows[0].count;
    const critical = bySeverity.rows.find((r) => (r.severity || "").toLowerCase() === "critical")?.count ?? 0;
    const warning = bySeverity.rows.find((r) => (r.severity || "").toLowerCase() === "warning")?.count ?? 0;
    res.json({
      total: totalCount,
      critical,
      warning,
    });
  } catch (err) {
    console.error("❌ /test/alerts failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

async function saveInsight(insight) {
  const res = await pool.query(
    `INSERT INTO insights (org_id, sensor_id, insight_type, insight_text, severity, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      insight.orgId,
      insight.sensorId ?? null,
      insight.insightType,
      insight.insightText,
      insight.severity,
      insight.metadata ? JSON.stringify(insight.metadata) : null,
    ]
  );
  return res.rows[0].id;
}

async function generateInsights(orgId) {
  const start = Date.now();
  const allInsights = [];

  try {
    console.log(`🔍 Analyzing alert clustering for org ${orgId}...`);
    const clustering = await analyzeAlertClustering(orgId);
    if (clustering) allInsights.push(clustering);

    console.log(`🔍 Analyzing sensor frequency for org ${orgId}...`);
    const sensorFreq = await analyzeSensorFrequency(orgId);
    allInsights.push(...sensorFreq);

    console.log(`🔍 Analyzing thresholds for org ${orgId}...`);
    const threshold = await analyzeThresholdIssues(orgId);
    allInsights.push(...threshold);

    console.log(`🔍 Analyzing severity distribution for org ${orgId}...`);
    const severityDist = await analyzeSeverityDistribution(orgId);
    if (severityDist) allInsights.push(severityDist);

    let saved = 0;
    for (const insight of allInsights) {
      await saveInsight(insight);
      saved++;
    }
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`✅ Generated ${saved} insights in ${duration} seconds`);
    return { success: true, count: saved, duration };
  } catch (err) {
    console.error("❌ generateInsights failed:", err.message);
    throw err;
  }
}

app.post("/generate/:orgId", async (req, res) => {
  const orgId = req.params.orgId;
  if (!orgId) {
    return res.status(400).json({ error: "orgId required" });
  }
  try {
    const result = await generateInsights(orgId);
    res.json(result);
  } catch (err) {
    console.error("❌ POST /generate failed:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/insights/:orgId", async (req, res) => {
  const orgId = req.params.orgId;
  if (!orgId) {
    return res.status(400).json({ error: "orgId required" });
  }
  try {
    const result = await pool.query(
      `SELECT id, org_id AS "orgId", sensor_id AS "sensorId", insight_type AS "insightType",
              insight_text AS "insightText", severity, metadata, created_at AS "createdAt"
       FROM insights
       WHERE org_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [orgId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /insights failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

async function waitForDatabase(retries = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Checking database connection (attempt ${attempt}/${retries})...`);
      await testConnection();
      return;
    } catch (err) {
      if (attempt === retries) {
        console.error("❌ Database not ready after retries, giving up.");
        throw err;
      }
      console.warn(`⚠️ Database not ready yet: ${err.message}. Retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function start() {
  await waitForDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Insights engine running at http://localhost:${PORT}`);
    console.log(`   Database: ${DB_NAME} | NODE_ENV: ${NODE_ENV}`);
    console.log(`   Endpoints: GET /health | GET /test/alerts | POST /generate/:orgId | GET /insights/:orgId`);
  });
}

start().catch((err) => {
  console.error("❌ Startup failed:", err);
  process.exit(1);
});
