const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { getMyDashboard } = require("../controllers/userDashboardController");

router.get("/me", protect(), getMyDashboard);

module.exports = router;
