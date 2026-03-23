require("dotenv").config();
const chalk = require("chalk");
const simulateSensorData = require("./src/simulate");
const { connectProducer, sendSensorData } = require("./src/publisher");
const pool = require("./db");

const REFRESH_MS = parseInt(process.env.SENSOR_REFRESH_INTERVAL_MS || "30000", 10);
const DATA_INTERVAL_MS = parseInt(process.env.SENSOR_DATA_INTERVAL_MS || "3000", 10);

/**
 * Active sensors for data generation (non-deleted, active status).
 * Uses a container so the generation loop always reads the latest array reference.
 */
const sensorState = { list: [] };

let refreshInFlight = false;

/**
 * Load sensors from DB. Only active rows generate data.
 */
async function fetchActiveSensors() {
  const result = await pool.query(`
    SELECT id, org_id, name, type, min, max, unit, status
    FROM sensors
    WHERE COALESCE(delete_status, FALSE) = FALSE
      AND (
        status IS NULL
        OR TRIM(status) = ''
        OR LOWER(TRIM(status)) = 'active'
      )
    ORDER BY org_id, id
  `);
  return result.rows;
}

function applySensorDiff(prevList, nextList) {
  const prevIds = new Set(prevList.map((s) => s.id));
  const nextIds = new Set(nextList.map((s) => s.id));
  const added = nextList.filter((s) => !prevIds.has(s.id));
  const removed = prevList.filter((s) => !nextIds.has(s.id));
  return { added, removed };
}

async function refreshSensors(reason) {
  if (refreshInFlight) return;
  refreshInFlight = true;
  try {
    let rows;
    try {
      rows = await fetchActiveSensors();
    } catch (error) {
      console.error(
        chalk.red(`[sensor-simulator] Sensor refresh failed (${reason}):`),
        error.message || error
      );
      return;
    }

    const prev = sensorState.list;
    const { added, removed } = applySensorDiff(prev, rows);

    sensorState.list = rows;

    if (reason === "initial") {
      console.log(
        chalk.green(
          `[sensor-simulator] Initial load: ${rows.length} active sensor(s)`
        )
      );
    } else if (added.length || removed.length) {
      console.log(
        chalk.yellow(
          `[sensor-simulator] Sensor list updated (${reason}): +${added.length} / -${removed.length}`
        )
      );
      added.forEach((s) =>
        console.log(
          chalk.cyan(
            `   + id=${s.id} org=${s.org_id} ${s.name || s.type} (${s.type})`
          )
        )
      );
      removed.forEach((s) =>
        console.log(
          chalk.gray(
            `   - id=${s.id} org=${s.org_id} ${s.name || s.type} (${s.type})`
          )
        )
      );
    }
  } finally {
    refreshInFlight = false;
  }
}

async function main() {
  console.log(
    chalk.blueBright(
      `🚀 Sensor simulator — data every ${DATA_INTERVAL_MS}ms, DB refresh every ${REFRESH_MS}ms`
    )
  );

  await connectProducer();

  await refreshSensors("initial");

  sensorState.list.forEach((sensor) => {
    console.log(
      chalk.cyan(
        `   - ${sensor.org_id}: ${sensor.name || "(unnamed)"} (${sensor.type}) id=${sensor.id}`
      )
    );
  });

  setInterval(() => {
    refreshSensors("interval").catch((e) =>
      console.error(chalk.red("[sensor-simulator] refresh error:"), e)
    );
  }, REFRESH_MS);

  setInterval(async () => {
    const sensors = sensorState.list;
    if (sensors.length === 0) {
      return;
    }
    for (const sensor of sensors) {
      const simulatedData = simulateSensorData(
        sensor.org_id,
        sensor.type,
        {
          min: sensor.min,
          max: sensor.max,
          unit: sensor.unit,
        },
        sensor.id
      );

      for (const reading of simulatedData) {
        await sendSensorData(reading);
      }
    }
  }, DATA_INTERVAL_MS);
}

main().catch(console.error);
