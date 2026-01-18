const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const controller = require("../controllers/disciplineController");

router.use(protect(["superadmin"]));

router.get("/", controller.listCases);
router.post("/", controller.createCase);
router.post("/:id/comentario", controller.addComentario);
router.post("/:id/convocar", controller.convocar);
router.post("/:id/concluir", controller.concluir);
router.delete("/:id", controller.excluirCaso);

module.exports = router;
