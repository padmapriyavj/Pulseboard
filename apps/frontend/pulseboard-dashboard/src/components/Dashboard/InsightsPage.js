import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useAuth } from "../../hooks/useAuth";
import { GET_INSIGHTS, GENERATE_INSIGHTS } from "../../graphql/insights";
import InsightCard from "../insights/InsightCard";

const SEVERITY_OPTIONS = [
  { value: "", label: "All" },
  { value: "CRITICAL", label: "CRITICAL" },
  { value: "WARNING", label: "WARNING" },
  { value: "INFO", label: "INFO" },
];

const INSIGHT_TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "alert-clustering", label: "Alert Clustering" },
  { value: "sensor-frequency", label: "Sensor Frequency" },
  { value: "threshold-analysis", label: "Threshold Analysis" },
  { value: "severity-distribution", label: "Severity Distribution" },
];

const styles = {
  container: {
    padding: "2rem",
    color: "#e2e8f0",
    backgroundColor: "#1a1a1a",
    minHeight: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    margin: 0,
    color: "#e2e8f0",
  },
  generateButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #FFFF66 0%, #FFE566 100%)",
    color: "#1a1a1a",
    border: "none",
    borderRadius: "10px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "14px",
  },
  generateButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  filters: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    marginBottom: "1.5rem",
  },
  select: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #3a3a3a",
    backgroundColor: "#2a2a2a",
    color: "#e2e8f0",
    fontSize: "14px",
    minWidth: "160px",
  },
  card: {
    backgroundColor: "#2a2a2a",
    borderRadius: "8px",
    padding: "1.5rem",
    border: "1px solid #3a3a3a",
  },
  empty: {
    textAlign: "center",
    color: "#94a3b8",
    padding: "3rem",
    fontSize: "16px",
  },
  loading: {
    textAlign: "center",
    color: "#94a3b8",
    padding: "2rem",
  },
  error: {
    color: "#ef4444",
    padding: "1rem",
    marginBottom: "1rem",
  },
};

function InsightsPage() {
  const { orgId } = useAuth();
  const [severityFilter, setSeverityFilter] = useState("");
  const [insightTypeFilter, setInsightTypeFilter] = useState("");

  const { loading, error, data, refetch } = useQuery(GET_INSIGHTS, {
    variables: {
      orgId: orgId || "",
      limit: 50,
      severity: severityFilter || null,
      insightType: insightTypeFilter || null,
    },
    skip: !orgId,
  });

  const [generateInsights, { loading: generating }] = useMutation(GENERATE_INSIGHTS, {
    variables: { orgId: orgId || "" },
    onCompleted: (res) => {
      if (res?.generateInsights?.success) {
        refetch();
      }
    },
  });

  const handleGenerate = () => {
    if (orgId && !generating) generateInsights();
  };

  const insights = data?.insights || [];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>💡 AI Insights</h1>
        <button
          onClick={handleGenerate}
          disabled={!orgId || generating}
          style={{
            ...styles.generateButton,
            ...((!orgId || generating) ? styles.generateButtonDisabled : {}),
          }}
        >
          {generating ? "⏳ Generating..." : "🔄 Generate New Insights"}
        </button>
      </div>

      {generating && (
        <div style={styles.loading}>Generating insights from your alerts. This may take a few seconds...</div>
      )}

      <div style={styles.filters}>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          style={styles.select}
        >
          {SEVERITY_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              Severity: {opt.label}
            </option>
          ))}
        </select>
        <select
          value={insightTypeFilter}
          onChange={(e) => setInsightTypeFilter(e.target.value)}
          style={styles.select}
        >
          {INSIGHT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              Type: {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.card}>
        {error && <div style={styles.error}>Error: {error.message}</div>}
        {loading ? (
          <div style={styles.loading}>Loading insights...</div>
        ) : insights.length === 0 ? (
          <div style={styles.empty}>
            No insights found. Click &quot;Generate New Insights&quot; to analyze your alerts.
          </div>
        ) : (
          insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)
        )}
      </div>
    </div>
  );
}

export default InsightsPage;
