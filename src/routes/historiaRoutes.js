const express = require("express");
const router = express.Router();

const {
  getHistoria,
  updateHistoria,
  restaurarPadrao
} = require("../controllers/historiaController");

const { protect } = require("../middlewares/authMiddleware");

// 🔓 Público
router.get("/", getHistoria);

// 🔐 Admin e Superadmin
router.put("/", protect(["admin", "superadmin"]), updateHistoria);
router.post("/restaurar", protect(["admin", "superadmin"]), restaurarPadrao);

module.exports = router;
