const pool = require('./db');

async function insertSensorData(data) {
  const query = `
    INSERT INTO sensor_metrics (
      device_id, sensor_type, org_id,
      value, unit, status, timestamp
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (device_id, timestamp) DO NOTHING
  `;

  // Ensure value is a number, not a string
  const numericValue = data.value !== null && data.value !== undefined 
    ? Number(data.value) 
    : null;

  const values = [
    data.deviceId,
    data.sensorType,
    data.orgId,
    numericValue,
    data.unit,
    data.status || 'OK', 
    data.timestamp,
  ];

  try {
    await pool.query(query, values);
  } catch (error) {
    console.error('Error inserting sensor data:', error);
    throw error;
  }
}

module.exports = insertSensorData;