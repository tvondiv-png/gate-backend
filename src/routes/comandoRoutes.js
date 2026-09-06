const express = require("express");

const router = express.Router();

const controller = require("../controllers/comandoController");
const metaController = require("../controllers/comandoMetaController");

const {
  protect
} = require("../middlewares/authMiddleware");

const onlyComando = require(
  "../middlewares/onlyComando"
);

/* =========================================================
   ROLES QUE PODEM PASSAR PELA AUTENTICAÇÃO

   IMPORTANTE:
   Isto NÃO significa autorização ao Comando.

   O onlyComando fará a validação definitiva
   através de:
   - Superadmin
   - Comando do Batalhão
   - Subcomando do Batalhão
========================================================= */

const autenticados = [
  "user",
  "admin",
  "superadmin",
  "comando"
];

/* =========================================================
   SCORE DE DESEMPENHO
========================================================= */

router.get(
  "/score-desempenho",
  protect(autenticados),
  onlyComando,
  controller.scoreDesempenho
);

/* =========================================================
   CONSULTA RÁPIDA
========================================================= */

router.get(
  "/consultas",
  protect(autenticados),
  onlyComando,
  controller.consultaRapida
);

/* =========================================================
   RESUMO DE DISCIPLINA
========================================================= */

router.get(
  "/disciplina",
  protect(autenticados),
  onlyComando,
  controller.disciplinaResumo
);

/* =========================================================
   ALERTAR POLICIAIS COM ZERO HORAS
========================================================= */

router.post(
  "/alertar-zero",
  protect(autenticados),
  onlyComando,
  controller.alertarZeroHoras
);

/* =========================================================
   METAS DO COMANDO
========================================================= */

router.get(
  "/dashboard-extra",
  protect(autenticados),
  onlyComando,
  metaController.dashboardExtra
);

router.get(
  "/metas",
  protect(autenticados),
  onlyComando,
  metaController.listarMetas
);

router.post(
  "/metas",
  protect(autenticados),
  onlyComando,
  metaController.criarMeta
);

router.get(
  "/metas/:id",
  protect(autenticados),
  onlyComando,
  metaController.detalharMeta
);

router.delete(
  "/metas/:id",
  protect(autenticados),
  onlyComando,
  metaController.excluirMeta
);

module.exports = router;