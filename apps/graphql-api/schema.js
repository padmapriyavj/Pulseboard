import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLList,
  GraphQLFloat,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLBoolean,
} from "graphql";
import pool from "./db.js";

const SensorMetricType = new GraphQLObjectType({
  name: "SensorMetric",
  fields: () => ({
    device_id: { type: GraphQLString },
    org_id: { type: GraphQLString },
    sensor_type: { type: GraphQLString },
    sensor_id: { type: GraphQLInt }, // Add sensor_id field
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

/** Alert type */
const AlertType = new GraphQLObjectType({
  name: "Alert",
  fields: () => ({
    id: { type: GraphQLInt },
    org_id: { type: GraphQLString },
    sensor_id: { type: GraphQLInt },
    sensor_name: { type: GraphQLString },
    sensor_type: { type: GraphQLString },
    alert_type: { type: GraphQLString },
    severity: { type: GraphQLString },
    message: { type: GraphQLString },
    value: { type: GraphQLFloat },
    threshold_min: { type: GraphQLFloat },
    threshold_max: { type: GraphQLFloat },
    acknowledged: { type: GraphQLBoolean },
    acknowledged_at: { type: GraphQLString },
    created_at: { type: GraphQLString },
  }),
});

/** Insight type (AI-generated alert analysis) */
const InsightType = new GraphQLObjectType({
  name: "Insight",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLInt) },
    orgId: { type: new GraphQLNonNull(GraphQLString) },
    sensorId: { type: GraphQLInt },
    sensor: {
      type: SensorConfigType,
      resolve: async (parent) => {
        if (!parent.sensorId) return null;
        const res = await pool.query(
          "SELECT * FROM sensors WHERE id = $1 AND delete_status = FALSE",
          [parent.sensorId]
        );
        return res.rows[0] || null;
      },
    },
    insightType: { type: new GraphQLNonNull(GraphQLString) },
    insightText: { type: new GraphQLNonNull(GraphQLString) },
    severity: { type: new GraphQLNonNull(GraphQLString) },
    metadata: { type: GraphQLString },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

/** GenerateInsightsResponse type */
const GenerateInsightsResponseType = new GraphQLObjectType({
  name: "GenerateInsightsResponse",
  fields: () => ({
    success: { type: new GraphQLNonNull(GraphQLBoolean) },
    count: { type: new GraphQLNonNull(GraphQLInt) },
    duration: { type: new GraphQLNonNull(GraphQLString) },
    error: { type: GraphQLString },
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
        sensor_id: { type: GraphQLInt }, // Add sensor_id argument
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

        if (args.sensor_id) {
          where.push(`sensor_id = $${values.length + 1}`);
          values.push(args.sensor_id);
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
        // Use a subquery with ROW_NUMBER to get the most recent access per sensor,
        // then select only those rows and order by most recent access
        const res = await pool.query(
          `
        WITH ranked_access AS (
          SELECT 
            s.*,
            l.accessed_at,
            ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY l.accessed_at DESC) as rn
          FROM sensor_access_log l
          JOIN sensors s ON l.sensor_id = s.id
          WHERE l.org_id = $1 AND s.delete_status = FALSE
        )
        SELECT 
          id, org_id, name, type, min, max, unit, status, created_at, updated_at, delete_status
        FROM ranked_access
        WHERE rn = 1
        ORDER BY accessed_at DESC
        LIMIT $2
          `,
          [org_id, limit]
        );
        return res.rows;
      },
    },
    getAlerts: {
      type: new GraphQLList(AlertType),
      args: {
        org_id: { type: new GraphQLNonNull(GraphQLString) },
        severity: { type: GraphQLString },
        sensor_name: { type: GraphQLString },
        date_from: { type: GraphQLString },
        date_to: { type: GraphQLString },
        limit: { type: GraphQLInt },
        offset: { type: GraphQLInt },
      },
      resolve: async (_, { org_id, severity, sensor_name, date_from, date_to, limit = 50, offset = 0 }) => {
        const where = [`org_id = $1`];
        const values = [org_id];
        let paramIndex = 2;

        if (severity) {
          where.push(`severity = $${paramIndex}`);
          values.push(severity);
          paramIndex++;
        }

        if (sensor_name) {
          where.push(`sensor_name ILIKE $${paramIndex}`);
          values.push(`%${sensor_name}%`);
          paramIndex++;
        }

        if (date_from) {
          where.push(`created_at >= $${paramIndex}`);
          values.push(date_from);
          paramIndex++;
        }

        if (date_to) {
          // Add one day to include the entire "to" date
          const toDate = new Date(date_to);
          toDate.setDate(toDate.getDate() + 1);
          where.push(`created_at < $${paramIndex}`);
          values.push(toDate.toISOString());
          paramIndex++;
        }

        const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
        const query = `
          SELECT * FROM alerts 
          ${whereClause}
          ORDER BY created_at DESC 
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        values.push(limit, offset);

        const res = await pool.query(query, values);
        return res.rows.map((row) => ({
          ...row,
          acknowledged: Boolean(row.acknowledged),
          created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
          acknowledged_at: row.acknowledged_at ? new Date(row.acknowledged_at).toISOString() : null,
        }));
      },
    },
    getAlertSummary: {
      type: new GraphQLObjectType({
        name: "AlertSummary",
        fields: () => ({
          critical_count: { type: GraphQLInt },
          warning_count: { type: GraphQLInt },
          latest_critical_timestamp: { type: GraphQLString },
          latest_warning_timestamp: { type: GraphQLString },
        }),
      }),
      args: {
        org_id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_, { org_id }) => {
        // Get counts and latest timestamps for Critical and Warning alerts
        const result = await pool.query(
          `
          SELECT 
            COUNT(*) FILTER (WHERE severity = 'Critical') as critical_count,
            COUNT(*) FILTER (WHERE severity = 'Warning') as warning_count,
            MAX(created_at) FILTER (WHERE severity = 'Critical') as latest_critical_timestamp,
            MAX(created_at) FILTER (WHERE severity = 'Warning') as latest_warning_timestamp
          FROM alerts
          WHERE org_id = $1
          `,
          [org_id]
        );

        const row = result.rows[0];
        return {
          critical_count: parseInt(row.critical_count) || 0,
          warning_count: parseInt(row.warning_count) || 0,
          latest_critical_timestamp: row.latest_critical_timestamp 
            ? new Date(row.latest_critical_timestamp).toISOString() 
            : null,
          latest_warning_timestamp: row.latest_warning_timestamp 
            ? new Date(row.latest_warning_timestamp).toISOString() 
            : null,
        };
      },
    },
    insights: {
      type: new GraphQLList(InsightType),
      args: {
        orgId: { type: new GraphQLNonNull(GraphQLString) },
        limit: { type: GraphQLInt },
        insightType: { type: GraphQLString },
        severity: { type: GraphQLString },
      },
      resolve: async (_, { orgId, limit = 10, insightType, severity }, context) => {
        if (context?.user?.org_id && context.user.org_id !== orgId) {
          throw new Error("Unauthorized: orgId does not match your organization");
        }
        const where = ["org_id = $1"];
        const values = [orgId];
        let paramIndex = 2;
        if (insightType) {
          where.push(`insight_type = $${paramIndex++}`);
          values.push(insightType);
        }
        if (severity) {
          where.push(`severity = $${paramIndex++}`);
          values.push(severity);
        }
        values.push(limit);
        const res = await pool.query(
          `SELECT id, org_id AS "orgId", sensor_id AS "sensorId", insight_type AS "insightType",
                  insight_text AS "insightText", severity, metadata, created_at AS "createdAt"
           FROM insights
           WHERE ${where.join(" AND ")}
           ORDER BY created_at DESC
           LIMIT $${values.length}`,
          values
        );
        return res.rows.map((row) => ({
          ...row,
          metadata: row.metadata != null ? JSON.stringify(row.metadata) : null,
          createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
        }));
      },
    },
    latestInsights: {
      type: new GraphQLList(InsightType),
      args: {
        orgId: { type: new GraphQLNonNull(GraphQLString) },
        limit: { type: GraphQLInt },
      },
      resolve: async (_, { orgId, limit = 5 }, context) => {
        if (context?.user?.org_id && context.user.org_id !== orgId) {
          throw new Error("Unauthorized: orgId does not match your organization");
        }
        const res = await pool.query(
          `SELECT id, org_id AS "orgId", sensor_id AS "sensorId", insight_type AS "insightType",
                  insight_text AS "insightText", severity, metadata, created_at AS "createdAt"
           FROM insights
           WHERE org_id = $1
           ORDER BY created_at DESC
           LIMIT $2`,
          [orgId, limit]
        );
        return res.rows.map((row) => ({
          ...row,
          metadata: row.metadata != null ? JSON.stringify(row.metadata) : null,
          createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
        }));
      },
    },
    insightsForSensor: {
      type: new GraphQLList(InsightType),
      args: {
        sensorId: { type: new GraphQLNonNull(GraphQLInt) },
        limit: { type: GraphQLInt },
      },
      resolve: async (_, { sensorId, limit = 5 }) => {
        const res = await pool.query(
          `SELECT id, org_id AS "orgId", sensor_id AS "sensorId", insight_type AS "insightType",
                  insight_text AS "insightText", severity, metadata, created_at AS "createdAt"
           FROM insights
           WHERE sensor_id = $1
           ORDER BY created_at DESC
           LIMIT $2`,
          [sensorId, limit]
        );
        return res.rows.map((row) => ({
          ...row,
          metadata: row.metadata != null ? JSON.stringify(row.metadata) : null,
          createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
        }));
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
    acknowledgeAlert: {
      type: AlertType,
      args: {
        alert_id: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (_, { alert_id }) => {
        const res = await pool.query(
          `UPDATE alerts 
           SET acknowledged = TRUE, acknowledged_at = NOW()
           WHERE id = $1 
           RETURNING *`,
          [alert_id]
        );
        if (res.rows.length === 0) {
          throw new Error("Alert not found");
        }
        const row = res.rows[0];
        return {
          ...row,
          acknowledged: Boolean(row.acknowledged),
          created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
          acknowledged_at: row.acknowledged_at ? new Date(row.acknowledged_at).toISOString() : null,
        };
      },
    },
    deleteAlert: {
      type: GraphQLString,
      args: {
        alert_id: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (_, { alert_id }) => {
        const res = await pool.query(
          `DELETE FROM alerts WHERE id = $1 RETURNING id`,
          [alert_id]
        );
        if (res.rows.length === 0) {
          throw new Error("Alert not found");
        }
        return "Alert deleted";
      },
    },
    generateInsights: {
      type: GenerateInsightsResponseType,
      args: {
        orgId: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_, { orgId }, context) => {
        if (context?.user?.org_id && context.user.org_id !== orgId) {
          throw new Error("Unauthorized: orgId does not match your organization");
        }
        const baseUrl = process.env.INSIGHTS_ENGINE_URL || "http://localhost:5004";
        try {
          const res = await fetch(`${baseUrl}/generate/${encodeURIComponent(orgId)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          const data = await res.json();
          if (!res.ok) {
            return {
              success: false,
              count: 0,
              duration: "0",
              error: data.error || res.statusText,
            };
          }
          return {
            success: data.success ?? true,
            count: data.count ?? 0,
            duration: String(data.duration ?? "0"),
            error: null,
          };
        } catch (err) {
          console.error("generateInsights failed:", err.message);
          return {
            success: false,
            count: 0,
            duration: "0",
            error: err.message,
          };
        }
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
