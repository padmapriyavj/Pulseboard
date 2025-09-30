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

function simulateSensorData(orgId) {
  const now = new Date().toISOString();
  let stuckValueMap = {}; // cache for stuck values

  return SENSORS.map(sensorType => {
    const config = sensorConfig[sensorType] || { min: 0, max: 100, unit: 'unit' };
    const edgeCase = chooseEdgeCase();
    const prev = stuckValueMap[sensorType];
    const value = generateValueWithEdgeCases(config.min, config.max, edgeCase, prev);

    if (edgeCase === 'stuck') {
      stuckValueMap[sensorType] = value;
    }

    return {
      deviceId: uuidv4(),
      sensorType,
      value,
      unit: config.unit,
      timestamp: now,
      orgId
    };
  });
}

module.exports = simulateSensorData;
