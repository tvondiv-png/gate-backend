const express = require("express");

const router = express.Router();

const {
  listHierarchy,
  updateHierarchy,
  deleteHierarchy,
  getMinhaHierarquia,
  getHierarchyPublic,
  getHierarchyPublicList,
  getHierarchyRocam,
  getHierarchyRocamList,
  listPolice
} = require("../controllers/hierarchyController");

const {
  protect
} = require("../middlewares/authMiddleware");

/* =========================================================
   USUÁRIO LOGADO — MINHA HIERARQUIA
========================================================= */

router.get(
  "/me",
  protect([
    "user",
    "admin",
    "superadmin",
    "comando"
  ]),
  getMinhaHierarquia
);

/* =========================================================
   PÚBLICO — HIERARQUIA GERAL

   NÃO USAR protect aqui.
========================================================= */

router.get(
  "/public",
  getHierarchyPublic
);

router.get(
  "/public/list",
  getHierarchyPublicList
);

/* =========================================================
   PÚBLICO — HIERARQUIA ROCAM

   NÃO USAR protect aqui.
========================================================= */

router.get(
  "/rocam",
  getHierarchyRocam
);

router.get(
  "/rocam/list",
  getHierarchyRocamList
);

/* =========================================================
   ADMINISTRAÇÃO
========================================================= */

router.get(
  "/",
  protect([
    "admin",
    "superadmin"
  ]),
  listHierarchy
);

router.get(
  "/police",
  protect([
    "admin",
    "superadmin"
  ]),
  listPolice
);

router.put(
  "/:id",
  protect([
    "admin",
    "superadmin"
  ]),
  updateHierarchy
);

router.delete(
  "/:id",
  protect([
    "admin",
    "superadmin"
  ]),
  deleteHierarchy
);

module.exports = router;