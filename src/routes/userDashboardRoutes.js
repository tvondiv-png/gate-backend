const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { getMyDashboard } = require("../controllers/userDashboardController");
const metaController = require("../controllers/comandoMetaController");

router.get("/me", protect(), getMyDashboard);

/* Metas do Comando — visão do policial */
router.get("/metas", protect(), metaController.minhasMetas);
router.post("/metas/vistas", protect(), metaController.marcarVistas);

module.exports = router;
