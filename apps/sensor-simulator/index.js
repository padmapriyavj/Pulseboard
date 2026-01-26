require('dotenv').config();
const chalk = require('chalk');
const simulateSensorData = require('./src/simulate');
const { connectProducer, sendSensorData } = require('./src/publisher');
const pool = require('./db');

/**
 * Get all organizations that have sensors configured
 * Returns array of { org_id, sensor_types[] }
 */
async function getOrgsWithSensors() {
  try {
    const result = await pool.query(`
      SELECT 
        org_id,
        ARRAY_AGG(DISTINCT type) as sensor_types
      FROM sensors
      WHERE delete_status = FALSE
      GROUP BY org_id
    `);
    
    return result.rows.map(row => ({
      org_id: row.org_id,
      sensor_types: row.sensor_types || []
    }));
  } catch (error) {
    console.error(chalk.red('Error fetching orgs with sensors:'), error);
    // Fallback to all predefined orgs if database query fails
    const { ORGS } = require('../../libs/shared-config');
    return ORGS.map(org => ({ org_id: org.id, sensor_types: [] }));
  }
}

/**
 * Get sensor config for a specific org and sensor type
 */
async function getSensorConfig(orgId, sensorType) {
  try {
    const result = await pool.query(`
      SELECT min, max, unit, type
      FROM sensors
      WHERE org_id = $1 AND type = $2 AND delete_status = FALSE
      LIMIT 1
    `, [orgId, sensorType]);
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error(chalk.red(`Error fetching sensor config for ${orgId}/${sensorType}:`), error);
    return null;
  }
}

async function main() {
  console.log(chalk.blueBright('🚀 Starting sensor simulator for all organizations...'));

  await connectProducer();

  // Initial fetch of orgs with sensors
  let orgsWithSensors = await getOrgsWithSensors();
  console.log(chalk.green(`✅ Found ${orgsWithSensors.length} organization(s) with sensors:`));
  orgsWithSensors.forEach(org => {
    console.log(chalk.cyan(`   - ${org.org_id}: ${org.sensor_types.length} sensor type(s)`));
  });

  // Refresh org list every 30 seconds to pick up new sensors/orgs
  setInterval(async () => {
    orgsWithSensors = await getOrgsWithSensors();
  }, 30000);

  // Generate and send data every 3 seconds
  setInterval(async () => {
    for (const org of orgsWithSensors) {
      // Generate data for each sensor type in this org
      for (const sensorType of org.sensor_types) {
        // Get sensor config (min, max, unit) from database
        const config = await getSensorConfig(org.org_id, sensorType);
        
        if (config) {
          // Generate data using org-specific sensor config
          const simulatedData = simulateSensorData(org.org_id, sensorType, {
            min: config.min,
            max: config.max,
            unit: config.unit
          });

          for (const reading of simulatedData) {
            await sendSensorData(reading);
          }
        }
      }
    }
  }, 3000); // every 3s
}

main().catch(console.error);
