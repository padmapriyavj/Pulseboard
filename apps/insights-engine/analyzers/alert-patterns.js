import { pool } from "../db.js";
import { generateInsight } from "../generators/llm.js";

/**
 * Analyze time-based alert clustering for an organization.
 * Finds clusters (e.g. >50 alerts in a time window) and generates an insight.
 */
export async function analyzeAlertClustering(orgId) {
  try {
    const timeDist = await pool.query(
      `SELECT
        date_trunc('minute', created_at) AS minute_bucket,
        COUNT(*)::int AS cnt
       FROM alerts
       WHERE org_id = $1
       GROUP BY date_trunc('minute', created_at)
       ORDER BY cnt DESC`,
      [orgId]
    );
    const span = await pool.query(
      `SELECT
        COUNT(*)::int AS total,
        MIN(created_at) AS first_at,
        MAX(created_at) AS last_at
       FROM alerts
       WHERE org_id = $1`,
      [orgId]
    );
    const total = span.rows[0]?.total ?? 0;
    const firstAt = span.rows[0]?.first_at;
    const lastAt = span.rows[0]?.last_at;
    if (total === 0) return null;

    const topBucket = timeDist.rows[0];
    const maxInWindow = topBucket?.cnt ?? 0;
    const windowMinutes = total > 0 ? Math.max(1, Math.ceil((new Date(lastAt) - new Date(firstAt)) / 60000)) : 1;
    const clustering = maxInWindow >= 50 ? "high" : maxInWindow >= 20 ? "medium" : "low";
    const severity = clustering === "high" ? "WARNING" : "INFO";

    const stats = {
      total_alerts: total,
      time_window: `${windowMinutes} minute(s)`,
      clustering,
      max_alerts_in_single_minute: maxInWindow,
    };
    const insightText = await generateInsight(stats, "alert-clustering");
    return {
      orgId,
      sensorId: null,
      insightType: "alert-clustering",
      insightText,
      severity,
      metadata: stats,
    };
  } catch (err) {
    console.error("❌ analyzeAlertClustering failed:", err.message);
    throw err;
  }
}

/**
 * Analyze which sensors generate the most alerts; returns one insight per top sensor (up to 3).
 */
export async function analyzeSensorFrequency(orgId) {
  try {
    const rows = await pool.query(
      `SELECT
        a.sensor_id,
        s.name AS sensor_name,
        COUNT(*)::int AS alert_count
       FROM alerts a
       LEFT JOIN sensors s ON s.id = a.sensor_id
       WHERE a.org_id = $1
       GROUP BY a.sensor_id, s.name
       ORDER BY alert_count DESC
       LIMIT 3`,
      [orgId]
    );
    const totalRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM alerts WHERE org_id = $1`,
      [orgId]
    );
    const total = totalRes.rows[0]?.total ?? 0;
    if (total === 0 || rows.rows.length === 0) return [];

    const insights = [];
    for (const r of rows.rows) {
      const percentage = total > 0 ? Math.round((r.alert_count / total) * 100) : 0;
      const stats = {
        sensor_name: r.sensor_name ?? `Sensor ${r.sensor_id}`,
        sensor_id: r.sensor_id,
        alert_count: r.alert_count,
        percentage,
        total,
      };
      const insightText = await generateInsight(stats, "sensor-frequency");
      const severity = percentage >= 50 ? "WARNING" : percentage >= 30 ? "INFO" : "INFO";
      insights.push({
        orgId,
        sensorId: r.sensor_id,
        insightType: "sensor-frequency",
        insightText,
        severity,
        metadata: stats,
      });
    }
    return insights;
  } catch (err) {
    console.error("❌ analyzeSensorFrequency failed:", err.message);
    throw err;
  }
}

/**
 * Analyze threshold configuration issues (impossible values, very tight thresholds).
 */
export async function analyzeThresholdIssues(orgId) {
  try {
    const rows = await pool.query(
      `SELECT
        sensor_id,
        sensor_type,
        value,
        threshold_min,
        threshold_max,
        severity AS alert_severity
       FROM alerts
       WHERE org_id = $1
         AND (threshold_min IS NOT NULL OR threshold_max IS NOT NULL)
       ORDER BY created_at DESC
       LIMIT 100`,
      [orgId]
    );
    if (rows.rows.length === 0) return [];

    const insights = [];
    const seen = new Set();
    for (const r of rows.rows) {
      const val = Number(r.value);
      const tMin = r.threshold_min != null ? Number(r.threshold_min) : null;
      const tMax = r.threshold_max != null ? Number(r.threshold_max) : null;
      let issue = null;
      let severity = "WARNING";
      if (r.sensor_type && String(r.sensor_type).toLowerCase().includes("temp")) {
        if (val >= 200 || val <= -100) {
          issue = "impossible temperature value";
          severity = "CRITICAL";
        } else if ((tMin != null && val < tMin - 50) || (tMax != null && val > tMax + 50)) {
          issue = "value far outside configured range";
          severity = "CRITICAL";
        }
      }
      if (!issue && tMin != null && tMax != null) {
        const range = tMax - tMin;
        if (range < 5 && range > 0) issue = "very tight threshold range";
      }
      if (!issue) issue = "threshold breach or misconfiguration";
      const key = `${r.sensor_id}-${r.sensor_type}-${issue}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const stats = {
        sensor_type: r.sensor_type,
        value: val,
        threshold_min: tMin,
        threshold_max: tMax,
        issue,
      };
      const insightText = await generateInsight(stats, "threshold-analysis");
      insights.push({
        orgId,
        sensorId: r.sensor_id,
        insightType: "threshold-analysis",
        insightText,
        severity,
        metadata: stats,
      });
      if (insights.length >= 3) break;
    }
    return insights;
  } catch (err) {
    console.error("❌ analyzeThresholdIssues failed:", err.message);
    throw err;
  }
}

/**
 * Analyze severity distribution (critical vs warning); healthy ~20% critical, ~80% warning.
 */
export async function analyzeSeverityDistribution(orgId) {
  try {
    const rows = await pool.query(
      `SELECT
        severity,
        COUNT(*)::int AS cnt
       FROM alerts
       WHERE org_id = $1
       GROUP BY severity`,
      [orgId]
    );
    let total = 0;
    let criticalCount = 0;
    let warningCount = 0;
    for (const r of rows.rows) {
      total += r.cnt;
      if ((r.severity || "").toLowerCase() === "critical") criticalCount += r.cnt;
      else if ((r.severity || "").toLowerCase() === "warning") warningCount += r.cnt;
    }
    if (total === 0) return null;

    const criticalPct = Math.round((criticalCount / total) * 100);
    const warningPct = Math.round((warningCount / total) * 100);
    const severity = criticalPct > 50 ? "WARNING" : "INFO";

    const stats = {
      total,
      critical_count: criticalCount,
      warning_count: warningCount,
      critical_pct: criticalPct,
      warning_pct: warningPct,
    };
    const insightText = await generateInsight(stats, "severity-distribution");
    return {
      orgId,
      sensorId: null,
      insightType: "severity-distribution",
      insightText,
      severity,
      metadata: stats,
    };
  } catch (err) {
    console.error("❌ analyzeSeverityDistribution failed:", err.message);
    throw err;
  }
}
