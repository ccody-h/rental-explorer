const express = require("express");
const knex = require("../db/knex");
const rentalsRoutes = require("./rentals.routes");
const userRoutes = require("./user.routes");
const ratingsRoutes = require("./ratings.routes");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Express API is running",
  });
});

router.get("/db-test", async (req, res) => {
  try {
    await knex.raw("SELECT 1 + 1 AS result");

    res.json({
      status: "success",
      message: "Database connection is working",
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      details: error.message,
    });
  }
});

router.use("/rentals", rentalsRoutes);
router.use("/user", userRoutes);
router.use("/ratings", ratingsRoutes);

module.exports = router;