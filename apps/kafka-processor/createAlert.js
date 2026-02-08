const pool = require('./db');

/**
 * Create an alert for threshold breach or anomaly
 */
async function createAlert(data) {
  try {
    // Get sensor information if sensor_id is available
    let sensorInfo = null;
    if (data.sensorId) {
      const sensorResult = await pool.query(
        'SELECT id, name, type, min, max, org_id FROM sensors WHERE id = $1 AND delete_status = FALSE',
        [data.sensorId]
      );
      if (sensorResult.rows.length > 0) {
        sensorInfo = sensorResult.rows[0];
      }
    }

    // Determine alert type and severity based on value and thresholds
    const value = Number(data.value);
    let alertType = 'threshold_breach';
    let severity = null; // Will be set based on conditions
    let message = '';
    let thresholdMin = null;
    let thresholdMax = null;

    if (sensorInfo) {
      thresholdMin = sensorInfo.min ? Number(sensorInfo.min) : null;
      thresholdMax = sensorInfo.max ? Number(sensorInfo.max) : null;

      // Check for threshold breaches FIRST (these take priority)
      if (thresholdMin !== null && value < thresholdMin) {
        severity = 'Critical';
        message = `Sensor value ${value.toFixed(2)} ${data.unit || ''} is below minimum threshold of ${thresholdMin} ${data.unit || ''}`;
        alertType = 'threshold_breach';
      } else if (thresholdMax !== null && value > thresholdMax) {
        severity = 'Critical';
        message = `Sensor value ${value.toFixed(2)} ${data.unit || ''} exceeds maximum threshold of ${thresholdMax} ${data.unit || ''}`;
        alertType = 'threshold_breach';
      } else if (data.status === 'CRITICAL') {
        severity = 'Critical';
        message = `Critical sensor reading: ${value.toFixed(2)} ${data.unit || ''}`;
        alertType = 'anomaly';
      } else if (data.status === 'WARNING') {
        // Create warning alerts for values approaching thresholds or other anomalies
        severity = 'Warning';
        if (thresholdMin !== null && thresholdMax !== null) {
          const range = thresholdMax - thresholdMin;
          const distanceFromMin = value - thresholdMin;
          const distanceFromMax = thresholdMax - value;
          // If within 10% of threshold boundaries, it's a warning
          const warningZone = Math.max(range * 0.1, 1); // At least 1 unit or 10% of range
          if (distanceFromMin < warningZone && distanceFromMin > 0) {
            message = `Warning: Sensor value ${value.toFixed(2)} ${data.unit || ''} is approaching minimum threshold of ${thresholdMin} ${data.unit || ''}`;
          } else if (distanceFromMax < warningZone && distanceFromMax > 0) {
            message = `Warning: Sensor value ${value.toFixed(2)} ${data.unit || ''} is approaching maximum threshold of ${thresholdMax} ${data.unit || ''}`;
          } else {
            message = `Warning: Sensor value ${value.toFixed(2)} ${data.unit || ''} indicates potential issue`;
          }
        } else {
          message = `Warning: Sensor value ${value.toFixed(2)} ${data.unit || ''} is outside normal range`;
        }
        alertType = 'anomaly';
      } else {
        // No alert needed for OK status within thresholds
        return null;
      }
    } else {
      // Fallback alert detection without sensor config
      if (data.status === 'CRITICAL') {
        severity = 'Critical';
        message = `Critical sensor reading: ${value.toFixed(2)} ${data.unit || ''}`;
        alertType = 'anomaly';
      } else if (data.status === 'WARNING') {
        severity = 'Warning';
        message = `Warning: Sensor value ${value.toFixed(2)} ${data.unit || ''}`;
        alertType = 'anomaly';
      } else {
        return null;
      }
    }

    // If no severity was set, don't create an alert
    if (!severity) {
      return null;
    }

    // Insert alert into database
    const insertQuery = `
      INSERT INTO alerts (
        org_id, sensor_id, sensor_name, sensor_type,
        alert_type, severity, message, value,
        threshold_min, threshold_max, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING id
    `;

    const result = await pool.query(insertQuery, [
      data.orgId,
      data.sensorId || null,
      sensorInfo?.name || null,
      data.sensorType || sensorInfo?.type || null,
      alertType,
      severity,
      message,
      value,
      thresholdMin,
      thresholdMax
    ]);

    return result.rows[0].id;
  } catch (error) {
    console.error('Error creating alert:', error);
    console.error('Alert data that failed:', {
      orgId: data.orgId,
      sensorId: data.sensorId,
      value: data.value,
      status: data.status
    });
    // Don't throw - alerts are non-critical
    return null;
  }
}

module.exports = createAlert;
