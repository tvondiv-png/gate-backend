const express = require("express");
const router = express.Router();

const {
  criarIndicacao,
  minhasIndicacoes
} = require("../controllers/indicationController");

const { protect } = require("../middlewares/authMiddleware");

// 👤 USUÁRIO – CRIAR INDICAÇÃO
router.post(
  "/",
  protect(["user", "admin", "superadmin"]),
  criarIndicacao
);

// 👤 USUÁRIO – MINHAS INDICAÇÕES
router.get(
  "/minhas",
  protect(["user", "admin", "superadmin"]),
  minhasIndicacoes
);

module.exports = router;
