const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const controller = require("../controllers/adminDashboardController");

router.get(
  "/",
  protect(["admin", "superadmin"]),
  controller.getDashboardData
);

module.exports = router;
