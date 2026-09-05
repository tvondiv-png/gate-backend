const express = require("express");

const router = express.Router();

const controller = require(
  "../controllers/comandoComunicadoController"
);

const {
  protect
} = require("../middlewares/authMiddleware");

const onlyComando = require(
  "../middlewares/onlyComando"
);

/* =========================================================
   AUTENTICADOS

   O onlyComando é quem decide se há acesso
   administrativo ao módulo do Comando.
========================================================= */

const autenticados = [
  "user",
  "admin",
  "superadmin",
  "comando"
];

/* =========================================================
   COMANDO — CRIAR COMUNICADO

   Somente:
   - Comando do Batalhão
   - Subcomando do Batalhão
   - Superadmin
========================================================= */

router.post(
  "/",
  protect(autenticados),
  onlyComando,
  controller.criar
);

/* =========================================================
   COMANDO — LISTAR COMUNICADOS
========================================================= */

router.get(
  "/",
  protect(autenticados),
  onlyComando,
  controller.listar
);

/* =========================================================
   USUÁRIO — RECEBER COMUNICADOS

   NÃO USAR onlyComando AQUI.

   Esta rota abastece o Painel do Policial.
========================================================= */

router.get(
  "/usuario",
  protect([
    "user",
    "admin",
    "superadmin",
    "comando"
  ]),
  controller.buscarParaUsuario
);

/* =========================================================
   USUÁRIO — CONFIRMAR CIÊNCIA

   NÃO USAR onlyComando AQUI.

   Todo policial autorizado precisa conseguir
   registrar ciência de uma ordem/comunicado.
========================================================= */

router.post(
  "/:id/ciente",
  protect([
    "user",
    "admin",
    "superadmin",
    "comando"
  ]),
  controller.marcarCiente
);

/* =========================================================
   COMANDO — VER DETALHE
========================================================= */

router.get(
  "/:id/detalhe",
  protect(autenticados),
  onlyComando,
  controller.detalhe
);

/* =========================================================
   COMANDO — ENCERRAR COMUNICADO
========================================================= */

router.patch(
  "/:id/encerrar",
  protect(autenticados),
  onlyComando,
  controller.encerrar
);

module.exports = router;