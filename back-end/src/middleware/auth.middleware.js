const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  // Check that the Authorization header exists
  if (!authHeader) {
    return res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found",
    });
  }

  const parts = authHeader.split(" ");

  // Header must be in format: Bearer tokenHere
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found",
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Store decoded user information
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: true,
        message: "JWT token has expired",
      });
    }

    return res.status(401).json({
      error: true,
      message: "Invalid JWT token",
    });
  }
}

module.exports = authenticateToken;