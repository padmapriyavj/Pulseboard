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

  const values = [
    data.deviceId,
    data.sensorType,
    data.orgId,
    data.value,
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