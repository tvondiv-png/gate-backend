const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const controller = require("../controllers/disciplineController");

/**
 * ADMIN / SJD
 */
router.get("/", protect(["admin", "superadmin"]), controller.listCases);
router.get("/:id", protect(["admin", "superadmin"]), controller.getCaseById);
router.post("/", protect(["admin", "superadmin"]), controller.createCase);
router.post("/:id/comentario", protect(["admin", "superadmin"]), controller.addComentario);
router.post("/:id/convocar", protect(["admin", "superadmin"]), controller.convocar);
router.post("/:id/concluir", protect(["admin", "superadmin"]), controller.concluir);
router.delete("/:id", protect(["admin", "superadmin"]), controller.excluirCaso);

/**
 * USUÁRIO / POLICIAL
 */
router.get("/my/cases", protect(["user", "admin", "superadmin"]), controller.listMyCases);
router.get("/my/cases/:id", protect(["user", "admin", "superadmin"]), controller.getMyCaseById);
router.post("/my/cases/:id/ciencia", protect(["user", "admin", "superadmin"]), controller.confirmarCiencia);
router.post("/my/cases/:id/manifestacao", protect(["user", "admin", "superadmin"]), controller.enviarManifestacao);

module.exports = router;