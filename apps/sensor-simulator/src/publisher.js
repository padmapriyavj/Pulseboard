const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'sensor-simulator',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();
const admin = kafka.admin();

async function connectProducer() {
  await producer.connect();
  await admin.connect();
  console.log('✅ Kafka Producer connected');
}

async function ensureTopicExists(topic) {
    const topics = await admin.listTopics();
    if (!topics.includes(topic)) {
      console.log(`📁 Creating topic: ${topic}`);
      await admin.createTopics({
        topics: [{ topic, numPartitions: 1, replicationFactor: 1 }],
      });
    }
  }
  

async function sendSensorData(reading) {
  const topic = `org-${reading.orgId}.sensor-${reading.sensorType}`;
  await ensureTopicExists(topic);

  await producer.send({
    topic,
    messages: [
      {
        key: reading.deviceId,
        value: JSON.stringify(reading),
      },
    ],
  });

  console.log(`📤 Sent to ${topic}:`, reading.value);
}

module.exports = {
  connectProducer,
  sendSensorData,
};
