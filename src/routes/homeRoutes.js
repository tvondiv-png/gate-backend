const express = require("express");
const router = express.Router();
const controller = require("../controllers/homeController");

// 🌐 ROTA PÚBLICA
router.get("/", controller.getHomeData);

module.exports = router;
