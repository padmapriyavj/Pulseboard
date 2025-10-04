import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const users = [];

export const register = async (req, res) => {
  const { name, email, password, org_id } = req.body;

  if (!name || !email || !password || !org_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const existing = users.find((u) => u.email === email && u.org_id === org_id);
  if (existing) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ name, email, password: hashedPassword, org_id });

  return res.status(201).json({ message: 'User registered' });
};

export const login = async (req, res) => {
  const { email, password, org_id } = req.body;

  const user = users.find((u) => u.email === email && u.org_id === org_id);
  if (!user) return res.status(401).json({ message: 'User not found' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: 'Invalid password' });

  const token = jwt.sign({ email, org_id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  res.json({ token });
};
