const express = require("express");
const router = express.Router();

const controller = require("../controllers/consultaPolicialController");
const { protect } = require("../middlewares/authMiddleware");

router.get(
  "/:funcional",
  protect(["admin", "superadmin"]),
  controller.buscarPolicial
);

module.exports = router;