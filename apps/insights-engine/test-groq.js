/**
 * Optional manual test for Groq LLM generator.
 * Run from apps/insights-engine: node test-groq.js
 */
import "dotenv/config";
import { generateInsight } from "./generators/llm.js";

async function test() {
  const result = await generateInsight(
    {
      total_alerts: 421,
      time_window: "1 minute",
      clustering: "high",
    },
    "alert-clustering"
  );
  console.log(result);
}

test().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
