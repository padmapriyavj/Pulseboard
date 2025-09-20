require("dotenv").config();
const { Kafka } = require("kafkajs");
const Redis = require("ioredis");
const { Pool } = require("pg");

const kafka = new Kafka({ brokers: process.env.KAFKA_BROKERS.split(",") });
const topic = process.env.KAFKA_TOPIC || "telemetry.readings";
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

const db = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

const groupId = "pulseboard-worker-1";
const latestByDevice = new Map();

function calculateStatus(temp, humidity, pressure) {
  const isTempCritical = temp > 85 || temp < 10;
  const isHumidityCritical = humidity > 90 || humidity < 10;
  const isPressureCritical = pressure > 1025 || pressure < 970;

  const isTempWarning = temp > 70 || temp < 15;
  const isHumidityWarning = humidity > 80 || humidity < 20;
  const isPressureWarning = pressure > 1018 || pressure < 980;

  if (isTempCritical || isHumidityCritical || isPressureCritical) {
    return "CRITICAL";
  } else if (isTempWarning || isHumidityWarning || isPressureWarning) {
    return "WARNING";
  } else {
    return "OK";
  }
}

(async () => {
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  console.log(" Worker connected to Kafka");
  await consumer.subscribe({ topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const payload = JSON.parse(message.value.toString());
        const status = calculateStatus(
          payload.temperature,
          payload.humidity,
          payload.pressure
        );
        if (status === "WARNING" || status === "CRITICAL") {
          console.warn(
            `[${status}] Anomaly detected from ${payload.deviceId} @ ${payload.timestamp} →`,
            `T: ${payload.temperature}, H: ${payload.humidity}, P: ${payload.pressure}`
          );
        }
        latestByDevice.set(payload.deviceId, { ...payload, status });
        const snapshot = Array.from(latestByDevice.values());
        await redis.set("latest-metrics", JSON.stringify(snapshot));

        await db.query(
          `INSERT INTO telemetry_readings (device_id, temperature, humidity, pressure, status, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            payload.deviceId,
            payload.temperature,
            payload.humidity,
            payload.pressure,
            calculateStatus(
              payload.temperature,
              payload.humidity,
              payload.pressure
            ),
            payload.timestamp,
          ]
        );
      } catch (e) {
        console.error("Worker error:", e.message);
      }
    },
  });
})();
