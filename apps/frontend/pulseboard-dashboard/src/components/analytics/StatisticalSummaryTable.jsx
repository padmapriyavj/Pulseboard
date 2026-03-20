import React, { useMemo, useState, useCallback, useEffect } from "react";
import "./StatisticalSummaryTable.css";

const DAY_MS = 24 * 60 * 60 * 1000;

function parseYMD(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function expectedReadingsForRange(startDateStr, endDateStr) {
  const a = parseYMD(startDateStr);
  const b = parseYMD(endDateStr);
  if (!a || !b) return 1;
  const days = Math.max(1, Math.round((b - a) / DAY_MS) + 1);
  return days * 24;
}

export function calculateQualityScore(stat, expectedDataPoints) {
  const exp = Math.max(1, expectedDataPoints);
  const missingRate = Math.min(1, (stat.missingDataPoints || 0) / exp);
  const actual = Math.max(0, stat.dataPoints || 0);
  const outlierRate = actual > 0 ? (stat.outlierCount || 0) / actual : 0;
  const quality = (1 - missingRate - outlierRate * 0.5) * 100;
  return Math.max(0, Math.min(100, quality));
}

function qualityClass(q) {
  if (q > 95) return "stat-quality-good";
  if (q >= 85) return "stat-quality-warn";
  return "stat-quality-bad";
}

function formatWithUnit(value, unit) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const u = unit != null ? String(unit).trim() : "";
  const n = Number(value).toFixed(1);
  return u ? `${n}${u}` : n;
}

function escapeCsvCell(v) {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function StatisticalSummaryTable({
  statistics = [],
  loading = false,
  error = null,
  onRetry,
  startDateStr = "",
  endDateStr = "",
  applied = null,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [copyToast, setCopyToast] = useState("");

  const expectedPerSensor = useMemo(
    () => expectedReadingsForRange(startDateStr, endDateStr),
    [startDateStr, endDateStr]
  );

  useEffect(() => {
    if (!copyToast) return undefined;
    const t = setTimeout(() => setCopyToast(""), 3200);
    return () => clearTimeout(t);
  }, [copyToast]);

  const rowsWithQuality = useMemo(() => {
    return statistics.map((s) => ({
      ...s,
      quality: calculateQualityScore(s, expectedPerSensor),
    }));
  }, [statistics, expectedPerSensor]);

  const sortedRows = useMemo(() => {
    const rows = [...rowsWithQuality];
    if (!sortKey || !sortDir) {
      rows.sort((a, b) => a.sensorId - b.sensorId);
      return rows;
    }
    const dir = sortDir === "desc" ? -1 : 1;
    const cmpNum = (va, vb) => {
      const na = va == null || Number.isNaN(va) ? -Infinity : Number(va);
      const nb = vb == null || Number.isNaN(vb) ? -Infinity : Number(vb);
      if (na < nb) return -dir;
      if (na > nb) return dir;
      return 0;
    };
    rows.sort((a, b) => {
      let r = 0;
      switch (sortKey) {
        case "sensor": {
          const va = (a.sensorName || "").toLowerCase();
          const vb = (b.sensorName || "").toLowerCase();
          if (va < vb) r = -dir;
          else if (va > vb) r = dir;
          break;
        }
        case "min":
          r = cmpNum(a.min, b.min);
          break;
        case "max":
          r = cmpNum(a.max, b.max);
          break;
        case "avg":
          r = cmpNum(a.avg, b.avg);
          break;
        case "median":
          r = cmpNum(a.median, b.median);
          break;
        case "stdDev":
          r = cmpNum(a.stdDev, b.stdDev);
          break;
        case "dataPoints":
          r = cmpNum(a.dataPoints, b.dataPoints);
          break;
        case "quality":
          r = cmpNum(a.quality, b.quality);
          break;
        default:
          r = 0;
      }
      if (r !== 0) return r;
      return (a.sensorId - b.sensorId) * dir;
    });
    return rows;
  }, [rowsWithQuality, sortKey, sortDir]);

  const cycleSort = useCallback(
    (key) => {
      if (sortKey !== key) {
        setSortKey(key);
        setSortDir("asc");
      } else if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        setSortKey(null);
        setSortDir(null);
      }
    },
    [sortKey, sortDir]
  );

  const sortIndicator = (key) => {
    if (sortKey !== key || !sortDir) return null;
    return (
      <span className="stat-sort-ind" aria-hidden>
        {sortDir === "asc" ? "\u2191" : "\u2193"}
      </span>
    );
  };

  const exportCsv = useCallback(() => {
    if (!sortedRows.length) return;
    const headers = [
      "Sensor",
      "Min",
      "Max",
      "Avg",
      "Median",
      "Std Dev",
      "Data Points",
      "Quality %",
      "Missing",
      "Outliers",
    ];
    const lines = [headers.map(escapeCsvCell).join(",")];
    sortedRows.forEach((row) => {
      lines.push(
        [
          row.sensorName || `Sensor ${row.sensorId}`,
          row.min != null ? Number(row.min).toFixed(1) : "",
          row.max != null ? Number(row.max).toFixed(1) : "",
          row.avg != null ? Number(row.avg).toFixed(1) : "",
          row.median != null ? Number(row.median).toFixed(1) : "",
          row.stdDev != null ? Number(row.stdDev).toFixed(1) : "",
          row.dataPoints ?? 0,
          Number(row.quality).toFixed(1),
          row.missingDataPoints ?? 0,
          row.outlierCount ?? 0,
        ]
          .map(escapeCsvCell)
          .join(",")
      );
    });
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pulseboard-analytics-${startDateStr}-${endDateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sortedRows, startDateStr, endDateStr]);

  const copyTsv = useCallback(async () => {
    if (!sortedRows.length) return;
    const header =
      "Sensor\tMin\tMax\tAvg\tMedian\tStd Dev\tData Points\tQuality %\tMissing\tOutliers";
    const body = sortedRows
      .map((row) =>
        [
          row.sensorName || `Sensor ${row.sensorId}`,
          row.min != null ? Number(row.min).toFixed(1) : "",
          row.max != null ? Number(row.max).toFixed(1) : "",
          row.avg != null ? Number(row.avg).toFixed(1) : "",
          row.median != null ? Number(row.median).toFixed(1) : "",
          row.stdDev != null ? Number(row.stdDev).toFixed(1) : "",
          row.dataPoints ?? 0,
          `${Number(row.quality).toFixed(1)}%`,
          row.missingDataPoints ?? 0,
          row.outlierCount ?? 0,
        ].join("\t")
      )
      .join("\n");
    const text = `${header}\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast("Copied to clipboard");
    } catch {
      setCopyToast("Copy failed");
    }
  }, [sortedRows]);

  const toggleExpand = (sensorId) => {
    setExpandedId((id) => (id === sensorId ? null : sensorId));
  };

  if (!applied) {
    return (
      <section className="stat-table-wrap" aria-label="Statistical summary">
        <div className="stat-table-toolbar">
          <h2>Statistical summary</h2>
        </div>
        <div className="stat-table-empty">
          <strong>No statistical data available</strong>
          <span>
            Apply filters to load summary statistics for your sensors and date
            range.
          </span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="stat-table-wrap" aria-label="Statistical summary">
        <div className="stat-table-toolbar">
          <h2>Statistical summary</h2>
        </div>
        <div className="stat-table-error" role="alert">
          <div>{error.message || "Failed to load statistics."}</div>
          {onRetry && (
            <button
              type="button"
              className="stat-table-btn stat-table-btn-primary"
              onClick={() => onRetry()}
            >
              Retry
            </button>
          )}
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="stat-table-wrap" aria-label="Statistical summary">
        <div className="stat-table-toolbar">
          <h2>Statistical summary</h2>
        </div>
        <div className="stat-table-scroll">
          <table className="stat-table">
            <thead>
              <tr>
                <th>Sensor</th>
                <th>Min</th>
                <th>Max</th>
                <th>Avg</th>
                <th>Median</th>
                <th>Std dev</th>
                <th>Data pts</th>
                <th>Quality</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="stat-table-skeleton-row">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j}>
                      <div className="stat-table-skeleton-cell" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  if (!statistics.length) {
    return (
      <section className="stat-table-wrap" aria-label="Statistical summary">
        <div className="stat-table-toolbar">
          <h2>Statistical summary</h2>
        </div>
        <div className="stat-table-empty">
          <strong>No statistical data available</strong>
          <span>
            There are no sensor readings in this range. Try adjusting your date
            range or sensor selection.
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="stat-table-wrap" aria-label="Statistical summary">
      <div className="stat-table-toolbar">
        <h2>Statistical summary</h2>
        <div className="stat-table-actions">
          <button
            type="button"
            className="stat-table-btn stat-table-btn-primary"
            onClick={exportCsv}
          >
            Export to CSV
          </button>
          <button type="button" className="stat-table-btn" onClick={copyTsv}>
            Copy data
          </button>
        </div>
      </div>

      <div className="stat-table-scroll">
        <table className="stat-table">
          <thead>
            <tr>
              <th scope="col" onClick={() => cycleSort("sensor")}>
                <span className="stat-th-inner">
                  Sensor
                  {sortIndicator("sensor")}
                </span>
              </th>
              <th scope="col" onClick={() => cycleSort("min")}>
                <span className="stat-th-inner">
                  Min
                  {sortIndicator("min")}
                </span>
              </th>
              <th scope="col" onClick={() => cycleSort("max")}>
                <span className="stat-th-inner">
                  Max
                  {sortIndicator("max")}
                </span>
              </th>
              <th scope="col" onClick={() => cycleSort("avg")}>
                <span className="stat-th-inner">
                  Avg
                  {sortIndicator("avg")}
                </span>
              </th>
              <th scope="col" onClick={() => cycleSort("median")}>
                <span className="stat-th-inner">
                  Median
                  {sortIndicator("median")}
                </span>
              </th>
              <th scope="col" onClick={() => cycleSort("stdDev")}>
                <span className="stat-th-inner">
                  Std dev
                  {sortIndicator("stdDev")}
                </span>
              </th>
              <th scope="col" onClick={() => cycleSort("dataPoints")}>
                <span className="stat-th-inner">
                  Data pts
                  {sortIndicator("dataPoints")}
                </span>
              </th>
              <th scope="col" onClick={() => cycleSort("quality")}>
                <span className="stat-th-inner">
                  Quality
                  {sortIndicator("quality")}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const unit = row.sensorUnit || "";
              const expanded = expandedId === row.sensorId;
              return (
                <React.Fragment key={row.sensorId}>
                  <tr
                    className={expanded ? "stat-row-expanded" : ""}
                    onClick={() => toggleExpand(row.sensorId)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{row.sensorName || row.sensorType || `Sensor ${row.sensorId}`}</td>
                    <td>{formatWithUnit(row.min, unit)}</td>
                    <td>{formatWithUnit(row.max, unit)}</td>
                    <td>{formatWithUnit(row.avg, unit)}</td>
                    <td>{formatWithUnit(row.median, unit)}</td>
                    <td>{formatWithUnit(row.stdDev, unit)}</td>
                    <td>
                      {row.dataPoints != null
                        ? Number(row.dataPoints).toLocaleString()
                        : "—"}
                    </td>
                    <td className={qualityClass(row.quality)}>
                      {Number(row.quality).toFixed(0)}%
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="stat-row-expanded">
                      <td colSpan={8}>
                        <div className="stat-table-expand-panel">
                          <div>
                            <strong>Time range</strong> {startDateStr} to{" "}
                            {endDateStr} (expected ~{expectedPerSensor.toLocaleString()}{" "}
                            readings per sensor at 1/hour baseline).
                          </div>
                          <div>
                            <strong>Missing rows (null values)</strong>{" "}
                            {row.missingDataPoints ?? 0} ·{" "}
                            <strong>Outliers (vs sensor min/max)</strong>{" "}
                            {row.outlierCount ?? 0}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {copyToast ? (
        <div className="stat-toast" role="status">
          {copyToast}
        </div>
      ) : null}
    </section>
  );
}

export default StatisticalSummaryTable;
