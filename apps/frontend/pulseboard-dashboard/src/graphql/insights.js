import { gql } from "@apollo/client";

export const GET_LATEST_INSIGHTS = gql`
  query GetLatestInsights($orgId: String!, $limit: Int) {
    latestInsights(orgId: $orgId, limit: $limit) {
      id
      orgId
      sensorId
      insightType
      insightText
      severity
      metadata
      createdAt
    }
  }
`;

export const GET_INSIGHTS = gql`
  query GetInsights($orgId: String!, $limit: Int, $insightType: String, $severity: String) {
    insights(orgId: $orgId, limit: $limit, insightType: $insightType, severity: $severity) {
      id
      orgId
      sensorId
      insightType
      insightText
      severity
      metadata
      createdAt
    }
  }
`;

export const GET_INSIGHTS_FOR_SENSOR = gql`
  query GetInsightsForSensor($sensorId: Int!, $limit: Int) {
    insightsForSensor(sensorId: $sensorId, limit: $limit) {
      id
      orgId
      sensorId
      insightType
      insightText
      severity
      metadata
      createdAt
    }
  }
`;

export const GENERATE_INSIGHTS = gql`
  mutation GenerateInsights($orgId: String!) {
    generateInsights(orgId: $orgId) {
      success
      count
      duration
      error
    }
  }
`;
