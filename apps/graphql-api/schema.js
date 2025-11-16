import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLList,
  GraphQLFloat,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLInt,
} from 'graphql';
import pool from './db.js';

/** Existing type */
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

/** New sensor config type */
const SensorConfigType = new GraphQLObjectType({
  name: 'Sensor',
  fields: () => ({
    id: { type: GraphQLInt },
    org_id: { type: GraphQLString },
    type: { type: GraphQLString },
    min: { type: GraphQLFloat },
    max: { type: GraphQLFloat },
    unit: { type: GraphQLString },
    status: { type: GraphQLString },
  }),
});

/** Input for mutation */
const SensorInputType = new GraphQLInputObjectType({
  name: 'SensorInput',
  fields: {
    org_id: { type: new GraphQLNonNull(GraphQLString) },
    type: { type: new GraphQLNonNull(GraphQLString) },
    min: { type: GraphQLFloat },
    max: { type: GraphQLFloat },
    unit: { type: GraphQLString },
    status: { type: GraphQLString },
  },
});

/** Root Query */
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
    getSensors: {
      type: new GraphQLList(SensorConfigType),
      args: {
        org_id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_, { org_id }) => {
        const res = await pool.query(
          'SELECT * FROM sensors WHERE org_id = $1 ORDER BY id DESC',
          [org_id]
        );
        return res.rows;
      },
    },
  },
});

/** Mutations */
const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addSensor: {
      type: SensorConfigType,
      args: {
        input: { type: SensorInputType },
      },
      resolve: async (_, { input }) => {
        const { org_id, type, min, max, unit, status } = input;

        const res = await pool.query(
          `INSERT INTO sensors (org_id, type, min, max, unit, status)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [org_id, type, min, max, unit, status]
        );

        return res.rows[0];
      },
    },
  },
});

/** Export schema */
const schema = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});

export default schema;
