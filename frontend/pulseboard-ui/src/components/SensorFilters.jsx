import React, { useState } from "react";

const SensorFilters = ({ onFilter }) => {
  const [sensorId, setSensorId] = useState("sensor-1");
  const [start, setStart] = useState("2025-08-17T00:00:00Z");
  const [end, setEnd] = useState("2025-08-18T00:00:00Z");

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter({ sensorId, start, end });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex flex-col md:flex-row items-center gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Sensor</label>
        <select
          value={sensorId}
          onChange={(e) => setSensorId(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="sensor-1">Sensor 1</option>
          <option value="sensor-2">Sensor 2</option>
          <option value="sensor-3">Sensor 3</option>
          <option value="sensor-4">Sensor 4</option>
          <option value="sensor-5">Sensor 5</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Start</label>
        <input
          type="datetime-local"
          value={start.slice(0, 16)}
          onChange={(e) => setStart(new Date(e.target.value).toISOString())}
          className="border p-2 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">End</label>
        <input
          type="datetime-local"
          value={end.slice(0, 16)}
          onChange={(e) => setEnd(new Date(e.target.value).toISOString())}
          className="border p-2 rounded"
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Filter
      </button>
    </form>
  );
};

export default SensorFilters;
