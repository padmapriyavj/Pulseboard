import { GraphQLObjectType, GraphQLSchema, GraphQLList, GraphQLFloat, GraphQLString } from 'graphql';
import pool from './db.js';

const SensorMetricType = new GraphQLObjectType({
  name: 'SensorMetric',
  fields: () => ({
    device_id: { type: GraphQLString },
    org_id: { type: GraphQLString },
    sensor_type: { type: GraphQLString },
    value: { type: GraphQLFloat },
    unit: { type: GraphQLString },
    status: { type: GraphQLString },
    timestamp: { type: GraphQLString },
  }),
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    metrics: {
      type: new GraphQLList(SensorMetricType),
      args: {
        org_id: { type: GraphQLString },
        sensor_type: { type: GraphQLString },
      },
      resolve: async (_, args) => {
        const where = [];
        const values = [];

        if (args.org_id) {
          where.push(`org_id = $${values.length + 1}`);
          values.push(args.org_id);
        }

        if (args.sensor_type) {
          where.push(`sensor_type = $${values.length + 1}`);
          values.push(args.sensor_type);
        }

        const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const query = `SELECT * FROM sensor_metrics ${whereClause} ORDER BY timestamp DESC LIMIT 100`;

        const res = await pool.query(query, values);
        return res.rows;
      },
    },
  },
});

const schema = new GraphQLSchema({
  query: RootQuery,
});

export default schema;
