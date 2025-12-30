import db from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const { name, email, password, org_name } = req.body;

  if (!name || !email || !password || !org_name) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    // Check if organization already exists
    const existingOrg = await db.query(
      "SELECT * FROM organizations WHERE LOWER(name) = LOWER($1)",
      [org_name]
    );

    if (existingOrg.rows.length > 0) {
      return res.status(409).json({
        error: "Organization already exists. Each organization can only have one admin user.",
      });
    }

    // Create organization slug from name (lowercase, replace spaces with hyphens)
    const org_slug = org_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Begin transaction to create both organization and user
    await db.query("BEGIN");

    try {
      // Create organization
      const orgResult = await db.query(
        "INSERT INTO organizations (name, org_slug, created_at) VALUES ($1, $2, NOW()) RETURNING id, name, org_slug",
        [org_name, org_slug]
      );

      const org = orgResult.rows[0];

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user (admin) for the organization
      const userResult = await db.query(
        "INSERT INTO users (name, email, password, org_id, role, created_at) VALUES ($1, $2, $3, $4, 'admin', NOW()) RETURNING id, name, email, org_id, role",
        [name, email, hashedPassword, org.id]
      );

      const user = userResult.rows[0];

      // Commit transaction
      await db.query("COMMIT");

      // Generate JWT token with user id and org id
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          org_id: org.id,
          org_slug: org.org_slug,
          org_name: org.name,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.status(201).json({
        message: "Organization and user registered successfully",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        organization: {
          id: org.id,
          name: org.name,
          org_slug: org.org_slug,
        },
      });
    } catch (err) {
      // Rollback transaction on error
      await db.query("ROLLBACK");
      throw err;
    }
  } catch (err) {
    console.error("Register error:", err);

    // Handle unique constraint violations
    if (err.code === '23505') {
      if (err.constraint === 'users_email_key') {
        return res.status(409).json({ error: "Email already in use" });
      }
      if (err.constraint === 'users_org_id_key') {
        return res.status(409).json({ error: "Organization already has an admin user" });
      }
      if (err.constraint === 'organizations_name_key') {
        return res.status(409).json({ error: "Organization name already exists" });
      }
    }

    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password, org_name } = req.body;

  if (!email || !password || !org_name) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    // Find organization by name
    const orgResult = await db.query(
      "SELECT id, name, org_slug FROM organizations WHERE LOWER(name) = LOWER($1)",
      [org_name]
    );

    if (orgResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const org = orgResult.rows[0];

    // Find user by email and org_id
    const userResult = await db.query(
      "SELECT * FROM users WHERE email = $1 AND org_id = $2",
      [email, org.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = userResult.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token with user id and org id
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        org_id: org.id,
        org_slug: org.org_slug,
        org_name: org.name,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("Generated token:", token);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      organization: {
        id: org.id,
        name: org.name,
        org_slug: org.org_slug,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};
