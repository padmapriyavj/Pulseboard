import { useQuery, gql } from "@apollo/client";

const METRICS_RECENT_QUERY = gql`
  query {
    metricsRecent {
      deviceId
      temperature
      humidity
      pressure
      status
      timestamp
    }
  }
`;

export default function LiveMetrics() {
  const { loading, error, data } = useQuery(METRICS_RECENT_QUERY, {
    pollInterval: 5000, // re-fetch every 5 seconds
  });

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📡 Live Sensor Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.metricsRecent.map((metric, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 shadow hover:shadow-lg transition"
          >
            <h3 className="font-semibold text-lg">{metric.deviceId}</h3>
            <p>🌡️ Temp: {metric.temperature.toFixed(2)} °C</p>
            <p>💧 Humidity: {metric.humidity.toFixed(2)} %</p>
            <p>⏱ Pressure: {metric.pressure?.toFixed(2) || "N/A"} hPa</p>
            <p>Status: <span className="font-medium">{metric.status || "OK"}</span></p>
            <p className="text-sm text-gray-500">
              {new Date(metric.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
