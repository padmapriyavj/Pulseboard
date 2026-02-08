import { gql } from "@apollo/client";

export const GET_ALERTS = gql`
  query GetAlerts($org_id: String!, $severity: String, $sensor_name: String, $date_from: String, $date_to: String, $limit: Int, $offset: Int) {
    getAlerts(org_id: $org_id, severity: $severity, sensor_name: $sensor_name, date_from: $date_from, date_to: $date_to, limit: $limit, offset: $offset) {
      id
      org_id
      sensor_id
      sensor_name
      sensor_type
      alert_type
      severity
      message
      value
      threshold_min
      threshold_max
      acknowledged
      acknowledged_at
      created_at
    }
  }
`;

export const ACKNOWLEDGE_ALERT = gql`
  mutation AcknowledgeAlert($alert_id: Int!) {
    acknowledgeAlert(alert_id: $alert_id) {
      id
      acknowledged
      acknowledged_at
    }
  }
`;

export const DELETE_ALERT = gql`
  mutation DeleteAlert($alert_id: Int!) {
    deleteAlert(alert_id: $alert_id)
  }
`;

export const GET_ALERT_SUMMARY = gql`
  query GetAlertSummary($org_id: String!) {
    getAlertSummary(org_id: $org_id) {
      critical_count
      warning_count
      latest_critical_timestamp
      latest_warning_timestamp
    }
  }
`;
