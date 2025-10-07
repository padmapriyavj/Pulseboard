import dotenv from "dotenv";
import express from "express";
import { graphqlHTTP } from "express-graphql";
import cors from "cors";
import schema from "./schema.js";
import authenticate from "../auth-service/middleware/auth.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());

app.use("/graphql", authenticate, graphqlHTTP({
  schema,
  graphiql: process.env.NODE_ENV !== "production", // Optional: disable GraphiQL in prod
}));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 GraphQL server running at http://localhost:${PORT}/graphql`);
});
