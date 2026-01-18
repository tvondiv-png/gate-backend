const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/login", authController.login);

router.put(
  "/change-password",
  protect(["user", "admin", "superadmin"]),
  authController.changePassword
);

module.exports = router;
