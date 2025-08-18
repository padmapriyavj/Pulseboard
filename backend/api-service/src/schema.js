const { gql } = require("apollo-server-express");
const redis = require("./redis");
const db = require("./pg");

const typeDefs = gql`
  type Metric {
    deviceId: String
    temperature: Float
    humidity: Float
    pressure: Float
    status: String
    timestamp: String
  }

  type Query {
    metricsRecent: [Metric]
    health: String
    metricsHistory(deviceId: String!, start: String!, end: String!): [Metric]
  }
`;

const resolvers = {
  Query: {
    health: () => "PulseBoard API is live!",
    metricsRecent: async () => {
      const raw = await redis.get("latest-metrics");
      if (!raw) return [];
      return JSON.parse(raw);
    },
    metricsHistory: async (_, { deviceId, start, end }) => {
      try {
        const result = await db.query(
          `SELECT device_id, temperature, humidity, pressure, status, timestamp
           FROM telemetry_readings
           WHERE device_id = $1 AND timestamp BETWEEN $2 AND $3
           ORDER BY timestamp ASC`,
          [deviceId, start, end] 
        );

        return result.rows.map((row) => ({
          deviceId: row.device_id,
          temperature: row.temperature,
          humidity: row.humidity,
          pressure: row.pressure,
          status: row.status,
          timestamp: row.timestamp.toISOString(),
        }));
      } catch (err) {
        console.error("Error fetching metricsHistory", err.message);
        return [];
      }
    },
  },
};

module.exports = { typeDefs, resolvers };
