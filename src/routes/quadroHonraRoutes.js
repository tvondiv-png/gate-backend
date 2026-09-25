const express = require("express");
const router = express.Router();
const { getQuadroHonra } = require("../controllers/quadroHonraController");

// 🔓 Público
router.get("/", getQuadroHonra);

module.exports = router;
