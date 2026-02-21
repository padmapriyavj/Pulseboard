const pool = require('./db');

// 42703 = undefined_column (sensor_id missing in older DBs)
const UNDEFINED_COLUMN = '42703';

async function insertSensorData(data) {
  const numericValue = data.value !== null && data.value !== undefined
    ? Number(data.value)
    : null;

  const queryWithSensorId = `
    INSERT INTO sensor_metrics (
      device_id, sensor_type, org_id, sensor_id,
      value, unit, status, timestamp
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (device_id, timestamp) DO NOTHING
  `;
  const valuesWithSensorId = [
    data.deviceId,
    data.sensorType,
    data.orgId,
    data.sensorId || null,
    numericValue,
    data.unit,
    data.status || 'OK',
    data.timestamp,
  ];

  try {
    await pool.query(queryWithSensorId, valuesWithSensorId);
    return;
  } catch (error) {
    if (error.code === UNDEFINED_COLUMN && /sensor_id/.test(error.message)) {
      // Fallback when sensor_id column does not exist (run ./run_migrations.sh to add it)
      const queryWithoutSensorId = `
        INSERT INTO sensor_metrics (
          device_id, sensor_type, org_id,
          value, unit, status, timestamp
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (device_id, timestamp) DO NOTHING
      `;
      const valuesWithoutSensorId = [
        data.deviceId,
        data.sensorType,
        data.orgId,
        numericValue,
        data.unit,
        data.status || 'OK',
        data.timestamp,
      ];
      await pool.query(queryWithoutSensorId, valuesWithoutSensorId);
      return;
    }
    console.error('Error inserting sensor data:', error);
    throw error;
  }
}

module.exports = insertSensorData;