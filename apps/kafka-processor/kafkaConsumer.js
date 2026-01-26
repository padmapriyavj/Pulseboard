const { Kafka } = require("kafkajs");
require("dotenv").config();
const insertSensorData = require("./insertSensorData");

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

      if (data.value > 1000) {
        data.status = "CRITICAL";
      } else if (data.value > 500) {
        data.status = "WARNING";
      } else {
        data.status = "OK";
      }

      await insertSensorData(data);

      console.log(`✅ Stored data from topic: ${topic}`);
    },
  });
}

module.exports = runConsumer;
