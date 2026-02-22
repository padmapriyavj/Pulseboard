import React from "react";
import { useQuery } from "@apollo/client";
import { GET_LATEST_INSIGHTS } from "../../graphql/insights";
import InsightCard from "./InsightCard";

function InsightsFeed({ orgId, limit = 5 }) {
  const { loading, error, data, refetch } = useQuery(GET_LATEST_INSIGHTS, {
    variables: { orgId: orgId || "", limit },
    skip: !orgId,
    pollInterval: 30000,
  });

  if (!orgId) return null;

  if (loading) {
    return (
      <div style={{ padding: "1.5rem", color: "#94a3b8", fontSize: "14px" }}>
        Loading insights...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "1.5rem", color: "#ef4444", fontSize: "14px" }}>
        Error loading insights: {error.message}
      </div>
    );
  }

  const insights = data?.latestInsights || [];

  return (
    <div
      style={{
        background: "#1a1a1a",
        border: "2px solid #B3B347",
        borderRadius: "12px",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#e2e8f0" }}>
          💡 AI Insights
        </h3>
        <button
          onClick={() => refetch()}
          style={{
            padding: "6px 12px",
            background: "#2a2a2a",
            color: "#FFFF66",
            border: "1px solid #B3B347",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          🔄 Refresh
        </button>
      </div>
      {insights.length === 0 ? (
        <div style={{ color: "#94a3b8", fontSize: "14px" }}>No insights yet. Generate insights from the Insights page.</div>
      ) : (
        insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)
      )}
    </div>
  );
}

export default InsightsFeed;
