const express = require("express");

const router = express.Router();

const controller = require(
  "../controllers/highCommandNoticeController"
);

const {
  protect
} = require("../middlewares/authMiddleware");

const onlyComando = require(
  "../middlewares/onlyComando"
);

const autenticados = [
  "user",
  "admin",
  "superadmin",
  "comando"
];

/* =========================================================
   USUÁRIO — AVISO ATIVO

   Precisa continuar acessível ao policial comum,
   porque aparece no Painel do Usuário.
========================================================= */

router.get(
  "/active",
  protect(autenticados),
  controller.getActiveNoticeForUser
);

/* =========================================================
   USUÁRIO — RESPONDER AVISO
========================================================= */

router.post(
  "/:id/respond",
  protect(autenticados),
  controller.respondNotice
);

/* =========================================================
   COMANDO — LISTAR TODOS OS AVISOS
========================================================= */

router.get(
  "/",
  protect(autenticados),
  onlyComando,
  controller.listAllNotices
);

/* =========================================================
   COMANDO — CRIAR AVISO
========================================================= */

router.post(
  "/",
  protect(autenticados),
  onlyComando,
  controller.createNotice
);

/* =========================================================
   COMANDO — DESATIVAR AVISO
========================================================= */

router.patch(
  "/:id/deactivate",
  protect(autenticados),
  onlyComando,
  controller.deactivateNotice
);

module.exports = router;