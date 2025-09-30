module.exports = {
  temperature: { min: 10, max: 40, unit: "°C" },
  humidity: { min: 30, max: 90, unit: "%" },
  pressure: { min: 900, max: 1100, unit: "hPa" },
  motion: { min: 0, max: 1, unit: "bool" },
  light: { min: 100, max: 1000, unit: "lux" },
  gas: { min: 200, max: 1000, unit: "ppm" },
  ultrasonic: { min: 2, max: 400, unit: "cm" },
  sound: { min: 30, max: 120, unit: "dB" },
  proximity: { min: 0, max: 5, unit: "bool" },
  voltage: { min: 3, max: 12, unit: "V" },
};
