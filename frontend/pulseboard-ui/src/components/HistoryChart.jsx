import React from "react";
import { useQuery } from "@apollo/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
import { GET_METRICS_HISTORY } from "../graphql/queries";

const HistoryChart = ({ deviceId, start, end }) => {
    console.log("Query Variables", { deviceId, start, end });

  const { loading, error, data } = useQuery(GET_METRICS_HISTORY, {
    variables: { deviceId, start, end },
  });

  if (loading) return <p className="text-gray-500">Loading history...</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  const metrics = data.metricsHistory.map((item) => ({
    ...item,
    timestamp: new Date(item.timestamp).toLocaleTimeString(),
  }));

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">📊 History for {deviceId}</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={metrics}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="temperature" stroke="#ef4444" name="Temp (°C)" />
          <Line type="monotone" dataKey="humidity" stroke="#3b82f6" name="Humidity (%)" />
          <Line type="monotone" dataKey="pressure" stroke="#10b981" name="Pressure (hPa)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoryChart;
