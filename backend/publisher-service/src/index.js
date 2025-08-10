require('dotenv').config();
const { Kafka } = require('kafkajs');

const kafka = new Kafka({ brokers: process.env.KAFKA_BROKERS.split(',') });
const topic = process.env.KAFKA_TOPIC || 'telemetry.readings';
const deviceCount = parseInt(process.env.DEVICE_COUNT || '5', 10);
const intervalMs = parseInt(process.env.INTERVAL_MS || '1000', 10);

const devices = Array.from({ length: deviceCount }, (_, i) => `sensor-${i + 1}`);
const rand = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);
const statusFor = (t, h) => (t > 85 || h > 90 ? 'CRITICAL' : t > 70 || h > 80 ? 'WARNING' : 'OK');

(async () => {
  const producer = kafka.producer();
  await producer.connect();
  console.log('Publisher connected to Kafka');

  setInterval(async () => {
    const now = new Date().toISOString();
    const messages = devices.map(deviceId => {
      const temperature = rand(18, 95);
      const humidity = rand(20, 95);
      const pressure = rand(990, 1025);
      return {
        key: deviceId,
        value: JSON.stringify({
          deviceId, temperature, humidity, pressure,
          status: statusFor(temperature, humidity),
          timestamp: now
        })
      };
    });

    try {
      await producer.send({ topic, messages });
      // console.log(`Published ${messages.length} @ ${now}`);
    } catch (e) {
      console.error('Publish error:', e.message);
    }
  }, intervalMs);
})();
