const express = require("express");
const router = express.Router();

const controller = require("../controllers/avaliacaoEstagioController");
const { protect } = require("../middlewares/authMiddleware");

// ==========================
// USER
// ==========================

router.get(
  "/estagiarios",
  protect(["user", "admin", "superadmin"]),
  controller.listEstagiarios
);

router.get(
  "/me/rsos",
  protect(["user", "admin", "superadmin"]),
  controller.listMyRsos
);

router.get(
  "/rso/:rsoId/autofill",
  protect(["user", "admin", "superadmin"]),
  controller.getRsoAutoFill
);

router.post(
  "/",
  protect(["user", "admin", "superadmin"]),
  controller.create
);

router.get(
  "/me",
  protect(["user", "admin", "superadmin"]),
  controller.listMine
);

router.put(
  "/:id",
  protect(["user", "admin", "superadmin"]),
  controller.updateMine
);

router.delete(
  "/:id",
  protect(["user", "admin", "superadmin"]),
  controller.deleteMine
);

// ==========================
// ADMIN / COORDENADOR
// ==========================

router.get(
  "/admin",
  protect(["admin", "superadmin", "user"]),
  controller.listAdmin
);

router.post(
  "/:id/validar",
  protect(["admin", "superadmin", "user"]),
  controller.validateAdmin
);

router.post(
  "/:id/revisao",
  protect(["admin", "superadmin", "user"]),
  controller.returnForCorrection
);

router.delete(
  "/:id/admin",
  protect(["admin", "superadmin", "user"]),
  controller.deleteAdmin
);

router.delete(
  "/admin/historico",
  protect(["admin", "superadmin", "user"]),
  controller.clearHistoryAdmin
);

module.exports = router;