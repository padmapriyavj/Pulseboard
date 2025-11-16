import { gql } from "@apollo/client";

export const GET_SENSORS = gql`
  query GetSensors($org_id: String!) {
    getSensors(org_id: $org_id) {
      id
      type
      min
      max
      unit
      status
    }
  }
`;

export const ADD_SENSOR = gql`
  mutation AddSensor($input: SensorInput!) {
    addSensor(input: $input) {
      id
      type
      min
      max
      unit
      status
    }
  }
`;
