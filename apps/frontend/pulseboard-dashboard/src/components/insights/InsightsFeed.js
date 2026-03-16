import React from "react";
import { useQuery } from "@apollo/client";
import { GET_LATEST_INSIGHTS } from "../../graphql/insights";
import InsightCard from "./InsightCard";
import "./InsightsFeed.css";

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
    <div className="insights-feed">
      <div className="insights-feed-header">
        <h3 className="insights-feed-title">AI Insights</h3>
        <button type="button" onClick={() => refetch()} className="insights-refresh-btn">
          Refresh
        </button>
      </div>
      {insights.length === 0 ? (
        <div className="insights-empty">
          <p className="insights-empty-text">No insights yet.</p>
          <p className="insights-empty-hint">Click &quot;Refresh&quot; to generate AI-powered insights from your sensor data, or visit the Insights page.</p>
        </div>
      ) : (
        insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)
      )}
    </div>
  );
}

export default InsightsFeed;
