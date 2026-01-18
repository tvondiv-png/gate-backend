const express = require("express");
const router = express.Router();

const { list, clear } = require("../controllers/logController");
const { protect } = require("../middlewares/authMiddleware");

// listar logs
router.get(
  "/",
  protect(["admin", "superadmin"]),
  list
);

// 🔴 zerar logs
router.delete(
  "/",
  protect(["superadmin"]),
  clear
);

module.exports = router;
