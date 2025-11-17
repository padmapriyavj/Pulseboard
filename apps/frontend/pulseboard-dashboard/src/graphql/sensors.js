import { gql } from "@apollo/client";

export const GET_SENSORS = gql`
  query GetSensors($org_id: String!) {
    getSensors(org_id: $org_id) {
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

export const ADD_SENSOR = gql`
  mutation AddSensor($input: SensorInput!) {
    addSensor(input: $input) {
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

export const UPDATE_SENSOR = gql`
  mutation UpdateSensor($id: Int!, $input: SensorUpdateInput!) {
    updateSensor(id: $id, input: $input) {
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

export const DELETE_SENSOR = gql`
  mutation DeleteSensor($id: Int!) {
    deleteSensor(id: $id) {
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
