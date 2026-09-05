const express = require("express");
const router = express.Router();

const signupController = require("../controllers/signupController");
const { protect } = require("../middlewares/authMiddleware");

// =========================================================
// PÚBLICO
// Qualquer visitante pode enviar uma solicitação de cadastro.
// =========================================================

router.post("/", signupController.create);

// =========================================================
// ADMIN
// Listar, aprovar e rejeitar exigem admin ou superadmin.
// =========================================================

router.get(
  "/",
  protect(["admin", "superadmin"]),
  signupController.list
);

router.put(
  "/approve/:id",
  protect(["admin", "superadmin"]),
  signupController.approve
);

router.put(
  "/reject/:id",
  protect(["admin", "superadmin"]),
  signupController.reject
);

module.exports = router;
