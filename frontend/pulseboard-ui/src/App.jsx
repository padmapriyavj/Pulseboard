import React, { useState } from 'react';
import './App.css';
import LiveMetrics from "./components/LiveMetrics";
import HistoryChart from './components/HistoryChart';
import SensorFilters from "./components/SensorFilters";

function App() {
  const [filter, setFilter] = useState({
    deviceId: "sensor-1",
    start: "2025-08-17T00:00:00Z",
    end: "2025-08-18T00:00:00Z",
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-bold text-center text-blue-600 mb-6">📊 PulseBoard Dashboard</h1>

      <SensorFilters onFilter={setFilter} />

      <HistoryChart
        deviceId={filter.deviceId}
        start={filter.start}
        end={filter.end}
      />

      <LiveMetrics />
    </div>
  );
}

export default App;
