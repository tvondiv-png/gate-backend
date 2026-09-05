const express = require("express");
const router = express.Router();

const controller = require("../controllers/apresentacaoEstagiarioController");
const { protect } = require("../middlewares/authMiddleware");

// =========================
// USER
// =========================
router.get(
  "/estagiarios",
  protect(["user", "admin", "superadmin"]),
  controller.listarEstagiariosDisponiveis
);

router.post(
  "/",
  protect(["user", "admin", "superadmin"]),
  controller.criarApresentacao
);

router.get(
  "/minhas",
  protect(["user", "admin", "superadmin"]),
  controller.minhasApresentacoes
);

// =========================
// ADMIN
// =========================
router.get(
  "/admin",
  protect(["admin", "superadmin"]),
  controller.listarTodas
);

// 🔥 VALIDAR (AJUSTADO PARA BATER COM O FRONT)
router.post(
  "/:id/validar",
  protect(["admin", "superadmin"]),
  controller.validar
);

// 🔥 REJEITAR (NOVO)
router.post(
  "/:id/rejeitar",
  protect(["admin", "superadmin"]),
  controller.rejeitar
);

// 🔥 EXCLUIR (NOVO)
router.delete(
  "/:id",
  protect(["admin", "superadmin"]),
  controller.excluir
);

module.exports = router;