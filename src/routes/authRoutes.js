const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

// =========================================================
// RATE LIMIT DO LOGIN
// Protege contra força bruta de senha.
// =========================================================

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Muitas tentativas de login. Tente novamente em alguns minutos."
  }
});

// Todas as roles que representam um usuário autenticado.
const AUTENTICADO = ["user", "admin", "comando", "superadmin"];

router.post("/login", loginLimiter, authController.login);

router.get(
  "/me",
  protect(AUTENTICADO),
  authController.me
);

router.put(
  "/change-password",
  protect(AUTENTICADO),
  authController.changePassword
);

module.exports = router;
