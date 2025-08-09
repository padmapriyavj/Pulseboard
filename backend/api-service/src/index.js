require("dotenv").config();
const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const cors = require("cors");

const { typeDefs, resolvers } = require("./schema");
const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.send("API is healthy"));
async function startServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`API ready at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();
