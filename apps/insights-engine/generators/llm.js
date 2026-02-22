import Groq from "groq-sdk";

const SYSTEM_PROMPT =
  "You are an IoT data analyst. Generate concise, actionable insights from sensor alert statistics. Use 1-2 sentences. Avoid jargon.";

const PROMPT_TEMPLATES = {
  "alert-clustering": (stats) =>
    `Based on these alert time patterns: total alerts=${stats.total_alerts ?? stats.total}, time window=${stats.time_window ?? "unknown"}, clustering=${stats.clustering ?? "unknown"}. Write one short insight about whether this suggests systematic issues or random spikes.`,

  "sensor-frequency": (stats) =>
    `Sensor "${stats.sensor_name ?? "Unknown"}" generated ${stats.percentage ?? 0}% of all alerts (${stats.alert_count ?? 0} alerts). Write one short sentence prioritizing which sensor needs attention.`,

  "threshold-analysis": (stats) =>
    `Sensor type: ${stats.sensor_type ?? "unknown"}. Threshold min=${stats.threshold_min}, max=${stats.threshold_max}, value=${stats.value}. Issue: ${stats.issue ?? "misconfigured"}. Suggest a brief actionable insight.`,

  "severity-distribution": (stats) =>
    `Alert severity: ${stats.critical_pct ?? 0}% critical, ${stats.warning_pct ?? 0}% warning (total ${stats.total ?? 0}). Expected healthy: ~20% critical, ~80% warning. Write one short insight.`,
};

function templateFallback(stats, insightType) {
  switch (insightType) {
    case "alert-clustering":
      return `${stats.total_alerts ?? stats.total ?? 0} alerts occurred within a ${stats.time_window ?? "short"} window, suggesting ${(stats.clustering || "").toLowerCase() === "high" ? "a systematic issue" : "possible clustering"}.`;
    case "sensor-frequency":
      return `Sensor ${stats.sensor_name ?? "Unknown"} generated ${stats.percentage ?? 0}% of all alerts, making it the most problematic.`;
    case "threshold-analysis":
      return `Threshold configuration may be misconfigured for ${stats.sensor_type ?? "sensor"} (value: ${stats.value}, range: ${stats.threshold_min}-${stats.threshold_max}).`;
    case "severity-distribution":
      return `${stats.critical_pct ?? 0}% of alerts are critical. ${(stats.critical_pct ?? 0) > 50 ? "Consider relaxing thresholds to reduce critical alerts." : "Severity distribution is within expected range."}`;
    default:
      return `Insight for ${insightType}: review alert statistics.`;
  }
}

let groqClient = null;

function getClient() {
  if (!groqClient) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY not set");
    groqClient = new Groq({ apiKey: key });
  }
  return groqClient;
}

/**
 * Generate natural language insight from stats using Groq (Llama 3.1 70B).
 * Falls back to template if API fails.
 * @param {object} stats - Statistical data for the insight
 * @param {string} insightType - One of: alert-clustering, sensor-frequency, threshold-analysis, severity-distribution
 * @returns {Promise<string>} Natural language insight text
 */
export async function generateInsight(stats, insightType) {
  const promptFn = PROMPT_TEMPLATES[insightType];
  const userContent = promptFn ? promptFn(stats) : `Stats: ${JSON.stringify(stats)}. Write one short insight.`;

  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      max_tokens: 150,
      temperature: 0.5,
    });
    const text = completion?.choices?.[0]?.message?.content?.trim();
    if (text) return text;
    return templateFallback(stats, insightType);
  } catch (err) {
    console.error("❌ Groq API failed, using template:", err.message);
    return templateFallback(stats, insightType);
  }
}
