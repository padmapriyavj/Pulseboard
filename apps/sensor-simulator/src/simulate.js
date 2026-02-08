const { SENSORS } = require('../../../libs/shared-config');
const { v4: uuidv4 } = require('uuid');
const sensorConfig = require('./sensorConfig');

function generateValueWithEdgeCases(min, max, edgeCaseType, previousValue) {
  switch (edgeCaseType) {
    case 'null':
      return null;

    case 'spike':
      return max * 5; // extreme spike

    case 'stuck':
      return previousValue ?? min; // reuse last value

    case 'noise':
      const base = Math.random() * (max - min) + min;
      return base + (Math.random() - 0.5) * 10; // jitter

    default: // normal
      return Math.random() * (max - min) + min;
  }
}

function chooseEdgeCase() {
  const chance = Math.random();
  if (chance < 0.05) return 'null';
  if (chance < 0.10) return 'spike';
  if (chance < 0.15) return 'stuck';
  if (chance < 0.20) return 'noise';
  return 'normal';
}

// Global cache for stuck values per org and sensor type
const stuckValueMap = {};

function simulateSensorData(orgId, sensorType, customConfig = null, sensorId = null) {
  const now = new Date().toISOString();
  
  // Use custom config if provided, otherwise fall back to default config
  const config = customConfig || sensorConfig[sensorType] || { min: 0, max: 100, unit: 'unit' };
  
  // Ensure min and max are numbers (database may return them as strings)
  const min = Number(config.min) || 0;
  const max = Number(config.max) || 100;
  
  const edgeCase = chooseEdgeCase();
  // Use sensorId in cache key if available, otherwise fall back to orgId_sensorType
  const cacheKey = sensorId ? `${sensorId}` : `${orgId}_${sensorType}`;
  const prev = stuckValueMap[cacheKey];
  const value = generateValueWithEdgeCases(min, max, edgeCase, prev);

  if (edgeCase === 'stuck') {
    stuckValueMap[cacheKey] = value;
  }

  return [{
    deviceId: uuidv4(),
    sensorType,
    sensorId: sensorId, // Include sensor ID to link metrics to specific sensor
    value: Number(value), // Ensure value is a number, not a string
    unit: config.unit || 'unit',
    timestamp: now,
    orgId
  }];
}

module.exports = simulateSensorData;
