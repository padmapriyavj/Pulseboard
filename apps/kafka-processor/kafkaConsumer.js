const { Kafka } = require("kafkajs");
require("dotenv").config();
const insertSensorData = require("./insertSensorData");
const createAlert = require("./createAlert");

const kafka = new Kafka({
  clientId: "kafka-processor",
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const consumer = kafka.consumer({ groupId: "sensor-processors" });

async function runConsumer() {
  await consumer.connect();

  await consumer.subscribe({ topic: /^org-.*sensor-.*/, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse(message.value.toString());

      // Get sensor config to determine status based on thresholds
      let sensorConfig = null;
      if (data.sensorId) {
        const pool = require('./db');
        try {
          const sensorResult = await pool.query(
            'SELECT min, max FROM sensors WHERE id = $1 AND delete_status = FALSE',
            [data.sensorId]
          );
          if (sensorResult.rows.length > 0) {
            sensorConfig = sensorResult.rows[0];
          }
        } catch (err) {
          console.error('Error fetching sensor config:', err);
        }
      }

      // Determine status based on sensor thresholds if available, otherwise use default logic
      const value = Number(data.value);
      if (sensorConfig && sensorConfig.min !== null && sensorConfig.max !== null) {
        const min = Number(sensorConfig.min);
        const max = Number(sensorConfig.max);
        const range = max - min;
        const warningZone = Math.max(range * 0.1, 1); // At least 1 unit or 10% of range
        
        if (value < min || value > max) {
          data.status = "CRITICAL";
        } else if ((value >= min && value < min + warningZone) || (value <= max && value > max - warningZone)) {
          // Within warning zone (10% of range from thresholds) = warning
          data.status = "WARNING";
        } else {
          data.status = "OK";
        }
      } else {
        // Fallback to basic anomaly detection
        if (value > 1000) {
          data.status = "CRITICAL";
        } else if (value > 500) {
          data.status = "WARNING";
        } else {
          data.status = "OK";
        }
      }

      // Insert sensor data
      await insertSensorData(data);

      // Check for alerts (threshold breaches and anomalies)
      try {
        const alertId = await createAlert(data);
        if (alertId) {
          console.log(`⚠️  Alert created: ${alertId} for sensor ${data.sensorId || data.sensorType}`);
        }
      } catch (alertError) {
        console.error('Error in alert creation (non-fatal):', alertError);
      }

      console.log(`✅ Stored data from topic: ${topic}`);
    },
  });
}

module.exports = runConsumer;
