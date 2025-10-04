import React, { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';

const SENSOR_TYPES_QUERY = gql`
  query GetSensorTypes($org_id: String!) {
    metrics(org_id: $org_id) {
      sensor_type
    }
  }
`;

function SensorSelector({ orgId, onSensorChange }) {
  const { loading, data } = useQuery(SENSOR_TYPES_QUERY, {
    variables: { org_id: orgId },
  });

  const sensorTypes = [...new Set(data?.metrics.map((m) => m.sensor_type))];

  return (
    <select onChange={(e) => onSensorChange(e.target.value)}>
      <option>Select a sensor</option>
      {sensorTypes.map((type) => (
        <option key={type}>{type}</option>
      ))}
    </select>
  );
}

export default SensorSelector;
