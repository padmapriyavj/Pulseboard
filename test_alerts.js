/**
 * Test script to verify alerts are being created in real-time
 * This script sends test sensor data that should trigger alerts
 * 
 * To run: node test_alerts.js
 * Make sure kafkajs is installed: npm install kafkajs
 */

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'alert-test-script',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

async function sendTestAlertData() {
  await producer.connect();
  console.log('✅ Connected to Kafka');

  // Test data that should trigger different types of alerts
  const testCases = [
    {
      name: 'Critical - Above Max Threshold',
      data: {
        deviceId: 'test-device-1',
        sensorType: 'temperature',
        orgId: 'google',
        sensorId: 6, // Temp-3 with threshold 20-30
        value: 35, // Above max of 30
        unit: '°C',
        timestamp: new Date().toISOString()
      },
      expectedAlert: 'Critical - threshold breach'
    },
    {
      name: 'Critical - Below Min Threshold',
      data: {
        deviceId: 'test-device-2',
        sensorType: 'temperature',
        orgId: 'google',
        sensorId: 6, // Temp-3 with threshold 20-30
        value: 15, // Below min of 20
        unit: '°C',
        timestamp: new Date().toISOString()
      },
      expectedAlert: 'Critical - threshold breach'
    },
    {
      name: 'Warning - Near Max Threshold',
      data: {
        deviceId: 'test-device-3',
        sensorType: 'temperature',
        orgId: 'google',
        sensorId: 6, // Temp-3 with threshold 20-30
        value: 28.5, // Near max of 30 (within 10% warning zone)
        unit: '°C',
        timestamp: new Date().toISOString()
      },
      expectedAlert: 'Warning - approaching threshold'
    },
    {
      name: 'Warning - Near Min Threshold',
      data: {
        deviceId: 'test-device-4',
        sensorType: 'temperature',
        orgId: 'google',
        sensorId: 6, // Temp-3 with threshold 20-30
        value: 21, // Near min of 20 (within 10% warning zone)
        unit: '°C',
        timestamp: new Date().toISOString()
      },
      expectedAlert: 'Warning - approaching threshold'
    },
    {
      name: 'OK - Within Normal Range',
      data: {
        deviceId: 'test-device-5',
        sensorType: 'temperature',
        orgId: 'google',
        sensorId: 6, // Temp-3 with threshold 20-30
        value: 25, // Normal value, should NOT create alert
        unit: '°C',
        timestamp: new Date().toISOString()
      },
      expectedAlert: 'No alert (normal value)'
    }
  ];

  console.log('\n📤 Sending test data...\n');

  for (const testCase of testCases) {
    const topic = `org-${testCase.data.orgId}.sensor-${testCase.data.sensorType}`;
    
    await producer.send({
      topic,
      messages: [{
        key: testCase.data.deviceId,
        value: JSON.stringify(testCase.data)
      }]
    });

    console.log(`✅ Sent: ${testCase.name}`);
    console.log(`   Value: ${testCase.data.value} ${testCase.data.unit}`);
    console.log(`   Expected: ${testCase.expectedAlert}`);
    console.log(`   Topic: ${topic}\n`);

    // Wait 2 seconds between sends
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('✅ All test data sent!');
  console.log('\n📋 Next steps:');
  console.log('1. Check the Alerts page in your dashboard');
  console.log('2. You should see Critical alerts for values 35 and 15');
  console.log('3. You should see Warning alerts for values 28.5 and 21');
  console.log('4. Value 25 should NOT create an alert');
  console.log('\n⏱️  Wait 5-10 seconds for kafka-processor to process the messages\n');

  await producer.disconnect();
}

sendTestAlertData().catch(console.error);
