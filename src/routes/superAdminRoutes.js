const express = require("express");

const router = express.Router();

const controller = require(
  "../controllers/superAdminController"
);

const {
  protect
} = require(
  "../middlewares/authMiddleware"
);

/* =========================================================
   TODAS AS ROTAS ABAIXO SÃO EXCLUSIVAS DE SUPERADMIN
========================================================= */

router.use(
  protect(["superadmin"])
);

/* =========================================================
   LISTAR USUÁRIOS
========================================================= */

router.get(
  "/users",
  controller.listUsers
);

/* =========================================================
   ALTERAR NÍVEL DE ACESSO
========================================================= */

router.put(
  "/users/:id/role",
  controller.updateRole
);

/* =========================================================
   EXCLUIR USUÁRIO
========================================================= */

router.delete(
  "/users/:id",
  controller.deleteUser
);

/* =========================================================
   RESETAR SENHA
========================================================= */

router.put(
  "/users/:id/reset-password",
  controller.resetarSenha
);

module.exports = router;