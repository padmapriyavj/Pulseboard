const { gql } = require("apollo-server-express");
const redis = require("./redis");

const typeDefs = gql`
  type Metric {
    deviceId: String
    temperature: Float
    humidity: Float
    timestamp: String
  }

  type Query {
    metricsRecent: [Metric]
    health: String
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
  },
};

module.exports = { typeDefs, resolvers };
