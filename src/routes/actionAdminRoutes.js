const express = require("express");

const router = express.Router();

const controller = require("../controllers/actionAdminController");

const {
  protect
} = require("../middlewares/authMiddleware");

const onlyComando = require(
  "../middlewares/onlyComando"
);

/* =========================================================
   AUTENTICADOS QUE PODEM CHEGAR À VALIDAÇÃO DO COMANDO
========================================================= */

const autenticados = [
  "user",
  "admin",
  "superadmin",
  "comando"
];

/* =========================================================
   ADMIN — AÇÕES PENDENTES
========================================================= */

router.get(
  "/pending",
  protect([
    "admin",
    "superadmin"
  ]),
  controller.listPendingActions
);

/* =========================================================
   ADMIN — HISTÓRICO
========================================================= */

router.get(
  "/history",
  protect([
    "admin",
    "superadmin"
  ]),
  controller.listApprovedHistory
);

/* =========================================================
   MÉTRICAS

   ESTA ROTA É COMPARTILHADA COM O CENTRO DE COMANDO.

   Pode acessar:
   - admin
   - superadmin
   - Comando do Batalhão
   - Subcomando do Batalhão

   O admin continua acessando normalmente.
========================================================= */

router.get(
  "/metrics",
  protect(autenticados),

  (req, res, next) => {
    if (
      req.user?.role === "admin" ||
      req.user?.role === "superadmin"
    ) {
      return next();
    }

    return onlyComando(
      req,
      res,
      next
    );
  },

  controller.getMetrics
);

/* =========================================================
   ADMIN — ESTATÍSTICAS GERAIS
========================================================= */

router.get(
  "/stats/general",
  protect([
    "admin",
    "superadmin"
  ]),
  controller.getGeneralActionStats
);

/* =========================================================
   ADMIN — CRIAR AÇÃO
========================================================= */

router.post(
  "/create",
  protect([
    "admin",
    "superadmin"
  ]),
  controller.createActionByAdmin
);

/* =========================================================
   ADMIN — DETALHE DA AÇÃO
========================================================= */

router.get(
  "/:id",
  protect([
    "admin",
    "superadmin"
  ]),
  controller.getActionById
);

/* =========================================================
   ADMIN — APROVAR
========================================================= */

router.patch(
  "/:id/approve",
  protect([
    "admin",
    "superadmin"
  ]),
  controller.approveAction
);

/* =========================================================
   ADMIN — REJEITAR
========================================================= */

router.patch(
  "/:id/reject",
  protect([
    "admin",
    "superadmin"
  ]),
  controller.rejectAction
);

/* =========================================================
   ADMIN — EXCLUIR DO HISTÓRICO
========================================================= */

router.patch(
  "/:id/exclude-history",
  protect([
    "admin",
    "superadmin"
  ]),
  controller.excludeHistory
);

/* =========================================================
   ADMIN — ALTERAR CONTABILIZAÇÃO DA META
========================================================= */

router.patch(
  "/:id/contabilizar-meta",
  protect([
    "admin",
    "superadmin"
  ]),
  controller.toggleContabilizarMeta
);

/* =========================================================
   ADMIN — LIMPAR MÉTRICAS

   IMPORTANTE:
   Comando NÃO pode limpar dados.
========================================================= */

router.post(
  "/metrics/clear",
  protect([
    "admin",
    "superadmin"
  ]),
  controller.clearMetricsData
);

module.exports = router;