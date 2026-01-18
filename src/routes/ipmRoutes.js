const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const controller = require("../controllers/ipmController");

// Somente SuperAdmin
router.use(protect(["superadmin"]));

router.get("/", controller.list);
router.post("/", controller.create);
router.post("/:id/comentario", controller.addComment);
router.post("/:id/convocar", controller.convocar);
router.post("/:id/concluir", controller.concluir);
router.delete("/:id", controller.delete); // ⬅️ NOVO

module.exports = router;
