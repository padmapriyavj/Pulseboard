import db from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const { name, email, password, org_id } = req.body;

  if (!name || !email || !password || !org_id) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    const existingUser = await db.query(
      "SELECT * FROM users WHERE email = $1 AND org_id = $2",
      [email, org_id]
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(409)
        .json({
          error: "User with this email already exists in the organization",
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, email, password, org_id, created_at) VALUES ($1, $2, $3, $4, NOW())",
      [name, email, hashedPassword, org_id]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password, org_id } = req.body;
  try {
    const result = await db.query(
      "SELECT * FROM users WHERE email = $1 AND org_id = $2",
      [email, org_id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Get user name - use name from database, or fallback to email username
    const userName = user.name || user.email.split('@')[0];
    console.log("User login - name from DB:", user.name, "computed userName:", userName);

    const token = jwt.sign(
      { id: user.id, email: user.email, org_id: user.org_id, name: userName },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ 
      token,
      userName 
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};
