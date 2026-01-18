const express = require("express");
const router = express.Router();

const {
  getHierarchy,
  updateHierarchy,
  deleteHierarchy,
  getMinhaHierarquia,
  getHierarchyPublic
} = require("../controllers/hierarchyController");

const { protect } = require("../middlewares/authMiddleware");

// 👤 USUÁRIO
router.get(
  "/me",
  protect(["user", "admin", "superadmin"]),
  getMinhaHierarquia
);

// 🌐 PÚBLICO
router.get("/public", getHierarchyPublic);

// 🧑‍💼 ADM
router.get(
  "/",
  protect(["admin", "superadmin"]),
  getHierarchy
);

router.put(
  "/:id",
  protect(["admin", "superadmin"]),
  updateHierarchy
);

router.delete(
  "/:id",
  protect(["admin", "superadmin"]),
  deleteHierarchy
);

module.exports = router;
