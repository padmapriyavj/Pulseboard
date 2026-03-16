// src/graphql/dashboard.js
import { gql } from "@apollo/client";

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($org_id: String!, $recent_limit: Int) {
    getSensors(org_id: $org_id) {
      id
      name
      type
      status
    }
    recentlyAccessedSensors(org_id: $org_id, limit: $recent_limit) {
      id
      name
      type
      status
    }
  }
`;
