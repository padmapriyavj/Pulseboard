require('dotenv').config();
const { Kafka } = require('kafkajs');
const Redis = require('ioredis');

const kafka = new Kafka({ brokers: process.env.KAFKA_BROKERS.split(',') });
const topic = process.env.KAFKA_TOPIC || 'telemetry.readings';
const redis = new Redis({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT });

const groupId = 'pulseboard-worker-1';
const latestByDevice = new Map();

(async () => {
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  console.log('✅ Worker connected to Kafka');
  await consumer.subscribe({ topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const payload = JSON.parse(message.value.toString());
        latestByDevice.set(payload.deviceId, payload);
        const snapshot = Array.from(latestByDevice.values());
        await redis.set('latest-metrics', JSON.stringify(snapshot));
      } catch (e) {
        console.error('Consume error:', e.message);
      }
    }
  });
})();
