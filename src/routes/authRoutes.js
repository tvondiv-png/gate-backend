const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/login", authController.login);

// 🔑 NOVA ROTA (ESSENCIAL PARA O FRONTEND)
router.get(
  "/me",
  protect(["user", "admin", "superadmin"]),
  authController.me
);

router.put(
  "/change-password",
  protect(["user", "admin", "superadmin"]),
  authController.changePassword
);

module.exports = router;
