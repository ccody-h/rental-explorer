const express = require("express");
const ratingsController = require("../controllers/ratings.controller");
const authenticateToken = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/debugEraseRatings", ratingsController.debugEraseRatings);

router.use(authenticateToken);

router.get("/", ratingsController.getUserRatings);

router.get("/rentals/:id", ratingsController.getRatingForRental);

router.post("/rentals/:id", ratingsController.createOrUpdateRating);

module.exports = router;