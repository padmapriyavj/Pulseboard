require('dotenv').config();
const chalk = require('chalk');
const simulateSensorData = require('./src/simulate');
const { connectProducer, sendSensorData } = require('./src/publisher');

const ORG_ID = process.env.ORG_ID || 'acme-corp';

async function main() {
  console.log(chalk.blueBright(`Starting simulator for org: ${ORG_ID}`));

  await connectProducer();

  setInterval(async () => {
    const simulatedData = simulateSensorData(ORG_ID);

    for (const reading of simulatedData) {
      await sendSensorData(reading); 
    }
  }, 3000); // every 3s
}

main();
