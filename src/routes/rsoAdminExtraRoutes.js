const express = require("express");
const router = express.Router();

const {
  listarAtivos,
  encerrarAtivo,
  apagarRSO
} = require("../controllers/rsoAdminExtraController");

const { protect } = require("../middlewares/authMiddleware");

// 🔒 Middleware simples (não quebra nada)
const isAdmin = (req, res, next) => {
  if (req.user?.role === "admin" || req.user?.role === "superadmin") {
    return next();
  }
  return res.status(403).json({ message: "Acesso negado" });
};

// 📌 RSOs ATIVOS (ESPELHO)
router.get(
  "/ativos",
  protect(["admin", "superadmin"]),
  isAdmin,
  listarAtivos
);

// 🔒 ENCERRAR RSO ATIVO
router.put(
  "/:id/encerrar",
  protect(["admin", "superadmin"]),
  isAdmin,
  encerrarAtivo
);

// 🗑️ APAGAR RSO DO HISTÓRICO
router.delete(
  "/:id",
  protect(["admin", "superadmin"]),
  isAdmin,
  apagarRSO
);

const { apagarHistoricoRSO } = require("../controllers/rsoAdminExtraController");

// 🗑️ APAGAR HISTÓRICO COMPLETO
router.delete(
  "/historico/limpar",
  protect,
  isAdmin,
  apagarHistoricoRSO
);


module.exports = router;
