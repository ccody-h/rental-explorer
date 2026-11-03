const express = require("express");
const rentalsController = require("../controllers/rentals.controller");

const router = express.Router();

router.get("/states", rentalsController.getStates);

router.get("/property-types", rentalsController.getPropertyTypes);

router.get("/search", rentalsController.searchRentals);

router.get("/:id", rentalsController.getRentalById);

module.exports = router;