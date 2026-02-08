require('dotenv').config();
const chalk = require('chalk');
const simulateSensorData = require('./src/simulate');
const { connectProducer, sendSensorData } = require('./src/publisher');
const pool = require('./db');

/**
 * Get all individual sensors that need data generation
 * Returns array of { id, org_id, name, type, min, max, unit }
 */
async function getAllSensors() {
  try {
    const result = await pool.query(`
      SELECT id, org_id, name, type, min, max, unit
      FROM sensors
      WHERE delete_status = FALSE
      ORDER BY org_id, id
    `);
    
    return result.rows;
  } catch (error) {
    console.error(chalk.red('Error fetching sensors:'), error);
    return [];
  }
}

async function main() {
  console.log(chalk.blueBright('🚀 Starting sensor simulator for all organizations...'));

  await connectProducer();

  // Initial fetch of all sensors
  let allSensors = await getAllSensors();
  console.log(chalk.green(`✅ Found ${allSensors.length} sensor(s) to generate data for:`));
  const sensorsByOrg = {};
  allSensors.forEach(sensor => {
    if (!sensorsByOrg[sensor.org_id]) {
      sensorsByOrg[sensor.org_id] = [];
    }
    sensorsByOrg[sensor.org_id].push(sensor);
    console.log(chalk.cyan(`   - ${sensor.org_id}: ${sensor.name} (${sensor.type})`));
  });

  // Refresh sensor list every 30 seconds to pick up new sensors
  setInterval(async () => {
    allSensors = await getAllSensors();
    const newSensorsByOrg = {};
    allSensors.forEach(sensor => {
      if (!newSensorsByOrg[sensor.org_id]) {
        newSensorsByOrg[sensor.org_id] = [];
      }
      newSensorsByOrg[sensor.org_id].push(sensor);
    });
    Object.keys(newSensorsByOrg).forEach(orgId => {
      if (sensorsByOrg[orgId]?.length !== newSensorsByOrg[orgId].length) {
        console.log(chalk.yellow(`📊 Updated sensor list for ${orgId}: ${newSensorsByOrg[orgId].length} sensor(s)`));
      }
    });
    Object.assign(sensorsByOrg, newSensorsByOrg);
  }, 30000);

  // Generate and send data every 3 seconds
  setInterval(async () => {
    for (const sensor of allSensors) {
      // Generate data for each individual sensor
      const simulatedData = simulateSensorData(
        sensor.org_id, 
        sensor.type, 
        {
          min: sensor.min,
          max: sensor.max,
          unit: sensor.unit
        },
        sensor.id // Pass sensor ID
      );

      for (const reading of simulatedData) {
        await sendSensorData(reading);
      }
    }
  }, 3000); // every 3s
}

main().catch(console.error);
