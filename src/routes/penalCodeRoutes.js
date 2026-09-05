const express = require("express");
const router = express.Router();

const controller = require("../controllers/penalCodeController");
const { protect } = require("../middlewares/authMiddleware");

// ==========================
// PÚBLICO LOGADO / USUÁRIO
// ==========================

router.get("/", protect(), controller.listPenalCodes);
router.get("/stats", protect(), controller.getPenalCodeStats);
router.get("/highlights", protect(), controller.listQuickHighlights);

// ==========================
// ADMIN
// ==========================

router.get(
  "/admin",
  protect(["admin", "superadmin"]),
  controller.listAdminPenalCodes
);

router.post(
  "/admin",
  protect(["admin", "superadmin"]),
  controller.createPenalCode
);

router.put(
  "/admin/:id",
  protect(["admin", "superadmin"]),
  controller.updatePenalCode
);

router.patch(
  "/admin/:id/toggle-active",
  protect(["admin", "superadmin"]),
  controller.toggleActivePenalCode
);

router.patch(
  "/admin/:id/toggle-highlight",
  protect(["admin", "superadmin"]),
  controller.toggleHighlightPenalCode
);

router.delete(
  "/admin/:id",
  protect(["admin", "superadmin"]),
  controller.deletePenalCode
);

// ==========================
// DETALHE
// ==========================

router.get("/:id", protect(), controller.getPenalCodeById);

module.exports = router;