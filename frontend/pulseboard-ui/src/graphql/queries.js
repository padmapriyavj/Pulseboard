import { gql } from '@apollo/client';

export const GET_METRICS_HISTORY = gql`
  query MetricsHistory($deviceId: String!, $start: String!, $end: String!) {
    metricsHistory(deviceId: $deviceId, start: $start, end: $end) {
      deviceId
      temperature
      humidity
      pressure
      status
      timestamp
    }
  }
`;
