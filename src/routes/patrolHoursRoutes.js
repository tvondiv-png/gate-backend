const express = require("express");
const router = express.Router();
const controller = require("../controllers/patrolHoursController");
const { protect } = require("../middlewares/authMiddleware");

// ===== LISTAGEM =====
router.get("/", protect(["admin", "superadmin"]), controller.listAll);
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