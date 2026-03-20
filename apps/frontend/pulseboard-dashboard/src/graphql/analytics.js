import { gql } from "@apollo/client";

export const GET_ANALYTICS_DATA = gql`
  query GetAnalyticsData(
    $orgId: String!
    $sensorIds: [Int!]
    $startDate: String!
    $endDate: String!
  ) {
    analyticsData(
      orgId: $orgId
      sensorIds: $sensorIds
      startDate: $startDate
      endDate: $endDate
    ) {
      totalDataPoints
      averageUptime
      dataQualityScore
      alertRate
      timeSeries {
        timestamp
        sensorId
        sensorName
        sensorType
        value
        unit
      }
      statistics {
        sensorId
        sensorName
        sensorType
        sensorUnit
        min
        max
        avg
        median
        stdDev
        dataPoints
        missingDataPoints
        outlierCount
      }
    }
  }
`;
