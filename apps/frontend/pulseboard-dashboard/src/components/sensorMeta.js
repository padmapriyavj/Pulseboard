const sensorMetadata = {
    temperature: { unit: "°C", min: -40, max: 125 },
    humidity: { unit: "%", min: 0, max: 100 },
    pressure: { unit: "hPa", min: 300, max: 1100 },
    motion: { unit: "m/s²", min: 0, max: 16 },
    light: { unit: "lux", min: 0, max: 10000 },
    gas: { unit: "ppm", min: 0, max: 1000 },
    ultrasonic: { unit: "cm", min: 2, max: 400 },
    sound: { unit: "dB", min: 30, max: 120 },
    proximity: { unit: "cm", min: 0, max: 100 },
    voltage: { unit: "V", min: 0, max: 5 }
  };
  
  export default sensorMetadata;
  