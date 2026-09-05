const express = require("express");
const router = express.Router();

const actionController = require("../controllers/actionController");
const { protect } = require("../middlewares/authMiddleware");

// ROTAS DE AÇÕES (USUÁRIO)
router.get("/rules", protect(), actionController.listRules);

router.post("/", protect(), actionController.createAction);

router.get("/mine", protect(), actionController.listMyActions);

router.get("/mine/:id", protect(), actionController.getMyActionById);

router.put("/:id/resubmit", protect(), actionController.resubmitAction);

module.exports = router;