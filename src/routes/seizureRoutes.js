const express = require("express");

const router = express.Router();

const {
  listPublic,
  listAdmin,
  previewBalance,
  closeBalance,
  listBalances,
  getBalance,
  reset
} = require("../controllers/seizureController");

const {
  protect
} = require("../middlewares/authMiddleware");

// =========================================================
// PÚBLICO
// =========================================================

router.get(
  "/public",
  listPublic
);

// =========================================================
// ADMIN
// =========================================================

router.get(
  "/admin",
  protect(["admin", "superadmin"]),
  listAdmin
);

router.get(
  "/balanco/preview",
  protect(["admin", "superadmin"]),
  previewBalance
);

router.get(
  "/balanco/historico",
  protect(["admin", "superadmin"]),
  listBalances
);

router.get(
  "/balanco/:ano/:mes",
  protect(["admin", "superadmin"]),
  getBalance
);

router.post(
  "/balanco/fechar",
  protect(["admin", "superadmin"]),
  closeBalance
);

router.post(
  "/zerar",
  protect(["admin", "superadmin"]),
  reset
);

module.exports = router;