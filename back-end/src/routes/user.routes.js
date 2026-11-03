const express = require("express");
const userController = require("../controllers/user.controller");

const router = express.Router();

router.post("/register", userController.registerUser);

router.post("/login", userController.loginUser);

router.post("/debugLogin", userController.debugLoginUser);

router.get("/:email/profile", userController.getUserProfile);

router.put("/:email/profile", userController.updateUserProfile);

module.exports = router;