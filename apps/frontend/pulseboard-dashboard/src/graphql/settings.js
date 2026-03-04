import { gql } from "@apollo/client";

export const GET_USER_SETTINGS = gql`
  query GetUserSettings {
    userSettings {
      name
      email
      organizationId
      timezone
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String!, $email: String!) {
    updateProfile(name: $name, email: $email) {
      success
      message
      user {
        id
        name
        email
        organizationId
      }
    }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      success
      message
    }
  }
`;

export const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($password: String!) {
    deleteAccount(password: $password) {
      success
      message
    }
  }
`;

export const UPDATE_ORGANIZATION = gql`
  mutation UpdateOrganization($organizationName: String!, $timezone: String!) {
    updateOrganization(organizationName: $organizationName, timezone: $timezone) {
      success
      message
    }
  }
`;
