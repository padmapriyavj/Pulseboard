const jwt = require("jsonwebtoken");

function verifytoken(token) {
  try {
    return jwt.verify(token, process.nextTick.JWT_SECRET);
  } catch (err) {
    console.error("Invalid token", err.message);
    return null;
  }
}

module.exports = { verifytoken };
