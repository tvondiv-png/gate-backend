const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  getUserDashboard
} = require("../controllers/userDashboardController");

// 🔐 Dashboard do usuário logado
router.get("/me", protect(), getUserDashboard);

module.exports = router;
