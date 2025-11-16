import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { graphqlHTTP } from "express-graphql";
import schema from "./schema.js";
import authenticate from "../auth-service/middleware/auth.js";

dotenv.config();

const app = express();
console.log("GraphQL API JWT_SECRET:", process.env.JWT_SECRET);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Check if token is present
app.use("/graphql", (req, res, next) => {
  console.log("🔐 Incoming token:", req.headers.authorization);
  next();
});

// Run JWT check
app.use("/graphql", authenticate);

// Run GraphQL
app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: process.env.NODE_ENV !== "production",
  })
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 GraphQL server running at http://localhost:${PORT}/graphql`);
});
