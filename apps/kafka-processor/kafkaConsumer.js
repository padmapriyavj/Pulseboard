const { Kafka } = require("kafkajs");
require("dotenv").config();
const insertSensorData = require("./insertSensorData");
const createAlert = require("./createAlert");
const pool = require("./db");

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "kafka-processor",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const groupId = process.env.KAFKA_GROUP_ID || "sensor-processors";

const consumer = kafka.consumer({ groupId });

/** Matches publisher: `org-${orgId}.sensor-${type}` (see sensor-simulator/src/publisher.js) */
function topicNameForSensor(orgId, type) {
  return `org-${orgId}.sensor-${type}`;
}

/**
 * Distinct Kafka topics for all non-deleted, active sensors.
 * Multiple DB rows with same org+type share one topic (same as producer).
 */
async function getSensorTopicsFromDb() {
  const result = await pool.query(`
    SELECT DISTINCT org_id, type
    FROM sensors
    WHERE COALESCE(delete_status, FALSE) = FALSE
      AND (
        status IS NULL
        OR TRIM(status) = ''
        OR LOWER(TRIM(status)) = 'active'
      )
  `);
  return result.rows.map((r) => topicNameForSensor(r.org_id, r.type));
}

async function handleEachMessage({ topic, message }) {
  const data = JSON.parse(message.value.toString());

  let sensorConfig = null;
  if (data.sensorId) {
    try {
      const sensorResult = await pool.query(
        "SELECT min, max FROM sensors WHERE id = $1 AND COALESCE(delete_status, FALSE) = FALSE",
        [data.sensorId]
      );
      if (sensorResult.rows.length > 0) {
        sensorConfig = sensorResult.rows[0];
      }
    } catch (err) {
      console.error("Error fetching sensor config:", err);
    }
  }

  const value = Number(data.value);
  if (sensorConfig && sensorConfig.min !== null && sensorConfig.max !== null) {
    const min = Number(sensorConfig.min);
    const max = Number(sensorConfig.max);
    const range = max - min;
    const warningZone = Math.max(range * 0.1, 1);

    if (value < min || value > max) {
      data.status = "CRITICAL";
    } else if (
      (value >= min && value < min + warningZone) ||
      (value <= max && value > max - warningZone)
    ) {
      data.status = "WARNING";
    } else {
      data.status = "OK";
    }
  } else {
    if (value > 1000) {
      data.status = "CRITICAL";
    } else if (value > 500) {
      data.status = "WARNING";
    } else {
      data.status = "OK";
    }
  }

  await insertSensorData(data);

  try {
    const alertId = await createAlert(data);
    if (alertId) {
      console.log(
        `⚠️  Alert created: ${alertId} for sensor ${data.sensorId || data.sensorType}`
      );
    }
  } catch (alertError) {
    console.error("Error in alert creation (non-fatal):", alertError);
  }

  console.log(`✅ Stored data from topic: ${topic}`);
}

/**
 * KafkaJS expands RegExp subscriptions only once at subscribe() time — new topics
 * created later are never added. We periodically re-query the DB and call
 * stop → subscribe (explicit topic list) → run so new org/sensor topics are consumed.
 */
async function runConsumer() {
  const topicRefreshMs = parseInt(
    process.env.KAFKA_TOPIC_REFRESH_INTERVAL_MS || "30000",
    10
  );

  let isRunning = false;
  let lastTopicSignature = "";
  let refreshLock = false;

  await consumer.connect();
  console.log(
    `[kafka-processor] Connected (group: ${groupId}). Topic refresh every ${topicRefreshMs}ms`
  );

  async function syncSubscription() {
    if (refreshLock) return;
    refreshLock = true;
    try {
      let topics;
      try {
        topics = await getSensorTopicsFromDb();
      } catch (e) {
        console.error(
          "[kafka-processor] DB error while loading sensor topics (will retry):",
          e.message
        );
        return;
      }

      if (topics.length === 0) {
        if (isRunning) {
          console.log(
            "[kafka-processor] No active sensors — stopping consumer until sensors exist"
          );
          await consumer.stop();
          isRunning = false;
          lastTopicSignature = "";
        } else {
          console.log(
            "[kafka-processor] No active sensors in DB yet — waiting (refresh continues)"
          );
        }
        return;
      }

      const signature = topics.slice().sort().join("|");
      if (signature === lastTopicSignature && isRunning) {
        return;
      }

      if (isRunning) {
        console.log(
          "[kafka-processor] Topic set changed — stopping consumer to pick up new Kafka topics"
        );
        await consumer.stop();
        isRunning = false;
      }

      await consumer.subscribe({ topics, fromBeginning: false });
      lastTopicSignature = signature;
      isRunning = true;

      console.log(
        `[kafka-processor] ✅ Subscribed to ${topics.length} topic(s): ${topics.join(", ")}`
      );

      // consumer.run() does not resolve while the consumer is active — do not await,
      // otherwise periodic DB-driven re-subscription would never run.
      consumer.run({ eachMessage: handleEachMessage }).catch((e) => {
        console.error("[kafka-processor] consumer.run error:", e);
        isRunning = false;
      });
    } catch (e) {
      console.error("[kafka-processor] syncSubscription failed:", e);
      isRunning = false;
    } finally {
      refreshLock = false;
    }
  }

  await syncSubscription();

  setInterval(() => {
    syncSubscription().catch((e) =>
      console.error("[kafka-processor] periodic sync error:", e)
    );
  }, topicRefreshMs);
}

module.exports = runConsumer;
