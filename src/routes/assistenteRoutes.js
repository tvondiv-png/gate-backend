const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { protect } = require("../middlewares/authMiddleware");
const controller = require("../controllers/assistenteController");

// Cada chamada custa dinheiro (API paga) — limite por IP evita abuso.
const assistenteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Muitas perguntas ao assistente. Tente novamente em alguns minutos."
  }
});

const autenticados = ["user", "admin", "comando", "superadmin"];

router.get("/status", protect(autenticados), controller.status);

router.post(
  "/regulamento",
  protect(autenticados),
  assistenteLimiter,
  controller.perguntarRegulamento
);

router.post(
  "/bopm",
  protect(autenticados),
  assistenteLimiter,
  controller.revisarBOPM
);

module.exports = router;
