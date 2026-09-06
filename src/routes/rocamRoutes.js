const express = require("express");

const router = express.Router();

const controller =
  require("../controllers/rocamController");

const evaluationController =
  require("../controllers/rocamEvaluationController");

const communicationController =
  require("../controllers/rocamCommunicationController");

const dashboardController =
  require("../controllers/rocamDashboardController");

const {
  protect
} =
  require("../middlewares/authMiddleware");

const {
  onlyRocam,
  onlyRocamCommand
} =
  require("../middlewares/rocamAccess");

/* =========================================================
   LOGIN OBRIGATÓRIO
========================================================= */

router.use(
  protect([
    "user",
    "admin",
    "comando",
    "superadmin"
  ])
);

/* =========================================================
   POLICIAL ROCAM
========================================================= */

router.get(
  "/contexto",
  onlyRocam,
  controller.getAccessContext
);

router.get(
  "/dashboard",
  onlyRocam,
  dashboardController.getDashboard
);

router.get(
  "/me",
  onlyRocam,
  controller.getMyProfile
);

router.get(
  "/hierarquia",
  onlyRocam,
  controller.getHierarchy
);

/* =========================================================
   MENSAGENS
========================================================= */

router.get(
  "/mensagens/contatos",
  onlyRocam,
  communicationController.listContacts
);

router.get(
  "/mensagens/recebidas",
  onlyRocam,
  communicationController.inbox
);

router.get(
  "/mensagens/enviadas",
  onlyRocam,
  communicationController.sent
);

router.post(
  "/mensagens",
  onlyRocam,
  communicationController.sendMessage
);

router.patch(
  "/mensagens/:id/lida",
  onlyRocam,
  communicationController.readMessage
);

/* =========================================================
   AVISOS
========================================================= */

router.get(
  "/avisos",
  onlyRocam,
  communicationController.listNotices
);

/* =========================================================
   BRAÇAL — AVALIAÇÃO
========================================================= */

router.get(
  "/avaliacoes/estagiarios",
  onlyRocam,
  evaluationController.listTraineesForEvaluation
);

router.get(
  "/avaliacoes/estagiarios/:userId",
  onlyRocam,
  evaluationController.getTraineeForEvaluation
);

router.post(
  "/avaliacoes/estagiarios/:userId",
  onlyRocam,
  evaluationController.createEvaluation
);

/* =========================================================
   COMANDO ROCAM
========================================================= */

router.get(
  "/comando/elegiveis",
  onlyRocamCommand,
  controller.listEligiblePolice
);

router.post(
  "/comando/estagiarios",
  onlyRocamCommand,
  controller.createTrainee
);

router.get(
  "/comando/estagiarios",
  onlyRocamCommand,
  controller.listTrainees
);

router.patch(
  "/comando/estagiarios/:userId/metas",
  onlyRocamCommand,
  controller.updateStageGoals
);

router.patch(
  "/comando/estagiarios/:userId/aprovar",
  onlyRocamCommand,
  controller.approveStage
);

router.get(
  "/comando/bracais",
  onlyRocamCommand,
  controller.listBracais
);

router.post(
  "/comando/designar",
  onlyRocamCommand,
  controller.assignRole
);

router.get(
  "/comando/historico/:userId",
  onlyRocamCommand,
  controller.getHistory
);

router.get(
  "/comando/estagiarios/:userId/ficha",
  onlyRocamCommand,
  controller.getTraineeDetails
);

router.patch(
  "/comando/estagiarios/:userId/recalcular",
  onlyRocamCommand,
  controller.recalculateStage
);

router.patch(
  "/comando/desligar/:userId",
  onlyRocamCommand,
  controller.removeFromRocam
);

/* =========================================================
   AVALIAÇÕES — COMANDO
========================================================= */

router.get(
  "/comando/avaliacoes",
  onlyRocamCommand,
  evaluationController.listEvaluationsForCommand
);

router.patch(
  "/comando/avaliacoes/:id/validar",
  onlyRocamCommand,
  evaluationController.validateEvaluation
);

router.patch(
  "/comando/avaliacoes/:id/devolver",
  onlyRocamCommand,
  evaluationController.returnEvaluation
);

/* =========================================================
   AVISOS — COMANDO
========================================================= */

router.post(
  "/comando/avisos",
  onlyRocamCommand,
  communicationController.createNotice
);

router.patch(
  "/comando/avisos/:id/desativar",
  onlyRocamCommand,
  communicationController.disableNotice
);

module.exports = router;