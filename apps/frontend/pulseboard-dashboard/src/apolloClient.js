import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";

const getToken = () =>
  sessionStorage.getItem("token") || localStorage.getItem("token");

const errorLink = onError(({ networkError }) => {
  if (networkError && networkError.statusCode === 403) {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("org_id");
    sessionStorage.removeItem("user_name");
    localStorage.removeItem("token");
    localStorage.removeItem("org_id");
    localStorage.removeItem("user_name");
    window.location.href = "/";
  }
});

const httpLink = createHttpLink({
  uri: "http://localhost:4000/graphql",
});

const authLink = setContext((_, { headers }) => {
  const token = getToken();
  console.log("Token set", token);
  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});


export default client;
