const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const knex = require("../db/knex");

// Creates a new account
async function registerUser(req, res) {
  try {
    const { email, password } = req.body;

    // Ensure the required fields are present
    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: "Request body incomplete, both email and password are required",
      });
    }

    //duplicate accounts
    const existingUser = await knex("users").where({ email }).first();

    if (existingUser) {
      return res.status(409).json({
        error: true,
        message: "User already exists",
      });
    }

    // Store a hashed password
    const passwordHash = await bcrypt.hash(password, 10);

    await knex("users").insert({
      email,
      password_hash: passwordHash,
    });

    return res.status(201).json({
      message: "User created",
    });
  } catch (error) {
    console.error("Failed to register user:", error);

    return res.status(500).json({
      error: true,
      message: "Failed to register user",
    });
  }
}

// login helper
async function handleLogin(req, res, tokenExpirySeconds) {
  try {
    const { email, password } = req.body;

    // Ensure the required fields are present
    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: "Request body incomplete, both email and password are required",
      });
    }

    const user = await knex("users").where({ email }).first();

    if (!user) {
      return res.status(401).json({
        error: true,
        message: "Incorrect email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        error: true,
        message: "Incorrect email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: tokenExpirySeconds,
      }
    );

    return res.status(200).json({
      token,
      tokenType: "Bearer",
      expiresIn: tokenExpirySeconds,
    });
  } catch (error) {
    console.error("Failed to log in user:", error);

    return res.status(500).json({
      error: true,
      message: "Failed to log in user",
    });
  }
}

// Logs in an existing user
async function loginUser(req, res) {
  const expiresIn = Number(process.env.JWT_EXPIRES_IN) || 86400;

  return handleLogin(req, res, expiresIn);
}

// Debug login with 1 second expiry
async function debugLoginUser(req, res) {
  return handleLogin(req, res, 1);
}

// Formats MySQL date values
function formatDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  if (typeof dateValue === "string") {
    return dateValue.slice(0, 10);
  }

  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getOptionalAuthenticatedUser(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({
      error: true,
      message: "Authorization header is malformed",
    });

    return undefined;
  }

  try {
    return jwt.verify(parts[1], process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({
        error: true,
        message: "JWT token has expired",
      });

      return undefined;
    }

    res.status(401).json({
      error: true,
      message: "Invalid JWT token",
    });

    return undefined;
  }
}

function getRequiredAuthenticatedUser(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found",
    });

    return undefined;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({
      error: true,
      message: "Authorization header is malformed",
    });

    return undefined;
  }

  try {
    return jwt.verify(parts[1], process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({
        error: true,
        message: "JWT token has expired",
      });

      return undefined;
    }

    res.status(401).json({
      error: true,
      message: "Invalid JWT token",
    });

    return undefined;
  }
}

// Checks whether a YYYY-MM-DD date string represents a real date
function isRealDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// Checks whether dob is in the future
function isFutureDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  const dobDate = new Date(Date.UTC(year, month - 1, day));

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  return dobDate > today;
}

// GET /user/:email/profile
async function getUserProfile(req, res) {
  try {
    const decodedEmail = decodeURIComponent(req.params.email);

    const authenticatedUser = getOptionalAuthenticatedUser(req, res);

    // undefined means a 401 response was already sent
    if (authenticatedUser === undefined) {
      return;
    }

    const user = await knex("users")
      .where({ email: decodedEmail })
      .select("email", "first_name", "last_name", "dob", "address")
      .first();

    if (!user) {
      return res.status(404).json({
        error: true,
        message: "User not found",
      });
    }

    const publicProfile = {
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    };

    // Owner can see private profile fields
    if (authenticatedUser && authenticatedUser.email === user.email) {
      return res.status(200).json({
        ...publicProfile,
        dob: formatDate(user.dob),
        address: user.address,
      });
    }

    return res.status(200).json(publicProfile);
  } catch (error) {
    console.error("Failed to fetch user profile:", error);

    return res.status(500).json({
      error: true,
      message: "Failed to fetch user profile",
    });
  }
}

// PUT /user/:email/profile
async function updateUserProfile(req, res) {
  try {
    const decodedEmail = decodeURIComponent(req.params.email);

    const authenticatedUser = getRequiredAuthenticatedUser(req, res);

    // undefined means a 401 response was already sent
    if (authenticatedUser === undefined) {
      return;
    }

    // Users can only update their own profile
    if (authenticatedUser.email !== decodedEmail) {
      return res.status(403).json({
        error: true,
        message: "Forbidden",
      });
    }

    const existingUser = await knex("users")
      .where({ email: decodedEmail })
      .select("email")
      .first();

    if (!existingUser) {
      return res.status(404).json({
        error: true,
        message: "User not found",
      });
    }

    const { firstName, lastName, dob, address } = req.body;

    if (
      firstName === undefined ||
      lastName === undefined ||
      dob === undefined ||
      address === undefined
    ) {
      return res.status(400).json({
        error: true,
        message:
          "Request body incomplete: firstName, lastName, dob and address are required.",
      });
    }

    // firstName, lastName, and address must be strings
    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof address !== "string"
    ) {
      return res.status(400).json({
        error: true,
        message:
          "Request body invalid: firstName, lastName and address must be strings only.",
      });
    }

    if (typeof dob !== "string" || !isRealDateString(dob)) {
      return res.status(400).json({
        error: true,
        message: "Invalid input: dob must be a real date in format YYYY-MM-DD.",
      });
    }

    // dob not in the future
    if (isFutureDate(dob)) {
      return res.status(400).json({
        error: true,
        message: "Invalid input: dob must be a date in the past.",
      });
    }

    await knex("users")
      .where({ email: decodedEmail })
      .update({
        first_name: firstName,
        last_name: lastName,
        dob,
        address,
      });

    return res.status(200).json({
      email: decodedEmail,
      firstName,
      lastName,
      dob,
      address,
    });
  } catch (error) {
    console.error("Failed to update user profile:", error);

    return res.status(500).json({
      error: true,
      message: "Failed to update user profile",
    });
  }
}

module.exports = {
  registerUser,
  loginUser,
  debugLoginUser,
  getUserProfile,
  updateUserProfile,
};