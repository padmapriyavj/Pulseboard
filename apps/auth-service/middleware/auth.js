import jwt from "jsonwebtoken";

export default function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ JWT verification failed:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}
