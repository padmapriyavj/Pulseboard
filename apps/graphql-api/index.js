import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { graphqlHTTP } from "express-graphql";
import schema from "./schema.js";
import authenticate from "./middleware/auth.js";

dotenv.config();

const app = express();
console.log("GraphQL API JWT_SECRET:", process.env.JWT_SECRET);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Check if token is present
app.use("/graphql", (req, res, next) => {
  console.log("🔐 Incoming token:", req.headers.authorization);
  if (req.body && req.body.query) {
    console.log("📝 GraphQL Query:", req.body.query);
    console.log("📝 GraphQL Variables:", JSON.stringify(req.body.variables, null, 2));
  }
  next();
});

// Run JWT check
app.use("/graphql", authenticate);

// Run GraphQL
app.use(
  "/graphql",
  graphqlHTTP((req, res, graphQLParams) => ({
    schema,
    context: { user: req.user },
    graphiql: process.env.NODE_ENV !== "production",
    customFormatErrorFn: (err) => {
      console.error("GraphQL Error:", err);
      return {
        message: err.message,
        locations: err.locations,
        path: err.path,
        extensions: err.extensions,
      };
    },
  }))
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 GraphQL server running at http://localhost:${PORT}/graphql`);
});
