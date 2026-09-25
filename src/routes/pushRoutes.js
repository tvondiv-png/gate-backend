const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const controller = require("../controllers/pushController");

// 🔓 Público — chave pública VAPID, necessária antes do login existir
router.get("/vapid-public-key", controller.getPublicKey);

router.post("/subscribe", protect(), controller.subscribe);
router.post("/unsubscribe", protect(), controller.unsubscribe);

module.exports = router;
