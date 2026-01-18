const express = require("express");
const router = express.Router();

const {
  listAll,
  approve,
  reject
} = require("../controllers/indicationAdminController");

const { protect } = require("../middlewares/authMiddleware");

// 👑 admin / superadmin
router.get("/", protect(["admin", "superadmin"]), listAll);
router.post("/:id/aprovar", protect(["admin", "superadmin"]), approve);
router.post("/:id/rejeitar", protect(["admin", "superadmin"]), reject);

module.exports = router;
