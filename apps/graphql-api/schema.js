import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLList,
  GraphQLFloat,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLInt,
} from "graphql";
import pool from "./db.js";

const SensorMetricType = new GraphQLObjectType({
  name: "SensorMetric",
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
  name: "Sensor",
  fields: () => ({
    id: { type: GraphQLInt },
    org_id: { type: GraphQLString },
    name: { type: GraphQLString },
    type: { type: GraphQLString },
    min: { type: GraphQLFloat },
    max: { type: GraphQLFloat },
    unit: { type: GraphQLString },
    status: { type: GraphQLString },
  }),
});

/** Input for mutation */
const SensorInputType = new GraphQLInputObjectType({
  name: "SensorInput",
  fields: {
    org_id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: GraphQLString },
    type: { type: new GraphQLNonNull(GraphQLString) },
    min: { type: GraphQLFloat },
    max: { type: GraphQLFloat },
    unit: { type: GraphQLString },
    status: { type: GraphQLString },
  },
});

/** Input for update mutation */
const SensorUpdateInputType = new GraphQLInputObjectType({
  name: "SensorUpdateInput",
  fields: {
    name: { type: GraphQLString },
    type: { type: GraphQLString },
    min: { type: GraphQLFloat },
    max: { type: GraphQLFloat },
    unit: { type: GraphQLString },
    status: { type: GraphQLString },
  },
});

const SensorAccessLogType = new GraphQLObjectType({
  name: "SensorAccessLog",
  fields: () => ({
    id: { type: GraphQLInt },
    sensor_id: { type: GraphQLInt },
    org_id: { type: GraphQLString },
    accessed_at: { type: GraphQLString },
    sensor: { type: SensorConfigType },
  }),
});

/** Root Query */
const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    metrics: {
      type: new GraphQLList(SensorMetricType),
      args: {
        org_id: { type: GraphQLString },
        sensor_type: { type: GraphQLString },
        from_time: { type: GraphQLString },
        to_time: { type: GraphQLString },
        limit: { type: GraphQLInt },
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

        if (args.from_time) {
          where.push(`timestamp >= $${values.length + 1}`);
          values.push(args.from_time);
        }

        if (args.to_time) {
          where.push(`timestamp <= $${values.length + 1}`);
          values.push(args.to_time);
        }

        const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
        const limit = args.limit || 1000;
        const query = `SELECT * FROM sensor_metrics ${whereClause} ORDER BY timestamp DESC LIMIT $${
          values.length + 1
        }`;
        values.push(limit);

        const res = await pool.query(query, values);
        // Ensure timestamps are properly formatted as ISO strings
        return res.rows.map((row) => ({
          ...row,
          timestamp: row.timestamp
            ? new Date(row.timestamp).toISOString()
            : null,
        }));
      },
    },
    getSensors: {
      type: new GraphQLList(SensorConfigType),
      args: {
        org_id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_, { org_id }) => {
        const res = await pool.query(
          "SELECT * FROM sensors WHERE org_id = $1 AND delete_status = FALSE ORDER BY id DESC",
          [org_id]
        );
        return res.rows;
      },
    },
    getSensor: {
      type: SensorConfigType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (_, { id }) => {
        const res = await pool.query(
          "SELECT * FROM sensors WHERE id = $1 AND delete_status = FALSE",
          [id]
        );
        if (res.rows.length === 0) {
          throw new Error("Sensor not found");
        }
        return res.rows[0];
      },
    },
    recentlyAccessedSensors: {
      type: new GraphQLList(SensorConfigType),
      args: {
        org_id: { type: new GraphQLNonNull(GraphQLString) },
        limit: { type: GraphQLInt },
      },
      resolve: async (_, { org_id, limit = 5 }) => {
        const res = await pool.query(
          `
        SELECT s.*
        FROM sensor_access_log l
        JOIN sensors s ON l.sensor_id = s.id
        WHERE l.org_id = $1 AND s.delete_status = FALSE
        ORDER BY l.accessed_at DESC
        LIMIT $2
          `,
          [org_id, limit]
        );
        return res.rows;
      },
    },
  },
});

/** Mutations */
const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addSensor: {
      type: SensorConfigType,
      args: {
        input: { type: SensorInputType },
      },
      resolve: async (_, { input }) => {
        const { org_id, name, type, min, max, unit, status } = input;
        const now = new Date();

        const res = await pool.query(
          `INSERT INTO sensors (org_id, name, type, min, max, unit, status, created_at, updated_at, delete_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING *`,
          [org_id, name, type, min, max, unit, status, now, now, false]
        );

        return res.rows[0];
      },
    },
    updateSensor: {
      type: SensorConfigType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
        input: { type: SensorUpdateInputType },
      },
      resolve: async (_, { id, input }) => {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (input.name !== undefined && input.name !== null) {
          updates.push(`name = $${paramIndex++}`);
          values.push(input.name);
        }
        if (input.type !== undefined && input.type !== null) {
          updates.push(`type = $${paramIndex++}`);
          values.push(input.type);
        }
        if (input.min !== undefined && input.min !== null) {
          updates.push(`min = $${paramIndex++}`);
          values.push(input.min);
        }
        if (input.max !== undefined && input.max !== null) {
          updates.push(`max = $${paramIndex++}`);
          values.push(input.max);
        }
        if (input.unit !== undefined && input.unit !== null) {
          updates.push(`unit = $${paramIndex++}`);
          values.push(input.unit);
        }
        if (input.status !== undefined && input.status !== null) {
          updates.push(`status = $${paramIndex++}`);
          values.push(input.status);
        }

        if (updates.length === 0) {
          throw new Error("No fields to update");
        }

        // Always update updated_at timestamp
        updates.push(`updated_at = $${paramIndex++}`);
        values.push(new Date());

        values.push(id);
        const query = `UPDATE sensors SET ${updates.join(
          ", "
        )} WHERE id = $${paramIndex} AND delete_status = FALSE RETURNING *`;

        try {
          const res = await pool.query(query, values);
          if (res.rows.length === 0) {
            throw new Error("Sensor not found");
          }
          return res.rows[0];
        } catch (error) {
          console.error("Update sensor error:", error);
          throw new Error(`Failed to update sensor: ${error.message}`);
        }
      },
    },
    deleteSensor: {
      type: SensorConfigType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (_, { id }) => {
        // Soft delete: set delete_status to true and update updated_at
        const res = await pool.query(
          `UPDATE sensors 
           SET delete_status = TRUE, updated_at = $1 
           WHERE id = $2 AND delete_status = FALSE 
           RETURNING *`,
          [new Date(), id]
        );
        if (res.rows.length === 0) {
          throw new Error("Sensor not found or already deleted");
        }
        return res.rows[0];
      },
    },
    logSensorAccess: {
      type: GraphQLString,
      args: {
        sensor_id: { type: new GraphQLNonNull(GraphQLInt) },
        org_id: { type: new GraphQLNonNull(GraphQLString) },
      },

      resolve: async (_, { sensor_id, org_id }) => {
        await pool.query(
          `INSERT INTO sensor_access_log (sensor_id, org_id) VALUES ($1, $2)`,
          [sensor_id, org_id]
        );
        return "Access logged";
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
