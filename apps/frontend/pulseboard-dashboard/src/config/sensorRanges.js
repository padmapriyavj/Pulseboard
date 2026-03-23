/**
 * Typical / recommended threshold ranges for sensor configuration (UI guidance).
 * Aligns with apps/sensor-simulator/src/sensorConfig.js — keep in sync when changing sim behavior.
 */
export const sensorRanges = {
  temperature: { min: 10, max: 40, unit: "°C", kind: "numeric" },
  humidity: { min: 30, max: 90, unit: "%", kind: "numeric" },
  pressure: { min: 900, max: 1100, unit: "hPa", kind: "numeric" },
  motion: {
    min: 0,
    max: 1,
    unit: "binary",
    kind: "boolean",
    helper:
      "Binary sensor (0 or 1). 0 = no motion, 1 = motion detected. You can still set other thresholds if needed.",
  },
  light: { min: 100, max: 1000, unit: "lux", kind: "numeric" },
  gas: { min: 200, max: 1000, unit: "ppm", kind: "numeric" },
  ultrasonic: { min: 2, max: 400, unit: "cm", kind: "numeric" },
  sound: { min: 30, max: 120, unit: "dB", kind: "numeric" },
  proximity: {
    min: 0,
    max: 5,
    unit: "binary",
    kind: "boolean",
    helper:
      "Discrete / proximity levels: typical 0–5 (simulator-style). Often used as 0 = none, 1 = detected. Custom values are allowed.",
  },
  voltage: { min: 3, max: 12, unit: "V", kind: "numeric" },
};

export function getSensorRange(type) {
  return type ? sensorRanges[type] : null;
}
