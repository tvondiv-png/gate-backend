const express = require("express");
const router = express.Router();
const RSOHistory = require("../models/RSOHistory");

const controller = require("../controllers/rsoAdminController");
const hoursService = require("../services/patrolHoursService");
const { syncAllFromHierarchy } = require("../services/patrolHoursService");
const { protect } = require("../middlewares/authMiddleware");

// ======================
// RSOs
// ======================
router.get(
  "/pendentes",
  protect(["admin", "superadmin"]),
  controller.listPendentes
);

router.post(
  "/aprovar/:id",
  protect(["admin", "superadmin"]),
  controller.aprovarRSO
);

router.post(
  "/rejeitar/:id",
  protect(["admin", "superadmin"]),
  controller.rejeitar
);

// ======================
// HORAS DE PATRULHA
// ======================
router.get(
  "/horas",
  protect(["admin", "superadmin"]),
  async (req, res) => {
    await syncAllFromHierarchy(); // 🔗 sincroniza com hierarquia ADM
    res.json(await hoursService.listar());
  }
);

router.post(
  "/horas/zerar-semana",
  protect(["admin", "superadmin"]),
  async (req, res) => {
    await hoursService.zerarSemana();
    res.json({ message: "Horas semanais zeradas" });
  }
);

router.post(
  "/horas/zerar-mes",
  protect(["admin", "superadmin"]),
  async (req, res) => {
    await hoursService.zerarMes();
    res.json({ message: "Horas mensais zeradas" });
  }
);

// ======================
// HISTÓRICO DE RSO
// ======================

// listar histórico (admin e superadmin)
router.get(
  "/historico",
  protect(["admin", "superadmin"]),
  async (req, res) => {
    const historico = await RSOHistory.find()
      .sort({ createdAt: -1 })
      .limit(500);

    res.json(historico);
  }
);

    // 🔴 apagar TODO o histórico (somente superadmin)
router.delete(
  "/historico",
  protect(["superadmin"]),
  async (req, res) => {
    await RSOHistory.deleteMany({});
    res.json({ message: "Histórico de RSO apagado" });
  }
);



module.exports = router;
