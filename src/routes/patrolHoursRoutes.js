const express = require("express");
const router = express.Router();
const controller = require("../controllers/patrolHoursController");
const { protect } = require("../middlewares/authMiddleware");
const adminOuComando = require("../middlewares/adminOuComando");

// ===== LISTAGEM =====
// admin/superadmin (Painel ADM) OU Comando/Subcomando do Batalhão
// (Painel de Comando, que autoriza por função e não só por role)
router.get(
  "/",
  protect(["user", "admin", "comando", "superadmin"]),
  adminOuComando,
  controller.listAll
);
router.get("/filters", protect(["admin", "superadmin"]), controller.getFilters);
router.get("/report", protect(["admin", "superadmin"]), controller.getReport);

// ===== HISTÓRICO =====
router.get("/history", protect(["admin", "superadmin"]), controller.getHistory);
router.get("/history/report", protect(["admin", "superadmin"]), controller.getHistoryReport);

// ===== AÇÕES ADMIN =====
router.post("/reset-week", protect(["superadmin"]), controller.resetWeekly);
router.post("/reset-month", protect(["superadmin"]), controller.resetMonthly);
router.delete("/history/clear", protect(["superadmin"]), controller.clearHistory);

// ===== ATUALIZAÇÃO =====
router.put("/:id/absence-status", protect(["admin", "superadmin"]), controller.updateAbsenceStatus);

module.exports = router;