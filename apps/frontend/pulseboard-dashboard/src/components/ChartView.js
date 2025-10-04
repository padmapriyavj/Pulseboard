import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const METRICS_QUERY = gql`
  query GetMetrics($org_id: String!, $sensor_type: String!) {
    metrics(org_id: $org_id, sensor_type: $sensor_type) {
      value
      timestamp
    }
  }
`;

function ChartView({ orgId, sensorType }) {
  const { loading, data } = useQuery(METRICS_QUERY, {
    variables: { org_id: orgId, sensor_type: sensorType },
    pollInterval: 5000,  // Auto-refresh every 5 seconds
  });

  const chartData = data?.metrics.map((m) => ({
    ...m,
    timestamp: new Date(parseInt(m.timestamp) * 1000).toLocaleTimeString(),
  }));

  return (
    <LineChart width={800} height={300} data={chartData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="timestamp" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="value" stroke="#8884d8" />
    </LineChart>
  );
}

export default ChartView;
