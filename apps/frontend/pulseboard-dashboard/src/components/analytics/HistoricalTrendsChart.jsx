import React, { useMemo, useEffect, useState, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
} from "recharts";
import "./HistoricalTrendsChart.css";

export const SENSOR_COLORS = [
  "#F4F96B",
  "#10B981",
  "#3B82F6",
  "#EF4444",
  "#8B5CF6",
  "#F59E0B",
  "#EC4899",
  "#14B8A6",
];

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CHART_POINTS = 1000;

function parseYMD(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function processChartData(timeSeries, seriesMeta) {
  if (!timeSeries?.length || !seriesMeta?.length) return [];
  const metaById = new Map(seriesMeta.map((m) => [m.id, m]));
  const grouped = {};

  timeSeries.forEach((point) => {
    const meta = metaById.get(point.sensorId);
    if (!meta) return;
    const t = point.timestamp;
    if (!t) return;
    if (!grouped[t]) {
      grouped[t] = {
        timestamp: t,
        sortTs: new Date(t).getTime(),
      };
    }
    grouped[t][meta.dataKey] =
      point.value != null && !Number.isNaN(point.value) ? point.value : null;
  });

  return Object.values(grouped).sort((a, b) => a.sortTs - b.sortTs);
}

function downsampleRows(rows, dataKeys, maxPoints) {
  if (rows.length <= maxPoints) return rows;
  const factor = Math.ceil(rows.length / maxPoints);
  const out = [];
  for (let i = 0; i < rows.length; i += factor) {
    const slice = rows.slice(i, Math.min(i + factor, rows.length));
    const base = { ...slice[0] };
    dataKeys.forEach((dk) => {
      const vals = slice
        .map((r) => r[dk])
        .filter((v) => v != null && !Number.isNaN(v));
      base[dk] = vals.length
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : undefined;
    });
    base.sortTs = slice[0].sortTs;
    base.timestamp = slice[0].timestamp;
    out.push(base);
  }
  return out;
}

function useChartHeight() {
  const [h, setH] = useState(400);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w <= 768) setH(300);
      else if (w <= 1024) setH(350);
      else setH(400);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return h;
}

function useTickFormatter(startDateStr, endDateStr) {
  return useMemo(() => {
    const a = parseYMD(startDateStr);
    const b = parseYMD(endDateStr);
    const days =
      a && b ? Math.max(1, Math.round((b - a) / DAY_MS) + 1) : 30;
    return (ts) => {
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) return "";
      if (days <= 7) {
        return d.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      }
      if (days <= 30) {
        return d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
      }
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };
  }, [startDateStr, endDateStr]);
}

function formatTooltipTime(tsIso) {
  const d = new Date(tsIso);
  if (Number.isNaN(d.getTime())) return String(tsIso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ChartTooltip({ active, payload, metaByKey }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const tsIso = row?.timestamp;
  const visiblePayload = payload.filter(
    (p) => p.value != null && !Number.isNaN(p.value)
  );
  if (!visiblePayload.length || !tsIso) return null;

  return (
    <div className="hchart-tooltip">
      <div className="hchart-tooltip-time">{formatTooltipTime(tsIso)}</div>
      {visiblePayload.map((p) => {
        const meta = metaByKey[p.dataKey];
        const unit = meta?.unit ? String(meta.unit).trim() : "";
        const suffix = unit ? unit : "";
        const label = meta?.displayName ?? p.name ?? p.dataKey;
        return (
          <div key={String(p.dataKey)} className="hchart-tooltip-row">
            {label}: {Number(p.value).toFixed(2)}
            {suffix ? ` ${suffix}` : ""}
          </div>
        );
      })}
    </div>
  );
}

function LegendContent({ payload, visibleByKey, onToggle }) {
  if (!payload?.length) return null;
  return (
    <div className="hchart-legend-custom">
      {payload.map((entry) => (
        <button
          key={String(entry.dataKey)}
          type="button"
          className={`hchart-legend-btn ${
            visibleByKey[entry.dataKey] === false ? "inactive" : ""
          }`}
          onClick={() => onToggle(entry.dataKey)}
        >
          <span
            className="hchart-legend-swatch"
            style={{ background: entry.color }}
          />
          {entry.value}
        </button>
      ))}
    </div>
  );
}

function HistoricalTrendsChart({
  timeSeries = [],
  sensors = [],
  appliedSensorIds = [],
  loading = false,
  startDateStr = "",
  endDateStr = "",
  applied = null,
}) {
  const chartHeight = useChartHeight();
  const tickFormatter = useTickFormatter(startDateStr, endDateStr);

  const normalizedUnit = (u) => {
    const t = (u || "").trim();
    return t === "" ? "" : t;
  };

  const catalogForChart = useMemo(() => {
    const set = new Set(appliedSensorIds);
    return sensors.filter((s) => set.has(s.id));
  }, [sensors, appliedSensorIds]);

  const unitOptions = useMemo(() => {
    const units = new Set();
    catalogForChart.forEach((s) => {
      const u = normalizedUnit(s.unit);
      units.add(u === "" ? "(no unit)" : u);
    });
    return ["all", ...Array.from(units).sort()];
  }, [catalogForChart]);

  const [unitFilter, setUnitFilter] = useState("all");

  useEffect(() => {
    if (!unitOptions.includes(unitFilter)) {
      setUnitFilter("all");
    }
  }, [unitOptions, unitFilter]);

  const seriesMeta = useMemo(() => {
    let list = catalogForChart.map((s, index) => {
      const nu = normalizedUnit(s.unit);
      const unitLabel = nu === "" ? "(no unit)" : nu;
      const displayName = (s.name || s.type || `Sensor ${s.id}`).trim();
      return {
        id: s.id,
        dataKey: `s_${s.id}`,
        displayName,
        unit: nu,
        unitLabel,
        color: SENSOR_COLORS[index % SENSOR_COLORS.length],
      };
    });

    if (unitFilter !== "all") {
      list = list.filter((m) => {
        const label = m.unit === "" ? "(no unit)" : m.unit;
        return label === unitFilter;
      });
    }

    return list;
  }, [catalogForChart, unitFilter]);

  const [visibleByKey, setVisibleByKey] = useState({});

  useEffect(() => {
    const next = {};
    seriesMeta.forEach((m) => {
      next[m.dataKey] = true;
    });
    setVisibleByKey(next);
  }, [seriesMeta]);

  const toggleKey = useCallback((dataKey) => {
    setVisibleByKey((prev) => {
      const visible = prev[dataKey] !== false;
      return { ...prev, [dataKey]: !visible };
    });
  }, []);

  const showAllLines = useCallback(() => {
    const next = {};
    seriesMeta.forEach((m) => {
      next[m.dataKey] = true;
    });
    setVisibleByKey(next);
  }, [seriesMeta]);

  const hideAllLines = useCallback(() => {
    const next = {};
    seriesMeta.forEach((m) => {
      next[m.dataKey] = false;
    });
    setVisibleByKey(next);
  }, [seriesMeta]);

  const metaByKey = useMemo(() => {
    const map = {};
    seriesMeta.forEach((m) => {
      map[m.dataKey] = m;
    });
    return map;
  }, [seriesMeta]);

  const chartRows = useMemo(() => {
    let rows = processChartData(timeSeries, seriesMeta);
    const keys = seriesMeta.map((m) => m.dataKey);
    rows = downsampleRows(rows, keys, MAX_CHART_POINTS);
    return rows;
  }, [timeSeries, seriesMeta]);

  const yAxisLabel = useMemo(() => {
    if (unitFilter === "all" && seriesMeta.length) {
      const uniq = new Set(
        seriesMeta.map((m) => m.unit).filter((u) => u && u.trim() !== "")
      );
      if (uniq.size === 1) return `${[...uniq][0]}`;
      return "Value";
    }
    if (unitFilter !== "all" && unitFilter !== "(no unit)") {
      return unitFilter;
    }
    return "Value";
  }, [unitFilter, seriesMeta]);

  const showUnitDropdown = unitOptions.length > 2;

  if (!applied) {
    return (
      <section className="historical-trends" aria-label="Historical trends">
        <h2 className="historical-trends-title">Historical sensor trends</h2>
        <div className="historical-trends-pending">
          Apply filters to load chart data for your selected sensors and date range.
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="historical-trends" aria-label="Historical trends">
        <h2 className="historical-trends-title">Historical sensor trends</h2>
        <div
          className="historical-trends-skeleton"
          style={{ minHeight: chartHeight + 48 }}
          aria-hidden
        />
      </section>
    );
  }

  if (!seriesMeta.length) {
    return (
      <section className="historical-trends" aria-label="Historical trends">
        <h2 className="historical-trends-title">Historical sensor trends</h2>
        <div className="historical-trends-empty">
          <strong>No sensors to plot</strong>
          <span>
            Select sensors in the filters above, or choose a different unit in
            the chart controls if some sensors are hidden by unit.
          </span>
        </div>
      </section>
    );
  }

  if (!chartRows.length) {
    return (
      <section className="historical-trends" aria-label="Historical trends">
        <h2 className="historical-trends-title">Historical sensor trends</h2>
        <div className="historical-trends-empty">
          <strong>No sensor data available for selected time range</strong>
          <span>
            Try selecting a different date range or sensors, or wait for more
            readings to be ingested.
          </span>
        </div>
        <div className="historical-trends-controls">
          {showUnitDropdown && (
            <div className="historical-trends-units">
              <label htmlFor="hchart-unit">Y-axis unit</label>
              <select
                id="hchart-unit"
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
              >
                {unitOptions.map((u) => (
                  <option key={u} value={u}>
                    {u === "all" ? "All units" : u}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>
    );
  }

  const brushHeight = 28;
  const containerH = chartHeight + brushHeight + 8;

  return (
    <section className="historical-trends" aria-label="Historical trends">
      <h2 className="historical-trends-title">Historical sensor trends</h2>

      <div className="historical-trends-controls">
        <div className="historical-trends-bulk">
          <button type="button" onClick={showAllLines}>
            Show all
          </button>
          <button type="button" onClick={hideAllLines}>
            Hide all
          </button>
        </div>

        {showUnitDropdown && (
          <div className="historical-trends-units">
            <label htmlFor="hchart-unit">Y-axis unit</label>
            <select
              id="hchart-unit"
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
            >
              {unitOptions.map((u) => (
                <option key={u} value={u}>
                  {u === "all" ? "All units" : u}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="historical-trends-chips" aria-label="Sensor visibility">
          {seriesMeta.map((m) => (
            <button
              key={m.dataKey}
              type="button"
              className={`historical-trends-chip ${
                visibleByKey[m.dataKey] === false ? "inactive" : ""
              }`}
              onClick={() => toggleKey(m.dataKey)}
            >
              <span
                className="historical-trends-chip-swatch"
                style={{ background: m.color }}
              />
              {m.displayName}
            </button>
          ))}
        </div>
      </div>

      <div className="historical-trends-chart-wrap">
        <ResponsiveContainer width="100%" height={containerH}>
          <LineChart
            data={chartRows}
            margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              type="number"
              dataKey="sortTs"
              domain={["dataMin", "dataMax"]}
              tickFormatter={tickFormatter}
              stroke="#9CA3AF"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              label={{
                value: yAxisLabel,
                angle: -90,
                position: "insideLeft",
                fill: "#9ca3af",
                fontSize: 12,
              }}
            />
            <Tooltip
              content={(tipProps) => (
                <ChartTooltip {...tipProps} metaByKey={metaByKey} />
              )}
            />
            {seriesMeta.map((m) => (
              <Line
                key={m.dataKey}
                type="monotone"
                dataKey={m.dataKey}
                name={m.displayName}
                stroke={m.color}
                strokeWidth={2}
                dot={false}
                connectNulls
                hide={visibleByKey[m.dataKey] === false}
                isAnimationActive={false}
              />
            ))}
            <Brush
              dataKey="sortTs"
              height={brushHeight}
              stroke="#f4f96b"
              fill="rgba(244, 249, 107, 0.12)"
              tickFormatter={tickFormatter}
              travellerWidth={8}
            />
            <Legend
              verticalAlign="bottom"
              content={(legendProps) => (
                <LegendContent
                  {...legendProps}
                  visibleByKey={visibleByKey}
                  onToggle={toggleKey}
                />
              )}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default HistoricalTrendsChart;
