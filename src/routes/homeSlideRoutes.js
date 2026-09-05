const express = require("express");

const router = express.Router();

const controller = require(
  "../controllers/homeSlideController"
);

const {
  protect
} = require(
  "../middlewares/authMiddleware"
);

const upload = require(
  "../middlewares/upload"
);

/* =========================================================
   🌐 PÚBLICO
========================================================= */

router.get(
  "/public",
  controller.listPublic
);

/* =========================================================
   🧑‍💼 ADMIN – LISTAR
========================================================= */

router.get(
  "/admin",
  protect([
    "admin",
    "superadmin"
  ]),
  controller.listAdmin
);

/* =========================================================
   🧑‍💼 ADMIN – CRIAR
========================================================= */

router.post(
  "/admin",
  protect([
    "admin",
    "superadmin"
  ]),
  upload.single("imagem"),
  controller.create
);

/* =========================================================
   🧑‍💼 ADMIN – EDITAR
========================================================= */

router.put(
  "/admin/:id",
  protect([
    "admin",
    "superadmin"
  ]),
  controller.update
);

/* =========================================================
   🧑‍💼 ADMIN – EXCLUIR
========================================================= */

router.delete(
  "/admin/:id",
  protect([
    "admin",
    "superadmin"
  ]),
  controller.remove
);

module.exports = router;