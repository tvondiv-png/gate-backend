const express = require("express");
const router = express.Router();

const {
  listPublic,
  listAdmin,
  reset
} = require("../controllers/seizureController");

const { protect } = require("../middlewares/authMiddleware");

// 🔓 Público (Home)
router.get("/public", listPublic);

// 🔐 Admin
router.get("/admin", protect(["admin", "superadmin"]), listAdmin);
router.post("/zerar", protect(["admin", "superadmin"]), reset);

module.exports = router;
