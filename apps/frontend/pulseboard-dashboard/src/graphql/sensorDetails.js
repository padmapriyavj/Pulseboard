import { gql } from "@apollo/client";

export const GET_SENSOR = gql`
  query GetSensor($id: Int!) {
    getSensor(id: $id) {
      id
      name
      type
      min
      max
      unit
      status
    }
  }
`;

export const GET_SENSOR_METRICS = gql`
  query GetSensorMetrics($org_id: String!, $sensor_id: Int, $sensor_type: String, $from_time: String, $to_time: String, $limit: Int) {
    metrics(org_id: $org_id, sensor_id: $sensor_id, sensor_type: $sensor_type, from_time: $from_time, to_time: $to_time, limit: $limit) {
      device_id
      sensor_id
      value
      timestamp
      unit
      status
    }
  }
`;

