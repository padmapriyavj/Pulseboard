import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useAuth } from "../hooks/useAuth";
import { GET_SENSORS } from "../graphql/sensors";
import { GET_ANALYTICS_DATA } from "../graphql/analytics";
import HistoricalTrendsChart from "../components/analytics/HistoricalTrendsChart";
import StatisticalSummaryTable from "../components/analytics/StatisticalSummaryTable";
import "./Analytics.css";

const TIME_OPTIONS = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "Custom Range"];

function sortSensorIds(ids) {
  return [...ids].sort((a, b) => a - b);
}

function toLocalYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYMD(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function IconDb({ size = 32 }) {
  return (
    <svg className="analytics-metric-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  );
}

function IconClock({ size = 32 }) {
  return (
    <svg className="analytics-metric-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function IconStar({ size = 32 }) {
  return (
    <svg className="analytics-metric-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function IconBell({ size = 32 }) {
  return (
    <svg className="analytics-metric-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ChevronDown({ open }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function Analytics() {
  const navigate = useNavigate();
  const { orgId } = useAuth();
  const initApplied = useRef(false);

  const [timeRange, setTimeRange] = useState("Last 30 Days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedSensors, setSelectedSensors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [applied, setApplied] = useState(null);
  const [filterError, setFilterError] = useState("");

  const [sensorMenuOpen, setSensorMenuOpen] = useState(false);
  const sensorWrapRef = useRef(null);

  const { loading: sensorsLoading, data: sensorsData, error: sensorsError } = useQuery(GET_SENSORS, {
    variables: { org_id: orgId },
    skip: !orgId,
    fetchPolicy: "network-only",
  });

  const sensors = useMemo(() => sensorsData?.getSensors ?? [], [sensorsData]);

  const {
    data: analyticsResult,
    loading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useQuery(GET_ANALYTICS_DATA, {
    variables: {
      orgId: orgId || "",
      sensorIds:
        applied?.sensorIds != null && applied.sensorIds.length > 0
          ? sortSensorIds(applied.sensorIds)
          : null,
      startDate: applied?.startStr ?? "",
      endDate: applied?.endStr ?? "",
    },
    skip: !orgId || !applied?.startStr || !applied?.endStr || !applied?.sensorIds?.length,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    initApplied.current = false;
  }, [orgId]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible" || !orgId) return;
      if (!applied?.startStr || !applied?.endStr || !applied?.sensorIds?.length) return;
      refetchAnalytics({
        orgId,
        sensorIds: sortSensorIds(applied.sensorIds),
        startDate: applied.startStr,
        endDate: applied.endStr,
      });
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [orgId, applied, refetchAnalytics]);

  useEffect(() => {
    const today = new Date();
    let calculatedStart;
    let calculatedEnd;

    switch (timeRange) {
      case "Last 7 Days":
        calculatedStart = new Date(today);
        calculatedStart.setDate(today.getDate() - 7);
        calculatedEnd = new Date(today);
        break;
      case "Last 30 Days":
        calculatedStart = new Date(today);
        calculatedStart.setDate(today.getDate() - 30);
        calculatedEnd = new Date(today);
        break;
      case "Last 90 Days":
        calculatedStart = new Date(today);
        calculatedStart.setDate(today.getDate() - 90);
        calculatedEnd = new Date(today);
        break;
      case "Custom Range": {
        const s = parseYMD(customStartDate);
        const e = parseYMD(customEndDate);
        calculatedStart = s;
        calculatedEnd = e || today;
        break;
      }
      default:
        calculatedStart = new Date(today);
        calculatedStart.setDate(today.getDate() - 30);
        calculatedEnd = new Date(today);
    }

    setStartDate(calculatedStart);
    setEndDate(timeRange === "Custom Range" && calculatedEnd ? calculatedEnd : today);
  }, [timeRange, customStartDate, customEndDate]);

  useEffect(() => {
    if (!orgId || sensorsLoading || sensors.length === 0) return;
    if (initApplied.current) return;
    initApplied.current = true;
    const ids = sensors.map((s) => s.id);
    const sorted = sortSensorIds(ids);
    setSelectedSensors(sorted);
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 30);
    setApplied({
      startStr: toLocalYMD(start),
      endStr: toLocalYMD(today),
      sensorIds: sorted,
    });
  }, [orgId, sensorsLoading, sensors]);

  useEffect(() => {
    const merged = sensorsLoading || analyticsLoading;
    setIsLoading(merged);
  }, [sensorsLoading, analyticsLoading]);

  useEffect(() => {
    function onDocClick(e) {
      if (sensorWrapRef.current && !sensorWrapRef.current.contains(e.target)) {
        setSensorMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const computeRangeStrings = useCallback(() => {
    const today = new Date();
    let s;
    let e;

    switch (timeRange) {
      case "Last 7 Days":
        s = new Date(today);
        s.setDate(today.getDate() - 7);
        e = new Date(today);
        break;
      case "Last 30 Days":
        s = new Date(today);
        s.setDate(today.getDate() - 30);
        e = new Date(today);
        break;
      case "Last 90 Days":
        s = new Date(today);
        s.setDate(today.getDate() - 90);
        e = new Date(today);
        break;
      case "Custom Range": {
        const cs = parseYMD(customStartDate);
        const ce = parseYMD(customEndDate);
        if (!cs || !ce) return null;
        if (ce < cs) return null;
        s = cs;
        e = ce;
        break;
      }
      default:
        s = new Date(today);
        s.setDate(today.getDate() - 30);
        e = new Date(today);
    }
    return { startStr: toLocalYMD(s), endStr: toLocalYMD(e) };
  }, [timeRange, customStartDate, customEndDate]);

  const handleApply = async () => {
    setFilterError("");
    if (selectedSensors.length === 0) {
      setFilterError("Select at least one sensor to run analytics.");
      return;
    }
    if (timeRange === "Custom Range") {
      if (!customStartDate || !customEndDate) {
        setFilterError("Choose both start and end dates for a custom range.");
        return;
      }
      const cs = parseYMD(customStartDate);
      const ce = parseYMD(customEndDate);
      if (!cs || !ce) {
        setFilterError("Use a valid date format (YYYY-MM-DD).");
        return;
      }
      if (ce < cs) {
        setFilterError("End date must be on or after the start date.");
        return;
      }
    }
    const range = computeRangeStrings();
    if (!range) {
      setFilterError("End date must be on or after the start date.");
      return;
    }
    const next = {
      startStr: range.startStr,
      endStr: range.endStr,
      sensorIds: sortSensorIds(selectedSensors),
    };
    setApplied(next);
    try {
      await refetchAnalytics({
        orgId,
        sensorIds: next.sensorIds,
        startDate: next.startStr,
        endDate: next.endStr,
      });
    } catch {
      /* errors surface via analyticsError */
    }
  };

  const handleReset = async () => {
    setFilterError("");
    setTimeRange("Last 30 Days");
    setCustomStartDate("");
    setCustomEndDate("");
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 30);
    const ids = sensors.map((s) => s.id);
    const sorted = sortSensorIds(ids);
    setSelectedSensors(sorted);
    const next = {
      startStr: toLocalYMD(start),
      endStr: toLocalYMD(today),
      sensorIds: sorted,
    };
    setApplied(next);
    try {
      await refetchAnalytics({
        orgId,
        sensorIds: next.sensorIds,
        startDate: next.startStr,
        endDate: next.endStr,
      });
    } catch {
      /* errors surface via analyticsError */
    }
  };

  const toggleSensor = (id) => {
    setSelectedSensors((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllSensors = () => setSelectedSensors(sensors.map((s) => s.id));
  const deselectAllSensors = () => setSelectedSensors([]);

  const analytics = analyticsResult?.analyticsData;
  const showNoSensors = !sensorsLoading && sensors.length === 0;
  const showNoData =
    analytics &&
    analytics.totalDataPoints === 0 &&
    !analyticsLoading &&
    !analyticsError;

  const uptimeClass =
    analytics == null
      ? ""
      : analytics.averageUptime > 95
        ? "uptime-good"
        : analytics.averageUptime >= 85
          ? "uptime-warn"
          : "uptime-bad";

  const appliedHours = applied
    ? (() => {
        const a = parseYMD(applied.startStr);
        const b = parseYMD(applied.endStr);
        if (!a || !b) return 0;
        const days = Math.max(1, Math.round((b - a) / (24 * 60 * 60 * 1000)) + 1);
        return days * 24;
      })()
    : 0;

  const alertIsPerDay = appliedHours >= 24 * 7;
  const alertDisplay =
    analytics == null
      ? "—"
      : alertIsPerDay
        ? (analytics.alertRate * 24).toFixed(2)
        : analytics.alertRate.toFixed(2);
  const alertSub = alertIsPerDay ? "Average alerts per day" : "Average alerts per hour";

  return (
    <div className="analytics-page">
      <p className="breadcrumb">
        <Link to="/dashboard" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>Home</Link>
        {" / Analytics"}
      </p>

      <header className="analytics-page-header">
        <h1>Analytics</h1>
        <button type="button" className="analytics-export-btn" disabled title="Export will be available in a future update">
          Export
        </button>
      </header>

      <section className="analytics-filters" aria-label="Analytics filters">
        <div className="analytics-filters-row">
          <div className="analytics-filter-group">
            <label htmlFor="analytics-time-range">Time range</label>
            <select
              id="analytics-time-range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {TIME_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="analytics-filter-group analytics-sensor-wrap" ref={sensorWrapRef}>
            <label>Sensors</label>
            <button
              type="button"
              className={`analytics-sensor-trigger ${sensorMenuOpen ? "open" : ""}`}
              onClick={() => setSensorMenuOpen((o) => !o)}
              aria-expanded={sensorMenuOpen}
              aria-haspopup="listbox"
            >
              <span>
                {selectedSensors.length === sensors.length && sensors.length > 0
                  ? `All ${sensors.length} sensors`
                  : `${selectedSensors.length} sensor${selectedSensors.length === 1 ? "" : "s"} selected`}
              </span>
              <ChevronDown open={sensorMenuOpen} />
            </button>
            {sensorMenuOpen && sensors.length > 0 && (
              <div className="analytics-sensor-menu" role="listbox">
                <div className="analytics-sensor-actions">
                  <button type="button" onClick={selectAllSensors}>Select all</button>
                  <button type="button" onClick={deselectAllSensors}>Deselect all</button>
                </div>
                {sensors.map((s) => (
                  <label key={s.id} className="analytics-sensor-row">
                    <input
                      type="checkbox"
                      checked={selectedSensors.includes(s.id)}
                      onChange={() => toggleSensor(s.id)}
                    />
                    <span>{s.name || s.type || `Sensor ${s.id}`}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="analytics-actions">
            <button type="button" className="analytics-btn-apply" onClick={handleApply}>
              Apply filters
            </button>
            <button type="button" className="analytics-btn-reset" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>

        {timeRange === "Custom Range" && (
          <div className="analytics-custom-dates">
            <div className="analytics-filter-group">
              <label htmlFor="analytics-start">Start date</label>
              <input
                id="analytics-start"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div className="analytics-filter-group">
              <label htmlFor="analytics-end">End date</label>
              <input
                id="analytics-end"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <span className="sr-only" aria-live="polite">
          {startDate && endDate
            ? `Draft date range ${toLocalYMD(startDate)} through ${toLocalYMD(endDate)}`
            : ""}
        </span>
      </section>

      {filterError && (
        <div className="analytics-banner analytics-banner-warn" role="alert">
          {filterError}
        </div>
      )}

      {sensorsError && (
        <div className="analytics-banner analytics-banner-error" role="alert">
          Failed to load sensors: {sensorsError.message}
        </div>
      )}

      {analyticsError && (
        <div className="analytics-banner analytics-banner-error" role="alert">
          Failed to load analytics: {analyticsError.message}
        </div>
      )}

      {showNoSensors && (
        <div className="analytics-banner analytics-banner-info" role="status">
          No sensors available. Add sensors to see historical analytics.
        </div>
      )}

      {showNoData && (
        <div className="analytics-banner analytics-banner-info" role="status">
          No data available for the selected filters and time range.
        </div>
      )}

      {isLoading && orgId && !showNoSensors && (
        <p className="analytics-loading">Loading analytics...</p>
      )}

      <div className="analytics-metric-grid">
        <div className="analytics-metric-card">
          <div className="analytics-metric-card-head">
            <span className="analytics-metric-label">Total data points</span>
            <IconDb />
          </div>
          <div className="analytics-metric-value">
            {analyticsLoading && !analytics ? "…" : analytics?.totalDataPoints?.toLocaleString() ?? "—"}
          </div>
          <div className="analytics-metric-sub">Across all sensors</div>
        </div>

        <div className="analytics-metric-card">
          <div className="analytics-metric-card-head">
            <span className="analytics-metric-label">Average uptime</span>
            <IconClock />
          </div>
          <div className={`analytics-metric-value ${uptimeClass}`}>
            {analyticsLoading && !analytics ? "…" : analytics != null ? `${analytics.averageUptime.toFixed(1)}%` : "—"}
          </div>
          <div className="analytics-metric-sub">Expected readings received</div>
        </div>

        <div className="analytics-metric-card">
          <div className="analytics-metric-card-head">
            <span className="analytics-metric-label">Data quality score</span>
            <IconStar />
          </div>
          <div className="analytics-metric-value">
            {analyticsLoading && !analytics ? "…" : analytics != null ? `${analytics.dataQualityScore.toFixed(0)} / 100` : "—"}
          </div>
          <div className="analytics-metric-sub">Based on completeness</div>
        </div>

        <div className="analytics-metric-card">
          <div className="analytics-metric-card-head">
            <span className="analytics-metric-label">Alert rate</span>
            <IconBell />
          </div>
          <div className="analytics-metric-value">
            {analyticsLoading && !analytics ? "…" : alertDisplay}
          </div>
          <div className="analytics-metric-sub">{alertSub}</div>
        </div>
      </div>

      <HistoricalTrendsChart
        timeSeries={analytics?.timeSeries}
        sensors={sensors}
        appliedSensorIds={applied?.sensorIds ?? []}
        loading={!!applied && analyticsLoading}
        startDateStr={applied?.startStr ?? ""}
        endDateStr={applied?.endStr ?? ""}
        applied={applied}
      />

      <StatisticalSummaryTable
        statistics={analytics?.statistics ?? []}
        loading={!!applied && analyticsLoading}
        error={analyticsError}
        onRetry={() => refetchAnalytics()}
        startDateStr={applied?.startStr ?? ""}
        endDateStr={applied?.endStr ?? ""}
        applied={applied}
      />
    </div>
  );
}

export default Analytics;
